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
    const r = await measure(async () => 42)
    expect(r.data).toBe(42)
    expect(r.ms).toBeGreaterThanOrEqual(0)
  })

  it('footprint retorna dataBytes', async () => {
    const fp = await footprint()
    expect(fp.dataBytes).toBeGreaterThanOrEqual(0)
  })

  it('memoryUsage retorna campos', () => {
    const m = memoryUsage()
    expect(m.rss).toBeGreaterThan(0)
  })
})
