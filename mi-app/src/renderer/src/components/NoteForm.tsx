import React, { useState, useEffect } from 'react'
import { Note } from '../App'

interface NoteFormProps {
  addNote: (title: string, content: string) => void
  editingNote: Note | null // Usar el tipo Note completo
}

const NoteForm: React.FC<NoteFormProps> = ({ addNote, editingNote }) => {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  useEffect(() => {
    if (editingNote) {
      setTitle(editingNote.title)
      setContent(editingNote.content)
    } else {
      setTitle('')
      setContent('')
    }
  }, [editingNote])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (title.trim() && content.trim()) {
      addNote(title.trim(), content.trim())
      if (!editingNote) {
        // Solo limpiar campos si estamos creando (no editando)
        setTitle('')
        setContent('')
      }
    }
  }

  const handleCancel = () => {
    setTitle('')
    setContent('')
  }

  return (
    <form onSubmit={handleSubmit} className="note-form">
      <input
        type="text"
        placeholder="Título de la nota"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <textarea
        placeholder="Escribe aquí el contenido de tu nota..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        required
      ></textarea>
      <div className="form-actions">
        <button type="submit" disabled={!title.trim() || !content.trim()}>
          {editingNote ? '✅ Actualizar Nota' : '➕ Crear Nota'}
        </button>
        {editingNote && (
          <button type="button" onClick={handleCancel} className="cancel-btn">
            ❌ Cancelar
          </button>
        )}
      </div>
    </form>
  )
}

export default NoteForm
