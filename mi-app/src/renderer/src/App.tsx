import React, { useState, useEffect } from 'react'
import NoteForm from './components/NoteForm'
import NoteList from './components/NoteList'
import '../style.css'

// Tipos para la respuesta de la API
interface ApiResponse<T> {
  ok: boolean
  data?: T
  error?: string
}

// Tipos globales para window.api
declare global {
  interface Window {
    api: {
      notes: {
        list: () => Promise<ApiResponse<Note[]>>
        get: (id: string) => Promise<ApiResponse<Note>>
        create: (title: string, content: string) => Promise<ApiResponse<Note>>
        update: (
          id: string,
          patch: { title?: string; content?: string }
        ) => Promise<ApiResponse<Note>>
        delete: (id: string) => Promise<ApiResponse<void>>
        seed: (count: number) => Promise<ApiResponse<Note[]>>
      }
    }
    preloadReady: boolean
  }
}

export interface Note {
  id: string // Cambiado a string para UUID
  title: string
  content: string
  createdAt: string
  updatedAt: string
}

function App(): React.JSX.Element {
  const [notes, setNotes] = useState<Note[]>([])
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar notas al iniciar la app
  useEffect(() => {
    // Verificar si window.api está disponible
    console.log('[App] window.api disponible:', !!window.api)
    console.log('[App] window.api.notes disponible:', !!window.api?.notes)
    loadNotes()
  }, [])

  const loadNotes = async (): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      console.log('[App] Intentando cargar notas...')
      
      if (!window.api || !window.api.notes) {
        throw new Error('API no disponible - preload script no cargado')
      }
      
      const response = await window.api.notes.list()
      console.log('[App] Respuesta del backend:', response)
      
      if (response.ok) {
        setNotes(response.data || [])
        console.log('[App] Notas cargadas:', response.data?.length || 0)
      } else {
        setError(response.error || 'Error desconocido')
        console.error('[App] Error del backend:', response.error)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error conectando con el backend'
      setError(errorMsg)
      console.error('[App] Error cargando notas:', err)
    } finally {
      setLoading(false)
    }
  }

  const addNote = async (title: string, content: string): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      if (editingNote) {
        // Modo actualizar
        const response = await window.api.notes.update(editingNote.id, { title, content })
        if (response.ok) {
          setNotes(notes.map((note) => (note.id === editingNote.id ? response.data! : note)))
          setEditingNote(null)
        } else {
          setError(response.error || 'Error actualizando la nota')
        }
      } else {
        // Modo crear
        const response = await window.api.notes.create(title, content)
        if (response.ok) {
          setNotes([...notes, response.data!])
        } else {
          setError(response.error || 'Error creando la nota')
        }
      }
    } catch (err) {
      setError('Error guardando la nota')
      console.error('Error saving note:', err)
    } finally {
      setLoading(false)
    }
  }

  const deleteNote = async (id: string): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      const response = await window.api.notes.delete(id)
      if (response.ok) {
        setNotes(notes.filter((note) => note.id !== id))
      } else {
        setError(response.error || 'Error eliminando la nota')
      }
    } catch (err) {
      setError('Error eliminando la nota')
      console.error('Error deleting note:', err)
    } finally {
      setLoading(false)
    }
  }

  const editNote = (note: Note): void => {
    setEditingNote(note)
  }

  const clearError = (): void => {
    setError(null)
  }

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
          Recargar Notas
        </button>
        <span className="notes-count">
          {notes.length} nota{notes.length !== 1 ? 's' : ''}
        </span>
      </div>

      <NoteForm addNote={addNote} editingNote={editingNote} />
      <NoteList notes={notes} onDeleteNote={deleteNote} onEditNote={editNote} />
    </div>
  )
}

export default App
