"use client";

import React, { useState, useEffect } from "react";
import { 
  Library, 
  Upload, 
  FileText, 
  Folder, 
  Plus, 
  Search,
  Download,
  Trash2,
  ChevronRight,
  Book,
  X
} from "lucide-react";
import { toast } from "sonner";
import Modal from "@/components/common/Modal";

const API = "http://localhost:8001/api/t7";

interface LibraryData {
  [subject: string]: string[];
}

interface T7LibraryProps {
  initialSubject?: string | null;
}

export default function T7Library({ initialSubject = null }: T7LibraryProps) {
  const [library, setLibrary] = useState<LibraryData>({});
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(initialSubject);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewSubjectModalOpen, setIsNewSubjectModalOpen] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");

  const fetchLibrary = async () => {
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
  };

  useEffect(() => {
    fetchLibrary();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, subject: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("subject", subject);

    try {
      const res = await fetch(`${API}/library/upload`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      toast.success(`Uploaded ${file.name} to ${subject}`);
      fetchLibrary();
    } catch (err) {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const subjects = Object.keys(library);
  const filteredFiles = selectedSubject 
    ? library[selectedSubject].filter(f => f.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  return (
    <div className="flex h-full flex-col bg-[var(--background)] p-6 animate-fade-in overflow-hidden">
      {!initialSubject && (
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-[var(--foreground)]">
              <Library className="h-6 w-6 text-[var(--primary)]" />
              My Books & Notes
            </h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              Organize your study materials subject-wise (Secure Firebase Storage)
            </p>
          </div>
          
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input 
              type="text"
              placeholder="Search notes..."
              className="w-full rounded-full border border-[var(--border)]/50 bg-[var(--card)]/50 backdrop-blur-sm py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/20 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </header>
      )}

      <div className={`grid grid-cols-1 gap-6 ${initialSubject ? "" : "lg:grid-cols-4"} h-full overflow-hidden`}>
        {/* Subjects Sidebar */}
        {!initialSubject && (
          <div className="lg:col-span-1 border-r border-[var(--border)]/30 pr-4 overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] opacity-70">Subjects</h2>
              <button 
              onClick={() => setIsNewSubjectModalOpen(true)}
              className="p-1.5 hover:bg-[var(--primary)]/10 rounded-lg text-[var(--primary)] transition-colors"
              title="Add New Subject"
            >
              <Plus size={18} />
            </button>
          </div>

          <Modal
            isOpen={isNewSubjectModalOpen}
            onClose={() => {
              setIsNewSubjectModalOpen(false);
              setNewSubjectName("");
            }}
            title="Create New Subject"
            titleIcon={<Folder className="w-5 h-5 text-[var(--primary)]" />}
            footer={
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsNewSubjectModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--secondary)] rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (newSubjectName.trim()) {
                      setLibrary({ ...library, [newSubjectName.trim()]: [] });
                      setSelectedSubject(newSubjectName.trim());
                      setIsNewSubjectModalOpen(false);
                      setNewSubjectName("");
                    }
                  }}
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
                  if (e.key === "Enter" && newSubjectName.trim()) {
                    setLibrary({ ...library, [newSubjectName.trim()]: [] });
                    setSelectedSubject(newSubjectName.trim());
                    setIsNewSubjectModalOpen(false);
                    setNewSubjectName("");
                  }
                }}
              />
            </div>
          </Modal>
            
            <div className="space-y-1">
              {subjects.length === 0 && !loading && (
                <p className="text-xs text-[var(--muted-foreground)] italic">No subjects yet. Create one!</p>
              )}
              {subjects.map(subject => (
                <button
                  key={subject}
                  onClick={() => setSelectedSubject(subject)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-all ${
                    selectedSubject === subject 
                      ? "bg-[var(--primary)] text-white" 
                      : "text-[var(--foreground)] hover:bg-[var(--secondary)]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Folder size={16} />
                    <span>{subject}</span>
                  </div>
                  <span className="text-[10px] opacity-60">{library[subject].length} files</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Files Content */}
        <div className={`${initialSubject ? "col-span-1" : "lg:col-span-3"} flex flex-col overflow-hidden`}>
          {selectedSubject ? (
            <>
              <div className="mb-4 flex items-center justify-between border-b border-[var(--border)] pb-4">
                <div className="flex items-center gap-2">
                  <Book className="text-[var(--primary)]" size={20} />
                  <h2 className="text-lg font-semibold">{selectedSubject}</h2>
                </div>
                
                <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90 transition-opacity">
                  <Upload size={16} />
                  {uploading ? "Uploading..." : "Upload Note"}
                  <input 
                    type="file" 
                    className="hidden" 
                    disabled={uploading}
                    onChange={(e) => handleUpload(e, selectedSubject)} 
                  />
                </label>
              </div>

              <div className="flex-1 overflow-y-auto pr-2">
                {filteredFiles.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-[var(--muted-foreground)]">
                    <FileText size={48} className="mb-4 opacity-20" />
                    <p>No notes found in this subject.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredFiles.map((file, idx) => (
                      <div 
                        key={idx}
                        className="group relative flex flex-col rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 hover:shadow-md transition-all border-l-4 border-l-[var(--primary)]"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="bg-[var(--secondary)] p-2 rounded-lg text-[var(--primary)]">
                            <FileText size={20} />
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-1.5 hover:bg-[var(--secondary)] rounded text-[var(--muted-foreground)]">
                              <Download size={14} />
                            </button>
                            <button className="p-1.5 hover:bg-red-50 rounded text-red-500">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        <h3 className="text-sm font-medium line-clamp-2 mb-1 pr-4">{file}</h3>
                        <span className="text-[10px] text-[var(--muted-foreground)]">Added recently</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-[var(--muted-foreground)]">
              <div className="mb-6 rounded-full bg-[var(--primary)]/5 p-8 backdrop-blur-md border border-[var(--primary)]/10">
                <Library size={64} className="text-[var(--primary)] opacity-60" />
              </div>
              <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">Welcome to your Academy Workspace</h2>
              <p className="max-w-md text-center">Select a subject on the left to view your books and notes or upload new study materials. All your data is securely stored and synchronized with Firebase.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
