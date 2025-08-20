import { dirSizeBytes } from './fsHelpers'
// eslint-disable-next-line no-console
console.log('[metrics] módulo cargado')

export interface TimedResult<T> {
  data: T
  ms: number
}

export async function measure<T>(fn: () => Promise<T>): Promise<TimedResult<T>> {
  const start = process.hrtime.bigint()
  const data = await fn()
  const end = process.hrtime.bigint()
  const ms = Number(end - start) / 1_000_000
  return { data, ms }
}

export async function footprint() {
  const dataBytes = await dirSizeBytes()
  let appBytes: number | null = null
  try {
    // Opcional: tamaño del paquete (puedes adaptar según tu empaquetado)
    appBytes = 0
  } catch {
    appBytes = null
  }
  return { dataBytes, appBytes }
}

export function memoryUsage() {
  const mu = process.memoryUsage()
  return {
    rss: mu.rss,
    heapTotal: mu.heapTotal,
    heapUsed: mu.heapUsed,
    external: mu.external
  }
}
