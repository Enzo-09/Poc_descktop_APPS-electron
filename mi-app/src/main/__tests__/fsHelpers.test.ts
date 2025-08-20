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
// Depuración: mostrar claves exportadas
// eslint-disable-next-line no-console
console.log('fsHelpers exports:', Object.keys(helpers))

beforeEach(async () => {
  await fs.rm(getDataDir(), { recursive: true, force: true })
  await ensureDir()
})

describe('fsHelpers', () => {
  it('crea directorio y escribe/lee json', async () => {
    // Test que verifica la escritura y lectura de archivos JSON
    // Propósito: Validar que los datos se escriben y leen correctamente del sistema de archivos
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
    // Test que verifica el listado de archivos JSON en el directorio
    // Propósito: Comprobar que listJsonFiles retorna todos los archivos .json existentes
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
    // Test que verifica la eliminación de archivos del sistema
    // Propósito: Validar que deleteFile elimina correctamente un archivo y retorna true
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
    // Test que verifica el cálculo del tamaño total del directorio
    // Propósito: Comprobar que dirSizeBytes calcula correctamente el espacio ocupado
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
