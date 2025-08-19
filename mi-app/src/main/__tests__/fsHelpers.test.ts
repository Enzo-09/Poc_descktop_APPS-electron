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
const { getDataDir, ensureDir, writeJson, readJson, listJsonFiles, deleteFile, dirSizeBytes } = helpers
// Depuración: mostrar claves exportadas
// eslint-disable-next-line no-console
console.log('fsHelpers exports:', Object.keys(helpers))

beforeEach(async () => {
  await fs.rm(getDataDir(), { recursive: true, force: true })
  await ensureDir()
})

describe('fsHelpers', () => {
  it('crea directorio y escribe/lee json', async () => {
    await writeJson('a.json', { x: 1 })
    const val = await readJson<{ x: number }>('a.json')
    expect(val?.x).toBe(1)
  })

  it('lista archivos json', async () => {
    await writeJson('a.json', { a: 1 })
    await writeJson('b.json', { b: 2 })
    const files = await listJsonFiles()
    expect(files.sort()).toEqual(['a.json', 'b.json'])
  })

  it('borra archivo', async () => {
    await writeJson('a.json', {})
    const deleted = await deleteFile('a.json')
    expect(deleted).toBe(true)
    const val = await readJson('a.json')
    expect(val).toBeNull()
  })

  it('calcula tamaño', async () => {
    await writeJson('a.json', { a: 'x'.repeat(50) })
    const size = await dirSizeBytes()
    expect(size).toBeGreaterThan(10)
  })
})
