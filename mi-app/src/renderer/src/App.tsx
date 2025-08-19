import Versions from './components/Versions'
import electronLogo from './assets/electron.svg'
import { useState } from 'react'

// Hint de tipos mínimo si aún no se reconoció global.d.ts
declare global {
  interface Window {
    api: any
  }
}

function App(): React.JSX.Element {
  const [notes, setNotes] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const loadNotes = async () => {
    setLoading(true)
    try {
      const res = await window.api.notes.list()
      if (res.ok) setNotes(res.data)
    } finally {
      setLoading(false)
    }
  }

  const createSample = async () => {
    const r = await window.api.notes.create('Título demo', 'Contenido demo')
    if (r.ok) await loadNotes()
  }

  return (
    <>
      <img alt="logo" className="logo" src={electronLogo} />
      <div className="creator">Powered by electron-vite</div>
      <div className="text">
        Build an Electron app with <span className="react">React</span>
        &nbsp;and <span className="ts">TypeScript</span>
      </div>
      <p className="tip">
        Please try pressing <code>F12</code> to open the devTool
      </p>
      <div className="actions" style={{ display: 'flex', gap: 12 }}>
        <button onClick={loadNotes} disabled={loading}>
          {loading ? 'Cargando...' : 'Listar notas'}
        </button>
        <button onClick={createSample}>Crear nota demo</button>
      </div>
      <ul style={{ maxHeight: 200, overflow: 'auto' }}>
        {notes.map((n) => (
          <li key={n.id}>
            <strong>{n.title}</strong> - {new Date(n.createdAt).toLocaleTimeString()}
          </li>
        ))}
      </ul>
      <Versions></Versions>
    </>
  )
}

export default App
