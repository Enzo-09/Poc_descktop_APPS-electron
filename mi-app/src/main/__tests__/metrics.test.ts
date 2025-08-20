import { describe, it, expect, vi } from 'vitest'
import * as metrics from '../metrics'
const { measure, footprint, memoryUsage } = metrics as any
// eslint-disable-next-line no-console
console.log('metrics exports:', Object.keys(metrics))
import { tmpdir } from 'os'
import { join } from 'path'

vi.mock('electron', () => ({
  app: { getPath: () => join(tmpdir(), 'mininotes-metrics') }
}))

describe('metrics', () => {
  it('measure devuelve data y ms', async () => {
    // Test que verifica la función measure para medir tiempo de ejecución de funciones
    // Propósito: Validar que measure retorna tanto el resultado como el tiempo transcurrido
    const testStartTime = performance.now()

    const r = await measure(async () => 42)
    expect(r.data).toBe(42)
    expect(r.ms).toBeGreaterThanOrEqual(0)

    const testEndTime = performance.now()
    console.log(`⏱️ Tiempo del test measure: ${(testEndTime - testStartTime).toFixed(2)}ms`)
    console.log(`📊 Función medida tardó: ${r.ms.toFixed(2)}ms`)
  })

  it('footprint retorna dataBytes', async () => {
    // Test que verifica el cálculo del footprint (huella de datos) del directorio
    // Propósito: Comprobar que footprint calcula correctamente el tamaño en bytes
    const testStartTime = performance.now()

    const fp = await footprint()
    expect(fp.dataBytes).toBeGreaterThanOrEqual(0)

    const testEndTime = performance.now()
    console.log(`⏱️ Tiempo para calcular footprint: ${(testEndTime - testStartTime).toFixed(2)}ms`)
    console.log(`💾 Footprint actual: ${fp.dataBytes} bytes`)
  })

  it('memoryUsage retorna campos', () => {
    // Test que verifica la obtención de información de uso de memoria del proceso
    // Propósito: Validar que memoryUsage retorna métricas válidas de memoria
    const testStartTime = performance.now()

    const m = memoryUsage()
    expect(m.rss).toBeGreaterThan(0)

    const testEndTime = performance.now()
    console.log(`⏱️ Tiempo para obtener memoria: ${(testEndTime - testStartTime).toFixed(2)}ms`)
    console.log(`🧠 Memoria RSS: ${(m.rss / 1024 / 1024).toFixed(2)} MB`)
  })
})
