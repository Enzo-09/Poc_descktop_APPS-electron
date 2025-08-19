export {}

declare global {
  interface Window {
    api: {
      notes: {
        list: () => Promise<any>
        get: (id: string) => Promise<any>
        create: (title: string, content: string) => Promise<any>
        update: (id: string, patch: { title?: string; content?: string }) => Promise<any>
        delete: (id: string) => Promise<any>
        seed: (count: number) => Promise<any>
        footprint: () => Promise<any>
        memory: () => Promise<any>
      }
    }
  }
}
export {}

declare global {
  interface Window {
    api: {
      notes: {
        list: () => Promise<any>
        get: (id: string) => Promise<any>
        create: (title: string, content: string) => Promise<any>
        update: (id: string, patch: { title?: string; content?: string }) => Promise<any>
        delete: (id: string) => Promise<any>
        seed: (count: number) => Promise<any>
        footprint: () => Promise<any>
        memory: () => Promise<any>
      }
    }
  }
}