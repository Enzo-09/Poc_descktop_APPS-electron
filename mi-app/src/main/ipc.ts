import { ipcMain } from 'electron'
import { listNotes, getNote, createNote, updateNote, deleteNoteById, seedNotes } from './notesStore'
import { measure, footprint, memoryUsage } from './metrics'

function ok<T>(data: T, ms?: number) {
  return { ok: true, data, ms }
}
function fail(message: string) {
  return { ok: false, error: message }
}

export const registerIpcHandlers = (): void => {
  ipcMain.handle('notes:list', async () => {
    const r = await measure(listNotes)
    return ok(r.data, r.ms)
  })

  ipcMain.handle('notes:get', async (_e, id: string) => {
    if (!validId(id)) return fail('id inválido')
    const r = await measure(() => getNote(id))
    if (!r.data) return fail('no encontrada')
    return ok(r.data, r.ms)
  })

  ipcMain.handle('notes:create', async (_e, input: { title: string; content: string }) => {
    if (!input || typeof input.title !== 'string' || typeof input.content !== 'string')
      return fail('input inválido')
    const r = await measure(() => createNote(input))
    return ok(r.data, r.ms)
  })

  ipcMain.handle(
    'notes:update',
    async (_e, id: string, patch: { title?: string; content?: string }) => {
      if (!validId(id)) return fail('id inválido')
      if (!patch || (patch.title === undefined && patch.content === undefined))
        return fail('patch vacío')
      const r = await measure(() => updateNote(id, patch))
      if (!r.data) return fail('no encontrada')
      return ok(r.data, r.ms)
    }
  )

  ipcMain.handle('notes:delete', async (_e, id: string) => {
    if (!validId(id)) return fail('id inválido')
    const r = await measure(() => deleteNoteById(id))
    if (!r.data) return fail('no encontrada')
    return ok(true, r.ms)
  })

  ipcMain.handle('notes:seed', async (_e, count: number) => {
    const r = await measure(() => seedNotes(Number(count) || 0))
    return ok({ created: r.data }, r.ms)
  })

  ipcMain.handle('notes:metrics:footprint', async () => {
    const r = await measure(footprint)
    return ok(r.data, r.ms)
  })

  ipcMain.handle('notes:metrics:memory', async () => {
    const r = await measure(async () => memoryUsage())
    return ok(r.data, r.ms)
  })
}

function validId(id: string): boolean {
  return typeof id === 'string' && /^[0-9a-fA-F-]{10,}$/.test(id)
}
