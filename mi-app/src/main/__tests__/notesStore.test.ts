import { describe, it, expect, beforeEach, vi } from 'vitest'
import { tmpdir } from 'os'
import { join } from 'path'
import { promises as fs } from 'fs'

const baseTmp = join(tmpdir(), 'mininotes-notesStore')
vi.mock('electron', () => ({
  app: { getPath: () => baseTmp }
}))

import { getDataDir, ensureDir } from '../fsHelpers'
import * as notes from '../notesStore'
const { createNote, listNotes, getNote, updateNote, deleteNoteById, seedNotes } = notes as any
// eslint-disable-next-line no-console
console.log('notesStore exports:', Object.keys(notes))

beforeEach(async () => {
  await fs.rm(getDataDir(), { recursive: true, force: true })
  await ensureDir()
})

describe('notesStore', () => {
  it('crea y obtiene nota', async () => {
    const n = await createNote({ title: 'Hola', content: 'Contenido' })
    const fetched = await getNote(n.id)
    expect(fetched?.id).toBe(n.id)
  })

  it('lista varias notas', async () => {
    await createNote({ title: 'A', content: '1' })
    await createNote({ title: 'B', content: '2' })
    const list = await listNotes()
    expect(list.length).toBe(2)
  })

  it('actualiza nota', async () => {
    const n = await createNote({ title: 'T', content: 'Ini' })
    const upd = await updateNote(n.id, { content: 'Mod' })
    expect(upd?.content).toBe('Mod')
  })

  it('borra nota', async () => {
    const n = await createNote({ title: 'T', content: 'C' })
    const ok = await deleteNoteById(n.id)
    expect(ok).toBe(true)
    const again = await getNote(n.id)
    expect(again).toBeNull()
  })

  it('seed limita y crea', async () => {
    const created = await seedNotes(5)
    expect(created).toBe(5)
    const list = await listNotes()
    expect(list.length).toBe(5)
  })
})
