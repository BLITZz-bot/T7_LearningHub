"""
services/parser.py
Extracts raw text from uploaded resume files.
Priority order: pdfplumber → python-docx → pytesseract OCR fallback.
"""

import io
import pdfplumber
from docx import Document


def extract_text(file_bytes: bytes, mime_type: str) -> str:
    """
    Extract plain text from a resume file.
    Returns empty string if all methods fail.
    """
    mime = mime_type.lower()

    # ── DOCX / DOC ────────────────────────────────────────────────
    if any(x in mime for x in ("word", "officedocument", "msword", "docx", "doc")):
        text = _extract_docx(file_bytes)
        if text:
            return text

    # ── PDF ───────────────────────────────────────────────────────
    text = _extract_pdf(file_bytes)
    if text:
        return text

    # ── Try docx fallback (in case mime type was wrong/missing) ───
    text = _extract_docx(file_bytes)
    if text:
        return text

    # ── OCR fallback for scanned PDFs ─────────────────────────────
    text = _extract_ocr(file_bytes)
    if text:
        return text

    # ── Plain text ────────────────────────────────────────────────
    try:
        raw = file_bytes.decode("utf-8", errors="ignore")
        printable = "".join(c for c in raw if c.isprintable() or c in "\n\r\t")
        if len(printable) > 50:
            return printable.strip()
    except Exception:
        pass

    return ""


def _extract_pdf(file_bytes: bytes) -> str:
    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            pages = [page.extract_text() or "" for page in pdf.pages]
            text = "\n".join(pages).strip()
            if len(text) > 100:
                return text
    except Exception:
        pass
    return ""


def _extract_docx(file_bytes: bytes) -> str:
    try:
        doc = Document(io.BytesIO(file_bytes))
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        text = "\n".join(paragraphs).strip()
        if len(text) > 50:
            return text
    except Exception:
        pass
    return ""


def _extract_ocr(file_bytes: bytes) -> str:
    """OCR fallback for scanned PDFs — requires tesseract installed."""
    try:
        import pytesseract
        from PIL import Image
        import fitz  # PyMuPDF

        doc = fitz.open(stream=file_bytes, filetype="pdf")
        texts = []
        for page in doc:
            pix = page.get_pixmap(dpi=200)
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            texts.append(pytesseract.image_to_string(img))
        text = "\n".join(texts).strip()
        if len(text) > 50:
            return text
    except Exception:
        pass
    return ""
