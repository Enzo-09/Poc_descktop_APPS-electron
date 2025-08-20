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
    // Test básico que verifica la creación y recuperación de una nota individual
    // Propósito: Validar que el flujo básico de crear->obtener funciona correctamente
    const startTime = performance.now()

    const n = await createNote({ title: 'Hola', content: 'Contenido' })
    const fetched = await getNote(n.id)
    expect(fetched?.id).toBe(n.id)

    const endTime = performance.now()
    console.log(`⏱️ Tiempo para crear y obtener nota: ${(endTime - startTime).toFixed(2)}ms`)
  })

  it('lista varias notas', async () => {
    // Test que verifica el listado de múltiples notas
    // Propósito: Comprobar que la función listNotes retorna todas las notas creadas
    const startTime = performance.now()

    await createNote({ title: 'A', content: '1' })
    await createNote({ title: 'B', content: '2' })
    const list = await listNotes()
    expect(list.length).toBe(2)

    const endTime = performance.now()
    console.log(`⏱️ Tiempo para crear 2 notas y listarlas: ${(endTime - startTime).toFixed(2)}ms`)
  })

  it('actualiza nota', async () => {
    // Test que verifica la funcionalidad de actualización de notas existentes
    // Propósito: Validar que los cambios en una nota se persisten correctamente
    const startTime = performance.now()

    const n = await createNote({ title: 'T', content: 'Ini' })
    const upd = await updateNote(n.id, { content: 'Mod' })
    expect(upd?.content).toBe('Mod')

    const endTime = performance.now()
    console.log(`⏱️ Tiempo para crear y actualizar nota: ${(endTime - startTime).toFixed(2)}ms`)
  })

  it('borra nota', async () => {
    // Test que verifica la eliminación completa de una nota
    // Propósito: Comprobar que al eliminar una nota, esta ya no es accesible
    const startTime = performance.now()

    const n = await createNote({ title: 'T', content: 'C' })
    const ok = await deleteNoteById(n.id)
    expect(ok).toBe(true)
    const again = await getNote(n.id)
    expect(again).toBeNull()

    const endTime = performance.now()
    console.log(`⏱️ Tiempo para crear y eliminar nota: ${(endTime - startTime).toFixed(2)}ms`)
  })

  it('seed limita y crea', async () => {
    // Test que verifica la función seedNotes creando exactamente 5 notas
    // Propósito: Validar que la función seed respeta el límite especificado
    const startTime = performance.now()

    const created = await seedNotes(5)
    expect(created).toBe(5)
    const list = await listNotes()
    expect(list.length).toBe(5)

    const endTime = performance.now()
    console.log(`⏱️ Tiempo para crear 5 notas: ${(endTime - startTime).toFixed(2)}ms`)
  })

  it('test de rendimiento: crea 100 notas, lista y elimina', async () => {
    // Test de rendimiento que crea 100 notas, las lista y las elimina una por una
    // Propósito: Medir el rendimiento del sistema con un volumen mayor de notas
    console.log('🚀 Iniciando test de rendimiento con 100 notas...')

    // Fase 1: Crear 100 notas
    const createStartTime = performance.now()
    const created = await seedNotes(100)
    const createEndTime = performance.now()

    expect(created).toBe(100)
    console.log(`✅ Creadas ${created} notas en ${(createEndTime - createStartTime).toFixed(2)}ms`)

    // Fase 2: Listar todas las notas
    const listStartTime = performance.now()
    const list = await listNotes()
    const listEndTime = performance.now()

    expect(list.length).toBe(100)
    console.log(`📋 Listadas ${list.length} notas en ${(listEndTime - listStartTime).toFixed(2)}ms`)

    // Fase 3: Eliminar todas las notas una por una
    const deleteStartTime = performance.now()
    let deletedCount = 0
    for (const note of list) {
      const deleted = await deleteNoteById(note.id)
      if (deleted) deletedCount++
    }
    const deleteEndTime = performance.now()

    expect(deletedCount).toBe(100)
    console.log(
      `🗑️ Eliminadas ${deletedCount} notas en ${(deleteEndTime - deleteStartTime).toFixed(2)}ms`
    )

    // Verificar que no quedan notas
    const finalList = await listNotes()
    expect(finalList.length).toBe(0)

    const totalTime = deleteEndTime - createStartTime
    console.log(`🏁 Tiempo total del test: ${totalTime.toFixed(2)}ms`)

    // Crear reporte de rendimiento
    const report = {
      totalNotes: 100,
      createTime: createEndTime - createStartTime,
      listTime: listEndTime - listStartTime,
      deleteTime: deleteEndTime - deleteStartTime,
      totalTime: totalTime,
      avgCreatePerNote: (createEndTime - createStartTime) / 100,
      avgDeletePerNote: (deleteEndTime - deleteStartTime) / 100
    }

    console.log('📊 Reporte de rendimiento:', JSON.stringify(report, null, 2))
  })
})
