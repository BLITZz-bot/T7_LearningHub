"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Folder } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import BookLibrary from "./components/BookLibrary";
import T7Library from "@/components/knowledge/T7Library";
import Modal from "@/components/common/Modal";

type View = "list" | "detail";

const API = "http://localhost:8001/api/t7";

export default function BookPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center text-[var(--muted-foreground)]">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
        </div>
      }
    >
      <BookPageInner />
    </Suspense>
  );
}

function BookPageInner() {
  const { t } = useTranslation();
  const [library, setLibrary] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("list");
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");

  const fetchLibrary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/library/files`);
      if (!res.ok) throw new Error("Failed to fetch library");
      const data = await res.json();
      setLibrary(data);
    } catch (err) {
      console.error(err);
      toast.error("Could not load library");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLibrary();
  }, [fetchLibrary]);

  const handleNewBook = () => {
    setIsModalOpen(true);
  };

  const confirmCreateSubject = () => {
    const sub = newSubjectName.trim();
    if (sub) {
      if (library[sub]) {
        toast.error("Subject already exists");
        return;
      }
      setLibrary({ ...library, [sub]: [] });
      setSelectedSubject(sub);
      setIsModalOpen(false);
      setNewSubjectName("");
      toast.success(`Created subject: ${sub}`);
    }
  };

  const handleSelectBook = (id: string) => {
    setSelectedSubject(id);
    // We don't change view yet, maybe just show the T7Library component for that subject
  };

  const handleDeleteBook = async (id: string) => {
    if (!confirm(`Delete subject "${id}" and all its files?`)) return;
    // Implementation for delete would go here
    const newLib = { ...library };
    delete newLib[id];
    setLibrary(newLib);
    toast.success(`Deleted ${id}`);
  };

  // Convert Firebase subjects to "Book" objects for the BookLibrary UI
  const books = Object.entries(library).map(([subject, files]) => ({
    id: subject,
    title: subject,
    description: `${files.length} notes/files`,
    status: "ready" as const,
    chapter_count: files.length,
    page_count: files.length,
    updated_at: Date.now() / 1000,
  }));

  if (selectedSubject) {
    return (
      <div className="flex h-screen w-full flex-col overflow-hidden">
        <header className="flex items-center gap-4 border-b border-[var(--border)] px-6 py-3 bg-[var(--background)]">
          <button 
            onClick={() => setSelectedSubject(null)}
            className="text-sm font-medium text-[var(--primary)] hover:underline"
          >
            &larr; Back to Library
          </button>
          <h1 className="text-lg font-bold">{selectedSubject}</h1>
        </header>
        <div className="flex-1 overflow-hidden">
          <T7Library initialSubject={selectedSubject} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[var(--background)]">
      <main className="flex-1 overflow-hidden">
        <BookLibrary
          books={books}
          loading={loading}
          onNewBook={handleNewBook}
          onSelectBook={handleSelectBook}
          onDeleteBook={handleDeleteBook}
        />
      </main>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setNewSubjectName("");
        }}
        title="Create New Subject"
        titleIcon={<Folder className="w-5 h-5 text-[var(--primary)]" />}
        footer={
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--secondary)] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmCreateSubject}
              className="px-4 py-2 text-sm font-medium bg-[var(--primary)] text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              Create Subject
            </button>
          </div>
        }
      >
        <div className="p-6">
          <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">
            Subject Name
          </label>
          <input
            type="text"
            autoFocus
            placeholder="e.g. Mathematics, History, Physics..."
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--secondary)]/30 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/20 transition-all"
            value={newSubjectName}
            onChange={(e) => setNewSubjectName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") confirmCreateSubject();
            }}
          />
        </div>
      </Modal>
    </div>
  );
}
