import React from 'react'
import { Note } from '../App'

interface NoteListProps {
  notes: Note[]
  onDeleteNote: (id: string) => void // Cambiado a string
  onEditNote: (note: Note) => void
}

const NoteList: React.FC<NoteListProps> = ({ notes, onDeleteNote, onEditNote }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="note-list">
      {notes.length === 0 ? (
        <div className="empty-state">
          <p>No hay notas. ¡Crea tu primera nota!</p>
        </div>
      ) : (
        notes.map((note) => (
          <div key={note.id} className="note">
            <h3>{note.title}</h3>
            <p>{note.content}</p>
            <div className="note-metadata">
              <small>Creada: {formatDate(note.createdAt)}</small>
              {note.updatedAt !== note.createdAt && (
                <small>Editada: {formatDate(note.updatedAt)}</small>
              )}
            </div>
            <div className="note-actions">
              <button onClick={() => onEditNote(note)}>✏️ Editar</button>
              <button onClick={() => onDeleteNote(note.id)} className="delete-btn">
                🗑️ Eliminar
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

export default NoteList
