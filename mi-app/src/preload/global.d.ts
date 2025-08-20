export {}

// Tipos para la respuesta de la API
interface ApiResponse<T> {
  ok: boolean
  data?: T
  error?: string
}

// Tipos para las notas
interface Note {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
}

// Tipos para métricas
interface MemoryMetrics {
  heapUsed: number
  heapTotal: number
  external: number
  rss: number
}

interface Footprint {
  memory: MemoryMetrics
  timestamp: number
}

declare global {
  interface Window {
    api: {
      notes: {
        list: () => Promise<ApiResponse<Note[]>>
        get: (id: string) => Promise<ApiResponse<Note>>
        create: (title: string, content: string) => Promise<ApiResponse<Note>>
        update: (
          id: string,
          patch: { title?: string; content?: string }
        ) => Promise<ApiResponse<Note>>
        delete: (id: string) => Promise<ApiResponse<void>>
        seed: (count: number) => Promise<ApiResponse<Note[]>>
        footprint: () => Promise<ApiResponse<Footprint>>
        memory: () => Promise<ApiResponse<MemoryMetrics>>
      }
    }
  }
}
