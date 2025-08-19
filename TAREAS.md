¡Vamos a full! Te dejo un **paso a paso completo** para implementar la PoC **MiniNotes (CRUD + Benchmarks) en Electron** con lo que ya instalaste (**electron-vite + React + TS**), **dividido para 3 integrantes** trabajando en paralelo. Incluye estructura, comandos, tareas por rol, contratos IPC, stubs de código y checklists.

---

# Plan de trabajo — MiniNotes (Electron + Vite + React + TS)

## 0) Requisitos (ya cubiertos)

* Proyecto creado con `electron-vite` plantilla **react-ts**.
* `npm run dev` funciona.

---

## 1) Estructura y acuerdos (comunes a todo el equipo)

**Carpetas clave**

```
src/
  main/            # Lógica Electron (IPC + FS + benchmarks kernel)
  preload/         # Puente seguro (exposición API a renderer)
  renderer/        # UI React + runner de benchmarks + vistas CRUD
```

**Carpeta de datos**

* Usamos `app.getPath('userData')/mininotes/notes` para almacenar JSON de notas.
* Carpeta para resultados de benchmarks: `app.getPath('userData')/mininotes/benchmarks`.

**Modelo de nota (JSON)**

```ts
type Note = {
  id: string;           // uuid
  title: string;
  content: string;
  tags: string[];
  createdAt: string;    // ISO
  updatedAt: string;    // ISO
}
```

**Contratos IPC (nombres de canal)**

```
notes:create        (payload: {title, content, tags})         -> Note
notes:list          ()                                        -> Note[]
notes:get           (id: string)                              -> Note
notes:update        ({id, title?, content?, tags?})           -> Note
notes:delete        (id: string)                              -> {deleted: boolean}
notes:seed          (count: number)                           -> {created: number}

bench:run           ({ scenario, N?, percent? })              -> BenchResult
bench:startupMark   ()  // marcar tiempo “app lista”
bench:snapshot      ()  // memory + tamaños
```

**Tipo de resultado de benchmarks**

```ts
type BenchResult = {
  scenario: "startup"|"seed"|"list"|"readMany"|"updatePct"|"deletePct"|"footprint"|"memory";
  N?: number;
  percent?: number;
  ms: number;                  // duración
  timestamp: string;           // ISO
  extra?: Record<string, any>; // tamaños, contadores, etc.
}
```

---

## 2) División para 3 integrantes (trabajo en paralelo)

### 👤 Integrante A — **Infra (Main + FS + IPC + seguridad)**

**Objetivo:** Implementar acceso a disco, CRUD y seed en `src/main/`, exponer canales IPC y buenas prácticas de seguridad.

**Tareas**

1. **Paths & FS helpers**

   * `getDataDir()`, `ensureDir()`, `readJson(file)`, `writeJson(file, data)`, `listJsonFiles(dir)`, `deleteFile(file)` con `fs/promises`.
   * Directorio: `${app.getPath('userData')}/mininotes/notes`.

2. **CRUD/Seed**

   * `createNote`, `listNotes`, `getNote`, `updateNote`, `deleteNote`, `seedNotes(N)`.

3. **Bench kernel (main)**

   * Medir con `process.hrtime.bigint()` tiempos de seed/list/read/update/delete.
   * `footprint`: calcular tamaño carpeta datos y (opcional) tamaño del paquete si está disponible.
   * `memory`: `process.memoryUsage()`.

4. **IPC**

   * `ipcMain.handle('notes:*', ...)` y `ipcMain.handle('bench:*', ...)`.
   * Persistir `BenchResult` en `/benchmarks/<ISO>.json`.

5. **Seguridad**

   * `contextIsolation: true`, `nodeIntegration: false`.
   * `setWindowOpenHandler` para abrir externos con `shell.openExternal`.
   * Validar payloads (al menos checks básicos).

**Stubs — `src/main/notes.ts`**

```ts
import { app } from "electron";
import { mkdir, readdir, readFile, writeFile, stat, rm } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const ROOT = path.join(app.getPath("userData"), "mininotes");
const NOTES_DIR = path.join(ROOT, "notes");
const BENCH_DIR = path.join(ROOT, "benchmarks");

export async function ensureDirs() {
  await mkdir(NOTES_DIR, { recursive: true });
  await mkdir(BENCH_DIR, { recursive: true });
}
export function getNotesDir() { return NOTES_DIR; }
export function getBenchDir() { return BENCH_DIR; }

export type Note = {
  id: string; title: string; content: string; tags: string[];
  createdAt: string; updatedAt: string;
};

function notePath(id: string) { return path.join(NOTES_DIR, `${id}.json`); }

export async function listNotes(): Promise<Note[]> {
  const files = await readdir(NOTES_DIR);
  const out: Note[] = [];
  for (const f of files) {
    if (!f.endsWith(".json")) continue;
    const raw = await readFile(path.join(NOTES_DIR, f), "utf-8");
    out.push(JSON.parse(raw));
  }
  return out;
}

export async function getNote(id: string): Promise<Note> {
  const raw = await readFile(notePath(id), "utf-8");
  return JSON.parse(raw);
}

export async function createNote(input: { title: string; content: string; tags: string[] }): Promise<Note> {
  const now = new Date().toISOString();
  const note: Note = { id: randomUUID(), title: input.title, content: input.content, tags: input.tags ?? [], createdAt: now, updatedAt: now };
  await writeFile(notePath(note.id), JSON.stringify(note, null, 2), "utf-8");
  return note;
}

export async function updateNote(input: Partial<Note> & { id: string }): Promise<Note> {
  const curr = await getNote(input.id);
  const updated: Note = {
    ...curr,
    title: input.title ?? curr.title,
    content: input.content ?? curr.content,
    tags: input.tags ?? curr.tags,
    updatedAt: new Date().toISOString()
  };
  await writeFile(notePath(updated.id), JSON.stringify(updated, null, 2), "utf-8");
  return updated;
}

export async function deleteNote(id: string) {
  await rm(notePath(id), { force: true });
  return { deleted: true };
}

export async function seedNotes(count: number) {
  const start = process.hrtime.bigint();
  for (let i = 0; i < count; i++) {
    await createNote({
      title: `Note ${i + 1}`,
      content: `Lorem ipsum ${i}`,
      tags: i % 2 ? ["work"] : ["home"]
    });
  }
  const end = process.hrtime.bigint();
  const ms = Number(end - start) / 1e6;
  return { created: count, ms };
}

export async function dirSizeBytes(dir: string) {
  let total = 0;
  for (const f of await readdir(dir)) {
    const s = await stat(path.join(dir, f));
    if (s.isFile()) total += s.size;
  }
  return total;
}
```

**Stubs — `src/main/ipc.ts`**

```ts
import { ipcMain, app } from "electron";
import path from "node:path";
import { writeFile } from "node:fs/promises";
import { ensureDirs, listNotes, getNote, createNote, updateNote, deleteNote, seedNotes, dirSizeBytes, getBenchDir, getNotesDir } from "./notes";

function nowIso() { return new Date().toISOString(); }
async function saveBench(result: any) {
  const file = path.join(getBenchDir(), `${result.scenario}-${Date.now()}.json`);
  await writeFile(file, JSON.stringify(result, null, 2), "utf-8");
}

export function registerIpc() {
  ensureDirs();

  ipcMain.handle("notes:list", async () => listNotes());
  ipcMain.handle("notes:get",  async (_e, id: string) => getNote(id));
  ipcMain.handle("notes:create", async (_e, p) => createNote(p));
  ipcMain.handle("notes:update", async (_e, p) => updateNote(p));
  ipcMain.handle("notes:delete", async (_e, id: string) => deleteNote(id));
  ipcMain.handle("notes:seed",   async (_e, count: number) => seedNotes(count));

  ipcMain.handle("bench:startupMark", async () => {
    const t = process.uptime() * 1000; // ms desde arranque proceso
    const res = { scenario: "startup", ms: t, timestamp: nowIso() };
    await saveBench(res);
    return res;
  });

  ipcMain.handle("bench:snapshot", async () => {
    const mem = process.memoryUsage();
    const notesBytes = await dirSizeBytes(getNotesDir()).catch(() => 0);
    const res = { scenario: "memory", ms: 0, timestamp: nowIso(), extra: { mem, notesBytes } };
    await saveBench(res);
    return res;
  });

  ipcMain.handle("bench:run", async (_e, { scenario, N = 500, percent = 10 }) => {
    const start = process.hrtime.bigint();
    // escenarios
    if (scenario === "seed") await seedNotes(N);
    else if (scenario === "list") await listNotes();
    else if (scenario === "readMany") {
      const all = await listNotes();
      const take = all.slice(0, Math.min(N, all.length));
      for (const n of take) await getNote(n.id);
    } else if (scenario === "updatePct") {
      const all = await listNotes();
      const k = Math.ceil((percent / 100) * all.length);
      for (let i = 0; i < k; i++) {
        await updateNote({ id: all[i].id, title: all[i].title + " *" });
      }
    } else if (scenario === "deletePct") {
      const all = await listNotes();
      const k = Math.ceil((percent / 100) * all.length);
      for (let i = 0; i < k; i++) await deleteNote(all[i].id);
    } else if (scenario === "footprint") {
      const notesBytes = await dirSizeBytes(getNotesDir()).catch(() => 0);
      const res = { scenario, ms: 0, timestamp: nowIso(), extra: { notesBytes } };
      await saveBench(res);
      return res;
    }
    const end = process.hrtime.bigint();
    const ms = Number(end - start) / 1e6;
    const result = { scenario, ms, timestamp: nowIso(), extra: { N, percent } };
    await saveBench(result);
    return result;
  });
}
```

**Hook en `src/main/index.ts`**

```ts
import { app, BrowserWindow, shell } from "electron";
import path from "node:path";
import { registerIpc } from "./ipc";

let win: BrowserWindow | null = null;

async function createWindow() {
  registerIpc();

  win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    win.loadURL(devUrl);
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    win.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url); return { action: "deny" };
  });
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
```

---

### 👤 Integrante B — **UI (Renderer React + Hooks + Vistas + Tablero Bench)**

**Objetivo:** Construir la interfaz CRUD y una pantalla de Benchmarks que invoque los escenarios.

**Tareas**

1. **API client (renderer)**

   * Un wrapper para `window.api.invoke` por canal.

2. **Vistas CRUD**

   * Lista con buscador/tag filter.
   * Form crear/editar.
   * Detalle.

3. **Pantalla “Benchmarks”**

   * Botones para: startupMark, seed(100|500|1000), list, readMany(N), updatePct(10), deletePct(10), footprint, snapshot.
   * Tabla con resultados y export JSON (descarga).

**Stub — `src/renderer/api.ts`**

```ts
export async function listNotes()       { return window.api.invoke("notes:list"); }
export async function getNote(id: string){ return window.api.invoke("notes:get", id); }
export async function createNote(p:any)  { return window.api.invoke("notes:create", p); }
export async function updateNote(p:any)  { return window.api.invoke("notes:update", p); }
export async function deleteNote(id:string){return window.api.invoke("notes:delete", id); }

export async function benchRun(scenario:string, opts:any={}) { return window.api.invoke("bench:run", { scenario, ...opts }); }
export async function benchStartupMark() { return window.api.invoke("bench:startupMark"); }
export async function benchSnapshot()    { return window.api.invoke("bench:snapshot"); }
```

**Stub — `src/renderer/App.tsx` (bosquejo)**

```tsx
import React from "react";
import * as api from "./api";

type BenchRow = { scenario: string; ms: number; timestamp: string; extra?: any };

export default function App() {
  const [notes, setNotes] = React.useState<any[]>([]);
  const [bench, setBench] = React.useState<BenchRow[]>([]);

  async function refresh() { setNotes(await api.listNotes()); }

  async function run(scenario: string, opts?: any) {
    const r = await api.benchRun(scenario, opts);
    setBench(b => [r, ...b]);
  }

  React.useEffect(() => { refresh(); api.benchStartupMark().then(r => setBench(b=>[r,...b])); }, []);

  return (
    <main style={{ padding: 24 }}>
      <h1>MiniNotes — Electron</h1>

      <section>
        <h2>CRUD</h2>
        <button onClick={() => run("seed", { N: 100 })}>Seed(100)</button>
        <button onClick={() => refresh()}>Refrescar</button>
        <ul>
          {notes.map(n => (
            <li key={n.id}>
              <strong>{n.title}</strong> — {n.tags?.join(", ")}
              <button onClick={async ()=>{ await api.deleteNote(n.id); refresh(); }}>Eliminar</button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Benchmarks</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => run("seed", { N: 500 })}>Seed(500)</button>
          <button onClick={() => run("list")}>List</button>
          <button onClick={() => run("readMany", { N: 500 })}>ReadMany(500)</button>
          <button onClick={() => run("updatePct", { percent: 10 })}>Update(10%)</button>
          <button onClick={() => run("deletePct", { percent: 10 })}>Delete(10%)</button>
          <button onClick={() => run("footprint")}>Footprint</button>
          <button onClick={() => api.benchSnapshot().then(r=>setBench(b=>[r,...b]))}>Snapshot</button>
        </div>

        <table border={1} cellPadding={6} style={{ marginTop: 12 }}>
          <thead>
            <tr><th>Scenario</th><th>ms</th><th>timestamp</th><th>extra</th></tr>
          </thead>
          <tbody>
            {bench.map((r, i) => (
              <tr key={i}>
                <td>{r.scenario}</td><td>{r.ms?.toFixed?.(2) ?? "-"}</td><td>{r.timestamp}</td>
                <td><code>{JSON.stringify(r.extra ?? {})}</code></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
```

**Preload — `src/preload/index.ts`**

```ts
import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld("api", {
  invoke: (channel: string, args?: any) => ipcRenderer.invoke(channel, args)
});
declare global {
  interface Window { api: { invoke: (channel: string, args?: any)=>Promise<any> }; }
}
```

---

### 👤 Integrante C — **Benchmarks + Reporte (scripts, export, tablas/gráficos)**

**Objetivo:** Automatizar corridas, guardar resultados, armar reportes y entregar tablas/gráficos.

**Tareas**

1. **Runner de escenarios** (renderer)

   * Botones “Run All” por lotes:

     * Lote A (N=100), Lote B (N=500), Lote C (N=1000).
   * Secuenciar: `seed -> list -> readMany -> updatePct -> deletePct -> footprint -> snapshot`.

2. **Export**

   * Botón “Export JSON” (descarga del array `bench`).
   * (Opcional) Export CSV.

3. **Gráficos**

   * Simple chart de barras (tiempos) y otro para tamaños.

4. **Tabla comparativa**

   * Estructura: métrica vs valor Electron (para luego replicar con Tauri).

**Stub — Export JSON (renderer)**

```ts
function downloadJSON(filename: string, data: any) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
```

---

## 3) Git & Flujo de trabajo (sugerido)

**Repositorio único** para Electron PoC: `mininotes-electron`

* Ramas:

  * `feat/main-ipc-fs` (A)
  * `feat/ui-renderer` (B)
  * `feat/bench-runner-report` (C)

**Checklist por PR**

* [ ] Tests manuales CRUD (crear, leer, actualizar, borrar).
* [ ] Seed con N=100 sin errores.
* [ ] `bench:run` devuelve tiempos ms y guarda JSON en benchmarks.
* [ ] Linter/format (opcional).
* [ ] Capturas de pantalla (UI y tabla).

**Comandos**

```bash
# Crear rama
git checkout -b feat/main-ipc-fs
# Commit típico
git add . && git commit -m "main: FS + IPC CRUD + seed"
git push -u origin feat/main-ipc-fs
# luego PR
```

---

## 4) Pasos cronológicos (día a día)

**Día 1 (setup y contratos)**

* A: Helpers FS + estructura notas + ensureDirs + contratos IPC definidos.
* B: Esqueleto UI + tabla Bench + botones vacíos.
* C: Esqueleto runner + export JSON.

**Día 2 (CRUD completo)**

* A: `notes:*` implementados, probados con `ipcMain.handle`.
* B: Lista/crear/editar/eliminar integrando API.
* C: Runner ejecuta lote A y guarda resultados en UI.

**Día 3 (benchmarks)**

* A: `bench:*` implementados (seed/list/readMany/updatePct/deletePct/footprint/memory/startupMark).
* B: Pantalla Bench con resultados visibles.
* C: Export JSON/CSV + (opcional) gráficos.

**Día 4 (reporte)**

* C: Exporta resultados + tabla comparativa (lista para pegar en doc/PPT).
* Todo el equipo: revisión, repaso de riesgos/mitigaciones.

---

## 5) Comandos útiles (recordatorio)

```bash
# Dev
npm run dev

# Build producción
npx electron-vite build

# Preview producción
npx electron-vite preview
```

---

## 6) Definición de Hecho (PoC lista)

* CRUD funcional en Electron (I/O real de disco).
* Pantalla benchmarks con escenarios y resultados persistidos.
* Export de resultados (JSON/CSV).
* Tabla comparativa base (para luego Tauri).
* Notas de seguridad aplicadas (aislamiento, sin Node en renderer).

---

## 7) Próximo paso

* Clonar esta misma estructura y contratos IPC en **Tauri** (comandos invocables en Rust con el mismo payload), correr los **mismos escenarios**, y **comparar tablas/export**.

---

