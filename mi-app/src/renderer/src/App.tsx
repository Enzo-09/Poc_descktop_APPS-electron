import React, { useState } from "react";
import NoteForm from "./components/NoteForm";
import NoteList from "./components/NoteList";
import "../style.css";

export interface Note {
  id: number;
  title: string;
  content: string;
}

function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const addNote = (title: string, content: string) => {
    if (editingNote) {
      // Modo actualizar
      setNotes(
        notes.map((note) =>
          note.id === editingNote.id ? { ...note, title, content } : note
        )
      );
      setEditingNote(null);
    } else {
      // Modo crear
      const newNote: Note = { id: Date.now(), title, content };
      setNotes([...notes, newNote]);
    }
  };

  const deleteNote = (id: number) => {
    setNotes(notes.filter((note) => note.id !== id));
  };

  const editNote = (note: Note) => {
    setEditingNote(note);
  };

  return (
    <div className="app-container">
      <h1>Mini Notes</h1>
      <NoteForm addNote={addNote} editingNote={editingNote} />
      <NoteList
        notes={notes}
        onDeleteNote={deleteNote}
        onEditNote={editNote}
      />
    </div>
  );
}

export default App;
