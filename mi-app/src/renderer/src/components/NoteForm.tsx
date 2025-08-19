import React, { useState, useEffect } from "react";

interface NoteFormProps {
  addNote: (title: string, content: string) => void;
  editingNote: { id: number; title: string; content: string } | null;
}

const NoteForm: React.FC<NoteFormProps> = ({ addNote, editingNote }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (editingNote) {
      setTitle(editingNote.title);
      setContent(editingNote.content);
    }
  }, [editingNote]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && content.trim()) {
      addNote(title, content);
      setTitle("");
      setContent("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="note-form">
      <input
        type="text"
        placeholder="Título"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        placeholder="Contenido"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      ></textarea>
      <button type="submit">{editingNote ? "Actualizar" : "Agregar"}</button>
    </form>
  );
};

export default NoteForm;
