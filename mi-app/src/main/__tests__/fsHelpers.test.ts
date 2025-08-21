import { describe, it, expect, beforeEach, vi } from 'vitest'
import { tmpdir } from 'os'
import { join } from 'path'
import { promises as fs } from 'fs'

const baseTmp = join(tmpdir(), 'mininotes-test')
vi.mock('electron', () => ({
  app: {
    getPath: () => baseTmp
  }
}))

import * as helpers from '../fsHelpers'
const { getDataDir, ensureDir, writeJson, readJson, listJsonFiles, deleteFile, dirSizeBytes } =
  helpers

console.log('fsHelpers exports:', Object.keys(helpers))

beforeEach(async () => {
  await fs.rm(getDataDir(), { recursive: true, force: true })
  await ensureDir()
})

describe('fsHelpers', () => {
  it('crea directorio y escribe/lee json', async () => {

    const testStartTime = performance.now()

    await writeJson('a.json', { x: 1 })
    const val = await readJson<{ x: number }>('a.json')
    expect(val?.x).toBe(1)

    const testEndTime = performance.now()
    console.log(
      `⏱️ Tiempo para escribir y leer JSON: ${(testEndTime - testStartTime).toFixed(2)}ms`
    )
  })

  it('lista archivos json', async () => {
    const testStartTime = performance.now()

    await writeJson('a.json', { a: 1 })
    await writeJson('b.json', { b: 2 })
    const files = await listJsonFiles()
    expect(files.sort()).toEqual(['a.json', 'b.json'])

    const testEndTime = performance.now()
    console.log(
      `⏱️ Tiempo para crear y listar 2 archivos JSON: ${(testEndTime - testStartTime).toFixed(2)}ms`
    )
  })

  it('borra archivo', async () => {
    const testStartTime = performance.now()

    await writeJson('a.json', {})
    const deleted = await deleteFile('a.json')
    expect(deleted).toBe(true)
    const val = await readJson('a.json')
    expect(val).toBeNull()

    const testEndTime = performance.now()
    console.log(
      `⏱️ Tiempo para crear y eliminar archivo: ${(testEndTime - testStartTime).toFixed(2)}ms`
    )
  })

  it('calcula tamaño', async () => {
    const testStartTime = performance.now()

    await writeJson('a.json', { a: 'x'.repeat(50) })
    const size = await dirSizeBytes()
    expect(size).toBeGreaterThan(10)

    const testEndTime = performance.now()
    console.log(
      `⏱️ Tiempo para calcular tamaño del directorio: ${(testEndTime - testStartTime).toFixed(2)}ms`
    )
    console.log(`📏 Tamaño del directorio: ${size} bytes`)
  })
})
