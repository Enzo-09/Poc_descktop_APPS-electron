import React, { useState } from 'react'
import { Note } from '../App'

interface NoteListProps {
  notes: Note[]
  onDeleteNote: (id: string) => void 
  onEditNote: (note: Note) => void
}
const MAX_CHARS_PREVIEW = 200

const NoteList: React.FC<NoteListProps> = ({ notes, onDeleteNote, onEditNote }) => {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString()
  }

  const toggleExpand = (id: string): void => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className="note-list">
      {notes.length === 0 ? (
        <div className="empty-state">
          <p>No hay notas. ¡Crea tu primera nota!</p>
        </div>
      ) : (
        notes.map((note) => {
          const isExpanded = expanded.has(note.id)
          const needsClamp = note.content.length > MAX_CHARS_PREVIEW
          const displayContent =
            needsClamp && !isExpanded
              ? note.content.substring(0, MAX_CHARS_PREVIEW) + '...'
              : note.content

          return (
            <div key={note.id} className={`note-item ${isExpanded ? 'expanded' : ''}`}>
              <div className="note-content-wrapper">
                <h3>{note.title}</h3>
                <p className="note-content">{displayContent}</p>
                {needsClamp && (
                  <button
                    className="view-more-btn"
                    onClick={() => toggleExpand(note.id)}
                    type="button"
                  >
                    {isExpanded ? 'Ver menos ▲' : 'Ver más ▼'}
                  </button>
                )}
              </div>

              <div className="note-footer">
                <div className="note-metadata">
                  <small>Creada: {formatDate(note.createdAt)}</small>
                  {note.updatedAt !== note.createdAt && (
                    <small>Editada: {formatDate(note.updatedAt)}</small>
                  )}
                </div>
                <div className="note-actions">
                  <button onClick={() => onEditNote(note)}>Editar</button>
                  <button onClick={() => onDeleteNote(note.id)} className="delete-btn">
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

export default NoteList
