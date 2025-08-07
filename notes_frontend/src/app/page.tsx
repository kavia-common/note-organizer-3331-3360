"use client";

import React, { useEffect, useState } from "react";

type Note = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
};

const API_URL = process.env.NEXT_PUBLIC_NOTES_API_URL || "http://localhost:8000/api";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

// PUBLIC_INTERFACE
/**
 * Fetch all notes from backend
 */
async function fetchNotes(): Promise<Note[]> {
  const res = await fetch(`${API_URL}/notes`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load notes");
  return res.json();
}

// PUBLIC_INTERFACE
/**
 * Fetch a single note by id
 */
async function fetchNote(id: string): Promise<Note> {
  const res = await fetch(`${API_URL}/notes/${id}`);
  if (!res.ok) throw new Error("Failed to load note");
  return res.json();
}

// PUBLIC_INTERFACE
/**
 * Create a new note
 */
async function createNote(title: string, content: string): Promise<Note> {
  const res = await fetch(`${API_URL}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, content }),
  });
  if (!res.ok) throw new Error("Failed to create note");
  return res.json();
}

// PUBLIC_INTERFACE
/**
 * Update an existing note
 */
async function updateNote(id: string, title: string, content: string): Promise<Note> {
  const res = await fetch(`${API_URL}/notes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, content }),
  });
  if (!res.ok) throw new Error("Failed to update note");
  return res.json();
}

// PUBLIC_INTERFACE
/**
 * Delete a note by id
 */
async function deleteNote(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/notes/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete note");
}

// Sidebar component for listing notes
function Sidebar({
  notes,
  selectedId,
  onSelect,
  onAddNew,
}: {
  notes: Note[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  onAddNew: () => void;
}) {
  return (
    <aside className="w-full sm:w-64 border-r border-gray-100 bg-[#F7FAFC] flex-shrink-0">
      <div className="flex items-center justify-between p-4 border-b">
        <span className="font-semibold text-lg text-primary">Notes</span>
        <button
          className="rounded-full bg-accent p-1 text-primary shadow hover:bg-primary hover:text-accent transition"
          aria-label="Add note"
          onClick={onAddNew}
        >
          <span className="material-icons" aria-hidden>
            +
          </span>
        </button>
      </div>
      <ul className="overflow-y-auto h-[calc(100vh-64px)]">
        {notes.length === 0 && (
          <li className="p-4 italic text-gray-400">No notes yet…</li>
        )}
        {notes.map((n) => (
          <li
            key={n.id}
            onClick={() => onSelect(n.id)}
            className={classNames(
              "cursor-pointer px-4 py-3 border-b border-gray-100 hover:bg-accent/30",
              selectedId === n.id
                ? "bg-accent/60"
                : "bg-transparent"
            )}
            style={{ wordBreak: "break-word" }}
          >
            <div className="font-medium text-primary truncate">
              {n.title || "Untitled"}
            </div>
            <div className="text-xs text-gray-400 truncate">
              {n.content.replace(/\n/g, " ").substring(0, 50)}
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}

// Main details/editor pane
function NoteEditor({
  note,
  isNew,
  loading,
  onSave,
  onDelete,
  onChange,
}: {
  note: Note | null;
  isNew: boolean;
  loading: boolean;
  onSave: (title: string, content: string) => void;
  onDelete: () => void;
  onChange: (val: Partial<Note>) => void;
}) {
  const [localTitle, setLocalTitle] = useState(note?.title ?? "");
  const [localContent, setLocalContent] = useState(note?.content ?? "");

  useEffect(() => {
    setLocalTitle(note?.title ?? "");
    setLocalContent(note?.content ?? "");
  }, [note]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 flex flex-col gap-2 flex-1">
        <input
          className="text-2xl font-semibold border-b outline-none p-2 mb-2 bg-transparent focus:border-accent"
          placeholder="Title"
          value={localTitle}
          onChange={e => {
            setLocalTitle(e.target.value);
            onChange({ title: e.target.value });
          }}
          disabled={loading}
          maxLength={128}
        />
        <textarea
          className="flex-1 resize-none font-light outline-none border rounded p-3 text-base bg-white focus:border-secondary"
          style={{ minHeight: 120 }}
          placeholder="Write something…"
          value={localContent}
          onChange={e => {
            setLocalContent(e.target.value);
            onChange({ content: e.target.value });
          }}
          disabled={loading}
          maxLength={4000}
        />
      </div>
      <div className="flex justify-between items-center px-6 pb-6">
        <button
          className="bg-accent px-5 py-2 rounded text-primary font-medium shadow"
          disabled={loading || (!localTitle && !localContent)}
          onClick={() => onSave(localTitle, localContent)}
        >
          {isNew ? "Create" : "Save"}
        </button>
        {!isNew && (
          <button
            className="px-4 py-2 rounded text-white bg-red-500 hover:bg-red-700 text-sm"
            onClick={onDelete}
            disabled={loading}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
/**
 * The main Notes page
 */
export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  // Removed unused noteDraft and setNoteDraft for ESLint compliance
  const [isNewNote, setIsNewNote] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load all notes on first render
  useEffect(() => {
    setLoading(true);
    fetchNotes()
      .then((data) => setNotes(data))
      .catch(() => setError("Could not load notes"))
      .finally(() => setLoading(false));
  }, []);

  // When activeId changes, fetch that note
  useEffect(() => {
    if (activeId && !isNewNote) {
      setLoading(true);
      fetchNote(activeId)
        .then((data) => {
          setActiveNote(data);
        })
        .catch(() => setError("Could not fetch note"))
        .finally(() => setLoading(false));
    } else if (isNewNote) {
      setActiveNote({
        id: "new",
        title: "",
        content: "",
        created_at: "",
        updated_at: "",
      });
    } else {
      setActiveNote(null);
    }
  }, [activeId, isNewNote]);

  // Refresh notes after CRUD action
  const refresh = () => {
    fetchNotes()
      .then((data) => setNotes(data))
      .catch(() => setError("Could not load notes"));
  };

  const handleAddNew = () => {
    setIsNewNote(true);
    setActiveId("new");
    setActiveNote({
      id: "new",
      title: "",
      content: "",
      created_at: "",
      updated_at: "",
    });
    // Removed setNoteDraft
  };

  const handleSelectNote = (id: string) => {
    setIsNewNote(false);
    setActiveId(id);
  };

  const handleSave = async (title: string, content: string) => {
    try {
      setLoading(true);
      if (isNewNote) {
        await createNote(title, content);
      } else if (activeNote) {
        await updateNote(activeNote.id, title, content);
      }
      setIsNewNote(false);
      setActiveId(null);
      setActiveNote(null);
      refresh();
    } catch {
      setError("Could not save note");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!activeNote || isNewNote) return;
    try {
      setLoading(true);
      await deleteNote(activeNote.id);
      setActiveId(null);
      setActiveNote(null);
      setIsNewNote(false);
      refresh();
    } catch {
      setError("Could not delete note");
    } finally {
      setLoading(false);
    }
  };

  // For accessibility or fun, press "N" for new note
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.key === "n" || e.key === "N") && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleAddNew();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <main className="min-h-screen flex bg-white text-primary">
      <Sidebar
        notes={notes}
        selectedId={!isNewNote ? activeId : null}
        onSelect={handleSelectNote}
        onAddNew={handleAddNew}
      />
      <section className="flex-1 h-screen flex flex-col relative">
        <div className="border-b flex items-center justify-between px-8 py-4 bg-white">
          <span className="font-bold text-xl text-primary">
            {isNewNote ? "New Note" : activeNote?.title || "Select or create a note"}
          </span>
        </div>
        <div className="flex-1 relative overflow-y-auto bg-white">
          {(isNewNote || activeNote) ? (
            <NoteEditor
              note={activeNote}
              isNew={isNewNote}
              loading={loading}
              onChange={() => {}} // no-op since draft state is removed
              onSave={handleSave}
              onDelete={handleDelete}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center flex-col gap-2 text-gray-400">
              <span className="text-6xl">📝</span>
              <span>No note selected</span>
              <button
                className="mt-4 bg-secondary px-6 py-2 rounded text-white font-semibold hover:bg-accent hover:text-primary transition"
                onClick={handleAddNew}
              >
                + New Note
              </button>
            </div>
          )}
        </div>
        {/* Error Message */}
        {error && (
          <div className="absolute bottom-4 left-4 bg-accent text-primary rounded px-6 py-3 shadow">
            <span>{error}</span>
            <button
              className="ml-2 text-secondary font-bold"
              onClick={() => setError(null)}
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
