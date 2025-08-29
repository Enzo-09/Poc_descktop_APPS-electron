import { randomUUID } from 'crypto'
import { listJsonFiles, readJson, writeJson, deleteFile } from './fsHelpers'
// eslint-disable-next-line no-console
console.log('[notesStore] módulo cargado')

export interface Note {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
}

export interface NoteCreateInput {
  title: string
  content: string
}

export interface NoteUpdateInput {
  title?: string
  content?: string
}

function fileName(id: string): string {
  return `${id}.json`
}

export async function listNotes(): Promise<Note[]> {
  const files = await listJsonFiles()
  const notes: Note[] = []
  for (const f of files) {
    const n = await readJson<Note>(f)
    if (n && n.id) notes.push(n)
  }
  return notes
}

export async function getNote(id: string): Promise<Note | null> {
  return (await readJson<Note>(fileName(id))) || null
}

export async function createNote(input: NoteCreateInput): Promise<Note> {
  const now = new Date().toISOString()
  const note: Note = {
    id: randomUUID(),
    title: sanitizeText(input.title),
    content: sanitizeText(input.content),
    createdAt: now,
    updatedAt: now
  }
  await writeJson(fileName(note.id), note)
  return note
}

export async function updateNote(id: string, patch: NoteUpdateInput): Promise<Note | null> {
  const existing = await getNote(id)
  if (!existing) return null
  if (patch.title !== undefined) existing.title = sanitizeText(patch.title)
  if (patch.content !== undefined) existing.content = sanitizeText(patch.content)
  existing.updatedAt = new Date().toISOString()
  await writeJson(fileName(id), existing)
  return existing
}

export async function deleteNoteById(id: string): Promise<boolean> {
  return deleteFile(fileName(id))
}

export async function seedNotes(count: number): Promise<number> {
  const safe = Math.min(Math.max(count, 0), 500) // límite
  for (let i = 0; i < safe; i++) {
    await createNote({
      title: `Nota ${i + 1}`,
      content: lorem()
    })
  }
  return safe
}

// Sanitización básica
function sanitizeText(t: string): string {
  return t.trim().slice(0, 10_000)
}

// Texto dummy
function lorem(): string {
  return 'Contenido de ejemplo ' + Math.random().toString(36).slice(2)
}
