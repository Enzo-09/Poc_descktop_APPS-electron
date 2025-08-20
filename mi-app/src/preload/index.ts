import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

type Channels =
  | 'notes:list'
  | 'notes:get'
  | 'notes:create'
  | 'notes:update'
  | 'notes:delete'
  | 'notes:seed'
  | 'notes:metrics:footprint'
  | 'notes:metrics:memory'
  | 'notes:benchmark'

function invoke<T = any>(channel: Channels, ...args: any[]): Promise<T> {
  return ipcRenderer.invoke(channel, ...args)
}

// Exposición del API seguro de notas
contextBridge.exposeInMainWorld('api', {
  notes: {
    list: () => invoke('notes:list'),
    get: (id: string) => invoke('notes:get', id),
    create: (title: string, content: string) => invoke('notes:create', { title, content }),
    update: (id: string, patch: { title?: string; content?: string }) =>
      invoke('notes:update', id, patch),
    delete: (id: string) => invoke('notes:delete', id),
    seed: (count: number) => invoke('notes:seed', count),
    footprint: () => invoke('notes:metrics:footprint'),
    memory: () => invoke('notes:metrics:memory'),
    benchmark: (count: number) => invoke('notes:benchmark', count)
  }
})

// Mantener compatibilidad con código existente (Versions.tsx) exponiendo electronAPI
contextBridge.exposeInMainWorld('electron', electronAPI)
