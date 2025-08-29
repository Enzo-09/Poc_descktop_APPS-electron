import { contextBridge, ipcRenderer } from 'electron'

// Simple API exposure
const api = {
  notes: {
    list: () => ipcRenderer.invoke('notes:list'),
    get: (id: string) => ipcRenderer.invoke('notes:get', id),
    create: (title: string, content: string) =>
      ipcRenderer.invoke('notes:create', { title, content }),
    update: (id: string, patch: { title?: string; content?: string }) =>
      ipcRenderer.invoke('notes:update', id, patch),
    delete: (id: string) => ipcRenderer.invoke('notes:delete', id),
    seed: (count: number) => ipcRenderer.invoke('notes:seed', count),
    footprint: () => ipcRenderer.invoke('notes:metrics:footprint'),
    memory: () => ipcRenderer.invoke('notes:metrics:memory')
  }
}

// Expose API
contextBridge.exposeInMainWorld('api', api)

// Simple test
contextBridge.exposeInMainWorld('preloadReady', true)
