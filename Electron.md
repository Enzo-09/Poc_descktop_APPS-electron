# Guía rápida: Electron + Vite + React + TypeScript

Esta guía te deja **todo en Markdown**: comandos, estructura de carpetas y ejemplos mínimos para que programes **Electron (main)** y **React (renderer)** con **TypeScript** y autocompletado en VS Code.

---

## ✅ Prerrequisitos

* **Node.js** 18+ (recomendado 20 LTS o 22)
* **npm** (incluido con Node)
* **VS Code** (para autocompletado TS/JSX)

```bash
node -v
npm -v
```

---

## 🚀 Crear proyecto (electron-vite + React + TS)

### Opción rápida (sin preguntas)

```bash
npm create @quick-start/electron@latest mi-app -- --template react-ts
cd mi-app
npm install
npm run dev
```

### Opción interactiva (con preguntas)

```bash
npm create @quick-start/electron@latest
# Elegir: Framework -> React ; Add TypeScript -> Yes
cd mi-app
npm install
npm run dev
```

### Comandos útiles

```bash
# Desarrollo (HMR)
npm run dev

# Build producción (genera /out por defecto)
npx electron-vite build

# Previsualizar el build
npx electron-vite preview
# o si ya tenés un build hecho
npx electron-vite preview --skipBuild

# (Opcional) Cambiar carpeta de salida
echo "Usar --outDir=dist"  # recordatorio
npx electron-vite build --outDir=dist
npx electron-vite preview --outDir=dist

# (Opcional) Empaquetar instaladores con electron-builder
npm i -D electron-builder
npm run build && npx electron-builder --win   # Windows
npm run build && npx electron-builder --mac   # macOS
npm run build && npx electron-builder --linux # Linux
```

---

## 📁 Estructura típica del proyecto

```
mi-app/
 ├─ build/              # Archivos de build (iconos, config de electron-builder, etc.)
 ├─ dist/               # Salida alternativa si la configurás
 ├─ node_modules/
 ├─ out/                # Salida de electron-vite (producción)
 ├─ public/             # Recursos estáticos del frontend
 ├─ src/
 │   ├─ main/           # 👈 Código principal de Electron (proceso main)
 │   │   └─ index.ts    # Punto de entrada de Electron (BrowserWindow, menús, etc.)
 │   ├─ preload/        # 👈 Código preload (puente seguro entre main y renderer)
 │   │   └─ index.ts
 │   └─ renderer/       # 👈 Código React (frontend/UI)
 │       ├─ App.tsx
 │       └─ main.tsx    # Entrada de React
 ├─ package.json
 └─ tsconfig.json
```

---

## ✍️ ¿Dónde programar?

* **Electron (infraestructura de la app)** → `src/main/`
* **Conexión segura main ↔ renderer (IPC)** → `src/preload/`
* **React (interfaz de usuario)** → `src/renderer/`

---

## 🔧 Configuración TS para buen autocompletado

* Usar archivos **`.ts`** y **`.tsx`** en lugar de `.js`/`.jsx`.
* En `tsconfig.json`, asegurá **`"jsx": "react-jsx"`** (o `react-jsxdev` en dev).
* Instalar tipos: `@types/react` y `@types/react-dom` (ya vienen en la plantilla).

Ejemplo mínimo de `tsconfig.json` (parcial):

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  }
}
```

---

## 🧱 Código mínimo de ejemplo

### `src/main/index.ts` (proceso principal de Electron)

```ts
import { app, BrowserWindow, shell } from "electron";
import path from "node:path";

let win: BrowserWindow | null = null;

async function createWindow() {
  win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      // Importante: el preload debe apuntar al JS compilado
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // Carga dev server o archivos estáticos de producción
  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    win.loadURL(devUrl);
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    win.loadFile(path.join(__dirname, "../renderer/index.html"));
  }

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
```

### `src/preload/index.ts` (puente seguro con contextBridge)

```ts
import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
  ping: () => ipcRenderer.invoke("ping"),
  // Ejemplo: enviar un mensaje con datos
  send: (channel: string, data?: unknown) => ipcRenderer.send(channel, data),
  // Escuchar mensajes
  on: (channel: string, listener: (event: unknown, ...args: any[]) => void) => {
    const subscription = (_event: unknown, ...args: any[]) => listener(_event, ...args);
    ipcRenderer.on(channel, subscription);
    return () => ipcRenderer.removeListener(channel, subscription);
  }
});

// Tipado global para autocompletado en TS/React
declare global {
  interface Window {
    api: {
      ping: () => Promise<unknown>;
      send: (channel: string, data?: unknown) => void;
      on: (channel: string, listener: (event: unknown, ...args: any[]) => void): () => void;
    };
  }
}
```

> **Nota:** En el proceso `main` podés manejar los canales IPC:

```ts
import { ipcMain } from "electron";
ipcMain.handle("ping", async () => "pong");
```

### `src/renderer/main.tsx` (entrada de React)

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### `src/renderer/App.tsx` (UI mínima)

```tsx
import React from "react";

export default function App() {
  const [answer, setAnswer] = React.useState<string>("");

  async function handlePing() {
    const res = await window.api.ping();
    setAnswer(String(res));
  }

  return (
    <main style={{ padding: 24, fontFamily: "Inter, system-ui, sans-serif" }}>
      <h1>Electron + Vite + React + TypeScript ⚡</h1>
      <p>Comprobá la conexión main ↔ renderer a través de preload.</p>
      <button onClick={handlePing}>Ping</button>
      {answer && <p>Respuesta: {answer}</p>}
      <p>
        Editá <code>src/renderer/App.tsx</code> y guardá para ver HMR.
      </p>
    </main>
  );
}
```

---

## 🧩 Scripts útiles en `package.json`

*(Tu plantilla ya trae la mayoría. Si no, como referencia:)*

```json
{
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "preview": "electron-vite preview",
    "make:win": "npm run build && electron-builder --win",
    "make:mac": "npm run build && electron-builder --mac",
    "make:linux": "npm run build && electron-builder --linux"
  },
  "devDependencies": {
    "electron-builder": "^25.0.0"
  }
}
```

---

## 🧪 Checklist de verificación

* [ ] `npm run dev` abre la ventana de Electron con tu app React.
* [ ] El botón **Ping** responde **"pong"** (IPC funcionando).
* [ ] Autocompletado TS/JSX activo en VS Code (`.tsx`, `jsx: react-jsx`).
* [ ] `npx electron-vite build` genera la carpeta **/out**.
* [ ] (Opcional) `electron-builder` produce instaladores para tu SO.

---

## ❓ Troubleshooting rápido

* **Pantalla en blanco en producción**: asegurate de cargar `index.html` con `loadFile` y que el `preload` apunte al **JS** compilado.
* **`window.api` undefined**: revisá `contextIsolation: true`, `nodeIntegration: false` y la ruta correcta del preload en `BrowserWindow`.
* **Sin autocompletado TS**: revisá `tsconfig.json` (`jsx: react-jsx`) y que estás editando archivos `.tsx`.

---

¡Listo! Con esto tenés el esqueleto completo y funcional para empezar a programar en **Electron** (en `src/main/`), tu puente **preload** (en `src/preload/`) y la **UI en React** (en `src/renderer/`).
