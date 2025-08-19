import React, { useState, useEffect } from "react";
import NoteForm from "./components/NoteForm";
import NoteList from "./components/NoteList";
import "../style.css";

// Tipos globales para window.api
declare global {
  interface Window {
    api: {
      notes: {
        list: () => Promise<any>
        get: (id: string) => Promise<any>
        create: (title: string, content: string) => Promise<any>
        update: (id: string, patch: { title?: string; content?: string }) => Promise<any>
        delete: (id: string) => Promise<any>
        seed: (count: number) => Promise<any>
      }
    }
  }
}

export interface Note {
  id: string; // Cambiado a string para UUID
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar notas al iniciar la app
  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await window.api.notes.list();
      if (response.ok) {
        setNotes(response.data);
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError('Error conectando con el backend');
      console.error('Error loading notes:', err);
    } finally {
      setLoading(false);
    }
  };

  const addNote = async (title: string, content: string) => {
    setLoading(true);
    setError(null);
    try {
      if (editingNote) {
        // Modo actualizar
        const response = await window.api.notes.update(editingNote.id, { title, content });
        if (response.ok) {
          setNotes(notes.map(note => 
            note.id === editingNote.id ? response.data : note
          ));
          setEditingNote(null);
        } else {
          setError(response.error);
        }
      } else {
        // Modo crear
        const response = await window.api.notes.create(title, content);
        if (response.ok) {
          setNotes([...notes, response.data]);
        } else {
          setError(response.error);
        }
      }
    } catch (err) {
      setError('Error guardando la nota');
      console.error('Error saving note:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteNote = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await window.api.notes.delete(id);
      if (response.ok) {
        setNotes(notes.filter(note => note.id !== id));
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError('Error eliminando la nota');
      console.error('Error deleting note:', err);
    } finally {
      setLoading(false);
    }
  };

  const editNote = (note: Note) => {
    setEditingNote(note);
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <div className="app-container">
      <h1>Mini Notes</h1>
      
      {/* Indicador de carga */}
      {loading && <div className="loading">Guardando...</div>}
      
      {/* Mensajes de error */}
      {error && (
        <div className="error-message">
          <span>{error}</span>
          <button onClick={clearError}>×</button>
        </div>
      )}
      
      {/* Botón para recargar notas */}
      <div className="actions">
        <button onClick={loadNotes} disabled={loading}>
          🔄 Recargar Notas
        </button>
        <span className="notes-count">
          {notes.length} nota{notes.length !== 1 ? 's' : ''}
        </span>
      </div>

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
