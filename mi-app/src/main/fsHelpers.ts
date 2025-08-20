//TODA ESTA PARTE SE ENCARGA DE LA ASIGNACION DE LOS DATOS QUE ENTRAN O EXISTEN EN ARCHIVOS JSON
//Y LOS ALMACENA DENTRO DE LA CARPETA mininotes/notes EN appData

import { promises as fs } from 'fs'
import { app } from 'electron'
import { join, basename } from 'path'
import { randomUUID } from 'crypto'

const NOTES_SUBDIR = join('mininotes', 'notes')
// Depuración de carga del módulo
// eslint-disable-next-line no-console
console.log('[fsHelpers] módulo cargado')

export function getDataDir(): string {
  return join(app.getPath('userData'), NOTES_SUBDIR)
}
//Usa app.getPath('userData') (una carpeta que cada sistema operativo reserva para la app).
//Dentro crea la subcarpeta mininotes/notes.
//C:\Users\nombreUsuario\AppData\Roaming\mi-app\mininotes\notes

export async function ensureDir(): Promise<void> {
  await fs.mkdir(getDataDir(), { recursive: true })
}
//Asegura que la carpeta mininotes exista
//prueba la ruta
// fs.mkdir intentaría crear solo la última carpeta. recursive true crea la ruta que falta si ya esta no pasa nada

export async function listJsonFiles(): Promise<string[]> {
  await ensureDir()
  const entries = await fs.readdir(getDataDir(), { withFileTypes: true })
  return entries.filter((e) => e.isFile() && e.name.endsWith('.json')).map((e) => e.name)
}
//agarra todos los json creados, en la carpeta json, llamara a ensureDir() (garantiza que la carpeta exista).
// Luego usa fs.readdir para leer todos los archivos.
// Filtra solo los que terminan en .json.
// Devuelve un array de nombres de archivo (ejemplo: [ "1234.json", "5678.json" ]).

export async function readJson<T>(fileName: string): Promise<T | null> {
  if (!fileName.endsWith('.json')) return null
  const safeName = basename(fileName) // evita traversal
  const full = join(getDataDir(), safeName)
  try {
    const raw = await fs.readFile(full, 'utf8')
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

// Lee y convierte un archivo JSON en un objeto de tipo T.
// basename(fileName) evita ataques de path traversal (ejemplo: que alguien intente leer ../../otro/archivo).
// Concatena el nombre con el directorio seguro (getDataDir()).
// Intenta leer el archivo → hace JSON.parse.
// Si algo falla (archivo corrupto o no existe), devuelve null.

export async function writeJson(fileName: string, data: unknown): Promise<void> {
  if (!fileName.endsWith('.json')) throw new Error('Nombre inválido')
  const safeName = basename(fileName)
  const full = join(getDataDir(), safeName)
  await ensureDir()
  const tmp = full + '.' + randomUUID() + '.tmp'
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf8')
  await fs.rename(tmp, full)
}

// Escribe un objeto como archivo JSON de forma atómica (segura).
// Verifica que el nombre termine en .json.
// Construye ruta absoluta (getDataDir() + nombre seguro).
// Genera un archivo temporal (.tmp con UUID).
// Escribe primero en ese archivo temporal.
// Después hace un rename al archivo final → si se corta la luz, nunca queda un archivo corrupto.

export async function deleteFile(fileName: string): Promise<boolean> {
  if (!fileName.endsWith('.json')) return false
  const safeName = basename(fileName)
  const full = join(getDataDir(), safeName)
  try {
    await fs.unlink(full)
    return true
  } catch {
    return false
  }
}

export async function dirSizeBytes(): Promise<number> {
  await ensureDir()
  const files = await listJsonFiles()
  let total = 0
  for (const f of files) {
    const st = await fs.stat(join(getDataDir(), f))
    total += st.size
  }
  return total
}

export const __debug = 'fsHelpers-loaded'
