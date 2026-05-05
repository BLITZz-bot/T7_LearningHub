import os
import re
import json
import tempfile
import subprocess
from typing import Optional, Any
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import asyncio

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import fitz  # PyMuPDF
from deeptutor.services.llm import complete
import firebase_admin
from firebase_admin import credentials, storage
from dotenv import load_dotenv

router = APIRouter()

# Load environment variables
load_dotenv()

# --- Config & Initialization ---
# GROQ_API_KEY no longer needed directly as deeptutor.services.llm handles it
# groq_client removed in favor of unified deeptutor.services.llm.complete

FIREBASE_CONFIG = os.getenv("FIREBASE_CONFIG_JSON")
FIREBASE_BUCKET = os.getenv("FIREBASE_STORAGE_BUCKET")
firebase_app = None

if FIREBASE_CONFIG and FIREBASE_BUCKET:
    try:
        # Check if already initialized to avoid error
        try:
            firebase_app = firebase_admin.get_app()
        except ValueError:
            cred = credentials.Certificate(json.loads(FIREBASE_CONFIG))
            firebase_app = firebase_admin.initialize_app(cred, {
                'storageBucket': FIREBASE_BUCKET
            })
    except Exception as e:
        print(f" [T7 HUB] Firebase initialization failed: {e}")

# In-memory session store
sessions: dict = {}

# --- Helper Functions ---

async def generate_text(prompt: Any, temperature: float = 0.7, max_tokens: int = 1024, json_mode: bool = False):
    try:
        # Use DeepTutor's built-in completion service which has automatic retries
        response = await complete(
            prompt, 
            temperature=temperature, 
            max_tokens=max_tokens,
            # json_mode is handled by the provider if supported
        )
        return response
    except Exception as e:
        raise HTTPException(500, f"AI Generation Failed: {str(e)}")

def smart_split(text: str, max_words: int = 350) -> list[str]:
    """Instantly split text by structural markers (headings/numbered sections),
    then by paragraphs, keeping each chunk under max_words."""
    # Try to detect headings: ALL CAPS lines, numbered sections (1. / 1.1), or markdown headings
    heading_pattern = re.compile(
        r'(?m)^(?:(?:[A-Z][A-Z ]{4,})|(?:\d+\.(?:\d+\.?)* .+)|(?:#{1,3} .+)|(?:Chapter \d+.+)|(?:Unit \d+.+))$'
    )
    matches = list(heading_pattern.finditer(text))

    sections: list[str] = []
    if len(matches) >= 3:
        # Split on detected headings
        for i, m in enumerate(matches):
            start = m.start()
            end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
            section = text[start:end].strip()
            if section:
                sections.append(section)
    else:
        # Fallback: split on double newlines (paragraphs)
        sections = [p.strip() for p in text.split("\n\n") if len(p.strip()) > 80]

    # Merge very short sections and split very long ones
    chunks: list[str] = []
    current = ""
    current_words = 0
    for sec in sections:
        sec_words = len(sec.split())
        if sec_words > max_words * 2:
            # Section is too long → split into paragraphs
            sub_paras = [p.strip() for p in sec.split("\n\n") if p.strip()]
            for para in sub_paras:
                para_words = len(para.split())
                if current_words + para_words > max_words and current:
                    chunks.append(current.strip())
                    current = para + "\n\n"
                    current_words = para_words
                else:
                    current += para + "\n\n"
                    current_words += para_words
        elif current_words + sec_words > max_words and current:
            chunks.append(current.strip())
            current = sec + "\n\n"
            current_words = sec_words
        else:
            current += sec + "\n\n"
            current_words += sec_words
    if current.strip():
        chunks.append(current.strip())

    return chunks if chunks else [text[:4000]]

def extract_pdf_text(file_bytes: bytes) -> str:
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    text_parts = [page.get_text() for page in doc]
    doc.close()
    return "\n\n".join(text_parts)

def get_youtube_transcript(url: str) -> str:
    with tempfile.TemporaryDirectory() as tmpdir:
        sub_file = os.path.join(tmpdir, "subs")
        try:
            subprocess.run(
                ["yt-dlp", "--write-auto-sub", "--sub-lang", "en", "--skip-download", "--sub-format", "vtt", "-o", sub_file, url],
                capture_output=True, text=True, timeout=60, check=True,
            )
            for f in Path(tmpdir).glob("*.vtt"):
                raw = f.read_text(encoding="utf-8", errors="ignore")
                lines = []
                for line in raw.splitlines():
                    line = line.strip()
                    if not line or line.startswith(("WEBVTT", "Kind:", "Language:")) or "-->" in line or line.isdigit():
                        continue
                    if lines and lines[-1] == line:
                        continue
                    lines.append(line)
                return " ".join(lines)
        except Exception:
            pass
    return ""

# --- Prompts ---

MODE_PROMPTS = {
    "story": """You are a master storyteller teacher. Explain the following concept as a vivid, engaging story with characters, real-life analogies, and a narrative flow. Make it memorable and easy to follow. CONCEPT:\n{content}""",
    "simple": """Explain the following concept in the simplest way possible. Use short sentences, bullet points, everyday analogies, and avoid all jargon. Imagine you're explaining to a 12-year-old. CONCEPT:\n{content}""",
    "exam": """You are an exam coach. For the following concept provide:
1. A crisp definition
2. Key points to remember (bullet list)
3. Common exam questions with model answers
4. Memory tips/mnemonics
CONCEPT:\n{content}""",
}

QUIZ_PROMPT = "Based on the following concept, generate exactly 4 multiple-choice questions. Return ONLY valid JSON: [{{\"question\": \"...\", \"options\": {{\"A\": \"...\", \"B\": \"...\", \"C\": \"...\", \"D\": \"...\"}}, \"correct\": \"A\"}}]. CONCEPT:\n{content}"
TITLE_PROMPT = "Give a short, descriptive title (max 8 words) for this academic concept. Return ONLY the title.\n\n{content}"
TUTOR_PROMPT = "You are T7, an AI Learning Assistant. Use this context to answer the student concisely (max 3 sentences). CONTEXT:\n{content}\n\nQUESTION: {query}"

TOPIC_SPLIT_PROMPT = """You are an expert academic content analyzer.
Read the following text and identify distinct topics or concepts within it.
For each topic provide:
- A clear, concise title (max 8 words)
- The full relevant content for that topic

Extract between 3 and 12 topics depending on content length.
Return ONLY valid JSON (no markdown, no extra text):
[{{"title": "Topic Title Here", "content": "Full topic content here..."}}]

TEXT TO ANALYZE:
{text}"""

# --- Helper: Fast Topic Extraction ---

async def extract_topics(text: str) -> list[dict]:
    """Fast two-phase approach: instant structural split + parallel title generation."""
    raw_sections = smart_split(text)

    async def get_title(section_text: str, idx: int) -> str:
        snippet = section_text[:400]  # Only send first 400 chars for title
        try:
            title = await generate_text(
                f"Give a short topic title (max 6 words) for this academic text. Reply with ONLY the title, nothing else.\n\n{snippet}",
                max_tokens=15,
                temperature=0.1,
            )
            return title.strip().strip('"').strip("'").strip(".")[:60]
        except:
            return f"Topic {idx + 1}"

    # Generate all titles in parallel → fast!
    titles = await asyncio.gather(*[get_title(s, i) for i, s in enumerate(raw_sections)])

    return [
        {"id": i + 1, "title": titles[i], "text": raw_sections[i]}
        for i in range(len(raw_sections))
    ]

# --- Endpoints ---

@router.get("/health")
def health():
    return {"status": "ok", "message": "T7 Hub Router is active"}

@router.post("/upload/pdf")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Only PDF files supported")
    content = await file.read()
    text = await asyncio.to_thread(extract_pdf_text, content)
    if not text.strip():
        raise HTTPException(400, "Could not extract text from PDF")
    
    # AI-powered topic extraction
    titled_chunks = await extract_topics(text)
    
    session_id = f"session_{len(sessions) + 1}"
    sessions[session_id] = {"chunks": titled_chunks, "current_chunk": 0, "mode": "story", "scores": [], "xp": 0, "streak": 0, "badges": []}
    return {"session_id": session_id, "total_chunks": len(titled_chunks), "chunks": titled_chunks}

@router.post("/upload/youtube")
async def upload_youtube(url: str = Form(...)):
    transcript = await asyncio.to_thread(get_youtube_transcript, url)
    if not transcript:
        try:
            transcript = await generate_text(f"Summarize the educational content of this video in detail: {url}")
        except:
            raise HTTPException(400, "Could not process YouTube URL")
    
    titled_chunks = await extract_topics(transcript)
    
    session_id = f"session_{len(sessions) + 1}"
    sessions[session_id] = {"chunks": titled_chunks, "current_chunk": 0, "mode": "story", "scores": [], "xp": 0, "streak": 0, "badges": []}
    return {"session_id": session_id, "total_chunks": len(titled_chunks), "chunks": titled_chunks}

@router.post("/generate")
async def generate_content(session_id: str = Form(...), chunk_id: int = Form(...), mode: str = Form("story")):
    if session_id not in sessions: raise HTTPException(404, "Session not found")
    session = sessions[session_id]
    chunk = next((c for c in session["chunks"] if c["id"] == chunk_id), None)
    if not chunk: raise HTTPException(404, "Chunk not found")
    
    prompt = MODE_PROMPTS.get(mode, MODE_PROMPTS["story"]).format(content=chunk["text"])
    generated = await generate_text(prompt, max_tokens=2048)
    session["mode"] = mode
    session["current_chunk"] = chunk_id
    return {"chunk_id": chunk_id, "chunk_title": chunk.get("title"), "mode": mode, "content": generated}

@router.post("/quiz")
async def generate_quiz(session_id: str = Form(...), chunk_id: int = Form(...)):
    if session_id not in sessions: raise HTTPException(404, "Session not found")
    session = sessions[session_id]
    chunk = next((c for c in session["chunks"] if c["id"] == chunk_id), None)
    if not chunk: raise HTTPException(404, "Chunk not found")
    
    try:
        raw = await generate_text(QUIZ_PROMPT.format(content=chunk["text"]), temperature=0.1, json_mode=True)
        if "```json" in raw: raw = raw.split("```json")[1].split("```")[0].strip()
        questions = json.loads(raw)
        if isinstance(questions, dict) and "questions" in questions: questions = questions["questions"]
    except:
        questions = [{"question": "Ready to proceed?", "options": {"A": "Yes", "B": "No", "C": "Maybe", "D": "Sure"}, "correct": "A"}]
    return {"chunk_id": chunk_id, "questions": questions}

@router.post("/adapt")
async def adapt_mode(session_id: str = Form(...), score: int = Form(...)):
    if session_id not in sessions: raise HTTPException(404, "Session not found")
    session = sessions[session_id]
    session["scores"].append(score)
    
    xp_earned = 100 if score >= 90 else 75 if score >= 75 else 50 if score >= 50 else 10
    if score >= 50: session["streak"] += 1
    else: session["streak"] = 0
    
    streak_bonus = min(session["streak"], 5) * 25
    session["xp"] += (xp_earned + streak_bonus)
    
    new_mode = "exam" if score >= 75 else "story" if score >= 50 else "simple"
    message = "Excellent! Let's get exam-ready." if score >= 90 else "Good progress!"
    
    session["mode"] = new_mode
    next_chunk_id = session["current_chunk"] + 1
    completed = next_chunk_id > len(session["chunks"])
    
    return {
        "new_mode": new_mode, "message": message, "completed": completed,
        "xp_earned": xp_earned, "total_xp": session["xp"], "streak": session["streak"]
    }

@router.post("/tutor_chat")
async def tutor_chat(session_id: str = Form(...), chunk_id: int = Form(...), query: str = Form(...)):
    if session_id not in sessions: raise HTTPException(404, "Session not found")
    session = sessions[session_id]
    chunk = next((c for c in session["chunks"] if c["id"] == chunk_id), None)
    context = chunk["text"] if chunk else "No context"
    answer = await generate_text(TUTOR_PROMPT.format(content=context, query=query), max_tokens=256)
    return {"answer": answer.strip()}

@router.post("/library/upload")
async def library_upload(file: UploadFile = File(...), subject: str = Form(...)):
    if not firebase_app:
        upload_dir = Path("data/library") / subject
        upload_dir.mkdir(parents=True, exist_ok=True)
        with open(upload_dir / file.filename, "wb") as f: f.write(await file.read())
        return {"status": "success", "message": "Saved locally"}
    
    bucket = storage.bucket()
    blob = bucket.blob(f"library/{subject}/{file.filename}")
    blob.upload_from_string(await file.read(), content_type=file.content_type)
    return {"status": "success", "message": "Uploaded to Firebase"}

@router.get("/library/files")
async def library_list():
    lib = {}
    if not firebase_app:
        root = Path("data/library")
        if root.exists():
            for d in root.iterdir():
                if d.is_dir(): lib[d.name] = [f.name for f in d.iterdir() if f.is_file()]
        return lib
    
    bucket = storage.bucket()
    for b in bucket.list_blobs(prefix="library/"):
        p = b.name.split("/")
        if len(p) >= 3:
            if p[1] not in lib: lib[p[1]] = []
            lib[p[1]].append(p[2])
    return lib
