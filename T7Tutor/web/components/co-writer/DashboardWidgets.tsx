"use client";

import { useState, useEffect } from "react";
import { 
  CheckCircle2, 
  Circle, 
  Plus, 
  Trash2, 
  Calendar as CalendarIcon, 
  BrainCircuit, 
  ListTodo,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Maximize2
} from "lucide-react";
import Modal from "@/components/common/Modal";

// --- Types ---
interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

interface Flashcard {
  id: string;
  question: string;
  answer: string;
}

// --- Utils ---
const getLocalStorage = (key: string, fallback: any) => {
  if (typeof window === "undefined") return fallback;
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return fallback;
    const parsed = JSON.parse(saved);
    // Ensure we always return an array if the fallback is an array
    if (Array.isArray(fallback) && !Array.isArray(parsed)) {
      return fallback;
    }
    return parsed;
  } catch (e) {
    console.error(`Error loading ${key} from localStorage:`, e);
    return fallback;
  }
};

const setLocalStorage = (key: string, value: any) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

// --- Todo Widget ---
export function TodoWidget() {
  const [todos, setTodos] = useState<Todo[]>(() => getLocalStorage("t7-todos", []));
  const [input, setInput] = useState("");

  useEffect(() => setLocalStorage("t7-todos", todos), [todos]);

  const addTodo = () => {
    console.log("Adding todo:", input);
    if (!input.trim()) return;
    const newTodo = { id: Date.now().toString(), text: input.trim(), completed: false };
    setTodos(prev => [...prev, newTodo]);
    setInput("");
  };

  const toggleTodo = (id: string) => {
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(t => t.id !== id));
  };

  return (
    <div className="flex flex-col h-[300px] bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)] bg-[var(--secondary)]/20">
        <ListTodo className="w-4 h-4 text-[var(--primary)]" />
        <h3 className="text-sm font-bold text-[var(--foreground)] uppercase tracking-tight">To-Do Goals</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {todos.length === 0 && (
          <p className="text-xs text-[var(--muted-foreground)] italic text-center py-8">No goals set yet...</p>
        )}
        {todos.map(todo => (
          <div key={todo.id} className="flex items-center gap-2 group animate-in slide-in-from-left-2 duration-200">
            <button onClick={() => toggleTodo(todo.id)} className="shrink-0 transition-transform active:scale-90">
              {todo.completed ? 
                <CheckCircle2 className="w-4 h-4 text-[var(--primary)]" /> : 
                <Circle className="w-4 h-4 text-[var(--muted-foreground)]" />
              }
            </button>
            <span className={`text-sm flex-1 truncate ${todo.completed ? "line-through text-[var(--muted-foreground)]" : "text-[var(--foreground)]"}`}>
              {todo.text}
            </span>
            <button onClick={() => deleteTodo(todo.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-rose-500/10 hover:text-rose-500 rounded transition-all">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-[var(--border)] flex gap-2">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTodo()}
          placeholder="Add a goal..."
          className="flex-1 bg-[var(--secondary)]/30 border border-[var(--border)] rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-[var(--primary)]/30"
        />
        <button onClick={addTodo} className="bg-[var(--primary)] text-white p-1.5 rounded-lg hover:opacity-90 active:scale-95 transition-all">
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// --- Flashcard Widget ---
export function FlashcardWidget() {
  const [cards, setCards] = useState<Flashcard[]>(() => getLocalStorage("t7-flashcards", []));
  const [questionInput, setQuestionInput] = useState("");
  const [answerInput, setAnswerInput] = useState("");
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});
  const [isFullViewOpen, setIsFullViewOpen] = useState(false);

  useEffect(() => setLocalStorage("t7-flashcards", cards), [cards]);

  const addCard = () => {
    if (!questionInput.trim() || !answerInput.trim()) return;
    const newCard = { 
      id: Date.now().toString(), 
      question: questionInput.trim(), 
      answer: answerInput.trim() 
    };
    setCards(prev => [...prev, newCard]);
    setQuestionInput("");
    setAnswerInput("");
  };

  const deleteCard = (id: string) => {
    setCards(cards.filter(c => c.id !== id));
  };

  const toggleFlip = (id: string) => {
    setFlippedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <>
      <div 
        onClick={() => setIsFullViewOpen(true)}
        className="flex flex-col h-[300px] bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm transition-all hover:shadow-lg cursor-pointer group hover:border-amber-500/40"
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)] bg-[var(--secondary)]/20">
          <BrainCircuit className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-bold text-[var(--foreground)] uppercase tracking-tight">Flash Cards</h3>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-4">
          <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
            <Maximize2 className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wider">{cards.length} FLASH Cards</p>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">Tap to open full screen study mode</p>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isFullViewOpen}
        onClose={() => setIsFullViewOpen(false)}
        title="FLASH Card Study Mode"
        titleIcon={<BrainCircuit className="w-5 h-5 text-amber-500" />}
        width="2xl"
      >
        <div className="flex flex-col h-[85vh]">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cards.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <BrainCircuit className="w-12 h-12 text-amber-500/20 mb-4" />
                <p className="text-sm text-[var(--muted-foreground)] italic">No flashcards yet. Add your first one below!</p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cards.map(card => {
                const isFlipped = flippedCards[card.id];
                return (
                  <div 
                    key={card.id} 
                    onClick={() => toggleFlip(card.id)}
                    className="relative h-48 perspective-1000 cursor-pointer group"
                  >
                    <div className={`relative w-full h-full transition-all duration-500 preserve-3d ${isFlipped ? "rotate-y-180" : ""}`}>
                      <div className="absolute inset-0 backface-hidden bg-[var(--card)] border border-[var(--border)] shadow-sm rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:border-amber-500/30 transition-colors">
                        <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest absolute top-4 left-4">Question</span>
                        <p className="text-sm font-medium leading-relaxed">{card.question}</p>
                      </div>
                      
                      <div className="absolute inset-0 backface-hidden bg-emerald-500/[0.03] border border-emerald-500/20 shadow-inner rounded-2xl p-6 flex flex-col items-center justify-center text-center rotate-y-180">
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest absolute top-4 left-4">Answer</span>
                        <p className="text-sm font-semibold leading-relaxed text-[var(--foreground)] italic">{card.answer}</p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteCard(card.id); }} 
                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-2 hover:bg-rose-500/10 hover:text-rose-500 rounded-xl transition-all z-10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-6 border-t border-[var(--border)] bg-[var(--secondary)]/10">
            <div className="max-w-3xl mx-auto space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)] ml-1">Question</label>
                  <input 
                    type="text" 
                    value={questionInput}
                    onChange={(e) => setQuestionInput(e.target.value)}
                    placeholder="Enter the question..."
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)] ml-1">Answer</label>
                  <input 
                    type="text" 
                    value={answerInput}
                    onChange={(e) => setAnswerInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addCard()}
                    placeholder="Enter the answer..."
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
              </div>
              <button 
                onClick={addCard} 
                className="w-full bg-amber-500 text-white py-2.5 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all text-sm font-bold shadow-lg shadow-amber-500/20"
              >
                Add New Flashcard
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}

// --- Calendar Widget ---
export function CalendarWidget() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [notes, setNotes] = useState<Record<string, string>>(() => getLocalStorage("t7-calendar-notes", {}));
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [noteInput, setNoteInput] = useState("");

  useEffect(() => setLocalStorage("t7-calendar-notes", notes), [notes]);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const today = new Date();
  const isToday = (d: number | null) => 
    d === today.getDate() && 
    currentDate.getMonth() === today.getMonth() && 
    currentDate.getFullYear() === today.getFullYear();

  const getDateKey = (day: number) => 
    `${currentDate.getFullYear()}-${currentDate.getMonth()}-${day}`;

  const openNoteModal = (day: number) => {
    setSelectedDay(day);
    setNoteInput(notes[getDateKey(day)] || "");
  };

  const saveNote = () => {
    if (selectedDay !== null) {
      const key = getDateKey(selectedDay);
      if (noteInput.trim()) {
        setNotes({ ...notes, [key]: noteInput.trim() });
      } else {
        const newNotes = { ...notes };
        delete newNotes[key];
        setNotes(newNotes);
      }
      setSelectedDay(null);
    }
  };

  return (
    <div className="w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm transition-all hover:shadow-md mt-6">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--secondary)]/20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[var(--primary)]/10 rounded-lg">
            <CalendarIcon className="w-5 h-5 text-[var(--primary)]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--foreground)]">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h3>
            <p className="text-xs text-[var(--muted-foreground)]">Plan your study schedule</p>
          </div>
        </div>
        <div className="flex gap-1">
          <button onClick={prevMonth} className="p-2 hover:bg-[var(--secondary)] rounded-full transition-colors"><ChevronLeft className="w-4 h-4" /></button>
          <button onClick={nextMonth} className="p-2 hover:bg-[var(--secondary)] rounded-full transition-colors"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
            <div key={d} className="text-center text-[10px] font-bold text-[var(--muted-foreground)] uppercase pb-2">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((d, i) => (
            <div 
              key={i} 
              onClick={() => d && openNoteModal(d)}
              className={`h-24 p-2 border border-[var(--border)]/30 rounded-lg transition-all ${
                d ? "hover:bg-[var(--secondary)]/50 cursor-pointer" : "bg-transparent border-none"
              } ${isToday(d) ? "border-[var(--primary)] bg-[var(--primary)]/5" : ""}`}
            >
              {d && (
                <>
                  <div className="flex justify-between items-start">
                    <span className={`text-xs font-bold ${isToday(d) ? "text-[var(--primary)]" : "text-[var(--muted-foreground)]"}`}>{d}</span>
                    {notes[getDateKey(d)] && <MessageSquare className="w-2.5 h-2.5 text-[var(--primary)] opacity-60" />}
                  </div>
                  {/* Note preview */}
                  <div className="mt-1 overflow-hidden">
                    <p className="text-[9px] text-[var(--muted-foreground)] line-clamp-3 leading-tight">
                      {notes[getDateKey(d)]}
                    </p>
                    {isToday(d) && <div className="mt-1 h-1 w-full bg-[var(--primary)] rounded-full opacity-30 animate-pulse" />}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <Modal
        isOpen={selectedDay !== null}
        onClose={() => setSelectedDay(null)}
        title={`Note for ${selectedDay} ${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
        titleIcon={<CalendarIcon className="w-5 h-5 text-[var(--primary)]" />}
        footer={
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setSelectedDay(null)}
              className="px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--secondary)] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={saveNote}
              className="px-4 py-2 text-sm font-medium bg-[var(--primary)] text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              Save Note
            </button>
          </div>
        }
      >
        <div className="p-6">
          <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">
            What's happening on this day?
          </label>
          <textarea
            autoFocus
            rows={4}
            placeholder="Enter your notes or goals for this day..."
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--secondary)]/30 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/20 transition-all resize-none"
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
          />
        </div>
      </Modal>

      <style jsx global>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
}
