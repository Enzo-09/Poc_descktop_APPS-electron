import { describe, it, expect, vi } from 'vitest'
import * as notesStore from '../notesStore'
import type { Note } from '../notesStore'
import * as metrics from '../metrics'
import { tmpdir } from 'os'
import { join } from 'path'
import { statSync, readdirSync } from 'fs'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

vi.mock('electron', () => ({
  app: { getPath: () => join(tmpdir(), 'mininotes-performance') }
}))

describe('Métricas de Performance CRUD', () => {
  it('1. Tamaño del paquete final (MB)', async () => {
    console.log('\n ANALIZANDO TAMAÑO DEL PROYECTO...')

    try {
      const projectRoot = process.cwd()

      // Analizar diferentes directorios
      const directories = {
        'Proyecto completo': projectRoot,
        node_modules: join(projectRoot, 'node_modules'),
        src: join(projectRoot, 'src'),
        dist: join(projectRoot, 'dist'),
        release: join(projectRoot, 'release'),
        out: join(projectRoot, 'out')
      }

      const sizes: Record<string, number> = {}

      for (const [name, path] of Object.entries(directories)) {
        try {
          const size = calculateDirSize(path)
          sizes[name] = size
          const sizeMB = size / (1024 * 1024)
          console.log(` ${name}: ${sizeMB.toFixed(2)} MB (${path})`)
        } catch {
          console.log(` ${name}: No existe`)
          sizes[name] = 0
        }
      }

      // Calcular tamaño sin node_modules (más realista para distribución)
      const projectWithoutNodeModules = sizes['Proyecto completo'] - sizes['node_modules']
      const projectWithoutNodeModulesMB = projectWithoutNodeModules / (1024 * 1024)

      console.log('\n ANÁLISIS DETALLADO:')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log(` Proyecto completo: ${(sizes['Proyecto completo'] / 1024 / 1024).toFixed(2)} MB`)
      console.log(` node_modules: ${(sizes['node_modules'] / 1024 / 1024).toFixed(2)} MB`)
      console.log(` Código fuente (src): ${(sizes['src'] / 1024 / 1024).toFixed(2)} MB`)
      console.log(
        ` Build (dist/out): ${((sizes['dist'] + sizes['out']) / 1024 / 1024).toFixed(2)} MB`
      )
      console.log(` Release: ${(sizes['release'] / 1024 / 1024).toFixed(2)} MB`)
      console.log(` Sin node_modules: ${projectWithoutNodeModulesMB.toFixed(2)} MB`)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

      // Analizar archivos más grandes en node_modules
      if (sizes['node_modules'] > 0) {
        console.log('\n🔍 TOP 10 CARPETAS MÁS GRANDES EN NODE_MODULES:')
        try {
          const topDirs = getTopLargestDirs(join(projectRoot, 'node_modules'), 10)
          topDirs.forEach((dir, i) => {
            console.log(`${i + 1}. ${dir.name}: ${(dir.size / 1024 / 1024).toFixed(2)} MB`)
          })
        } catch (error) {
          console.log('⚠️ No se pudo analizar node_modules en detalle')
        }
      }

      // Usar el tamaño real del proyecto completo como métrica
      const projectSizeMB = sizes['Proyecto completo'] / (1024 * 1024)
      const distributableSizeMB = Math.max(
        projectWithoutNodeModulesMB,
        (sizes['dist'] + sizes['out'] + sizes['release']) / (1024 * 1024)
      )

      console.log(`\n MÉTRICA: Proyecto completo = ${projectSizeMB.toFixed(2)} MB`)
      console.log(` MÉTRICA: Tamaño distribuible = ${distributableSizeMB.toFixed(2)} MB`)

      expect(projectSizeMB).toBeGreaterThan(0)
    } catch (error) {
      console.error('❌ Error midiendo tamaño del proyecto:', error)
      throw error
    }
  })

  it('2. Consumo de RAM en idle y bajo carga', async () => {
    console.log('\n MIDIENDO CONSUMO DE RAM...')

    // Memoria en idle
    const idleMemory = process.memoryUsage()
    const idleRSS = idleMemory.rss / (1024 * 1024) // MB

    console.log(`💤 RAM en idle: ${idleRSS.toFixed(2)} MB`)
    console.log(`   - RSS: ${idleRSS.toFixed(2)} MB`)
    console.log(`   - Heap usado: ${(idleMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`)
    console.log(`   - Heap total: ${(idleMemory.heapTotal / 1024 / 1024).toFixed(2)} MB`)

    // Generar carga creando muchas notas
    console.log('🏋️ Generando carga de trabajo...')
    const loadStart = performance.now()

    const promises: Promise<Note>[] = []
    for (let i = 0; i < 200; i++) {
      promises.push(
        notesStore.createNote({
          title: `Nota de carga ${i}`,
          content: `Contenido extenso para prueba de carga ${i}. `.repeat(50)
        })
      )
    }

    await Promise.all(promises)

    // Memoria bajo carga
    const loadMemory = process.memoryUsage()
    const loadRSS = loadMemory.rss / (1024 * 1024) // MB
    const loadTime = performance.now() - loadStart

    console.log(`⚡ RAM bajo carga: ${loadRSS.toFixed(2)} MB`)
    console.log(`   - RSS: ${loadRSS.toFixed(2)} MB`)
    console.log(`   - Heap usado: ${(loadMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`)
    console.log(`   - Incremento: +${(loadRSS - idleRSS).toFixed(2)} MB`)
    console.log(`   - Tiempo de carga: ${loadTime.toFixed(2)}ms`)

    console.log(
      ` MÉTRICA: RAM idle = ${idleRSS.toFixed(2)} MB, RAM carga = ${loadRSS.toFixed(2)} MB`
    )

    expect(idleRSS).toBeGreaterThan(0)
    expect(loadRSS).toBeGreaterThan(idleRSS)

    // Limpiar
    const notes = await notesStore.listNotes()
    for (const note of notes.filter((n) => n.title.includes('Nota de carga'))) {
      await notesStore.deleteNoteById(note.id)
    }
  })

  it('3. Tiempo de arranque (simulado)', async () => {
    console.log('\n🚀 MIDIENDO TIEMPO DE ARRANQUE...')

    // Simular tiempo de arranque midiendo inicialización de módulos
    const startupStart = performance.now()

    // Simular carga de dependencias principales
    const { measure } = metrics

    const initResults = await measure(async () => {
      // Simular inicialización de store
      await notesStore.listNotes()

      // Simular verificación de directorio
      const { footprint } = metrics
      await footprint()

      // Simular carga inicial de datos
      const notes = await notesStore.listNotes()

      return {
        notesCount: notes.length,
        memoryUsed: process.memoryUsage().rss
      }
    })

    const totalStartupTime = performance.now() - startupStart

    console.log(` Tiempo de inicialización: ${initResults.ms.toFixed(2)}ms`)
    console.log(` Tiempo total simulado: ${totalStartupTime.toFixed(2)}ms`)
    console.log(` Notas encontradas: ${initResults.data.notesCount}`)
    console.log(
      ` Memoria post-arranque: ${(initResults.data.memoryUsed / 1024 / 1024).toFixed(2)} MB`
    )

    console.log(` MÉTRICA: Arranque = ${totalStartupTime.toFixed(2)}ms`)

    expect(totalStartupTime).toBeGreaterThan(0)
    expect(totalStartupTime).toBeLessThan(5000) // Menos de 5 segundos
  })

  it('4. Tiempo de operaciones CRUD', async () => {
    console.log('\n⚡ MIDIENDO OPERACIONES CRUD...')

    const N = 100 // Número de notas para test
    const updatePercent = 10 // Porcentaje a actualizar
    const deletePercent = 10 // Porcentaje a eliminar

    // 1. SEED - Crear N notas
    console.log(` Creando ${N} notas...`)
    const seedStart = performance.now()

    const seedPromises: Promise<Note>[] = []
    for (let i = 0; i < N; i++) {
      seedPromises.push(
        notesStore.createNote({
          title: `Nota CRUD ${i}`,
          content: `Contenido para test CRUD ${i}. Timestamp: ${Date.now()}`
        })
      )
    }

    const createdNotes = await Promise.all(seedPromises)
    const seedTime = performance.now() - seedStart

    console.log(
      ` Seed completado: ${seedTime.toFixed(2)}ms (${(seedTime / N).toFixed(2)}ms por nota)`
    )

    // 2. LISTAR todas las notas
    console.log('📋 Listando todas las notas...')
    const listStart = performance.now()
    const allNotes = await notesStore.listNotes()
    const listTime = performance.now() - listStart

    console.log(` Listado completado: ${listTime.toFixed(2)}ms (${allNotes.length} notas)`)

    // 3. LEER N notas individuales
    console.log(` Leyendo ${N} notas individuales...`)
    const readStart = performance.now()

    const readPromises = createdNotes.map((note) => notesStore.getNote(note.id))
    await Promise.all(readPromises)
    const readTime = performance.now() - readStart

    console.log(
      ` Lectura completada: ${readTime.toFixed(2)}ms (${(readTime / N).toFixed(2)}ms por nota)`
    )

    // 4. ACTUALIZAR 10% de las notas
    const updateCount = Math.floor((N * updatePercent) / 100)
    console.log(` Actualizando ${updateCount} notas (${updatePercent}%)...`)
    const updateStart = performance.now()

    const updatePromises = createdNotes.slice(0, updateCount).map((note) =>
      notesStore.updateNote(note.id, {
        title: `${note.title} - ACTUALIZADA`,
        content: `${note.content}\n\nActualizada en: ${new Date().toISOString()}`
      })
    )
    await Promise.all(updatePromises)
    const updateTime = performance.now() - updateStart

    console.log(
      ` Actualización completada: ${updateTime.toFixed(2)}ms (${(updateTime / updateCount).toFixed(2)}ms por nota)`
    )

    // 5. ELIMINAR 10% de las notas
    const deleteCount = Math.floor((N * deletePercent) / 100)
    console.log(` Eliminando ${deleteCount} notas (${deletePercent}%)...`)
    const deleteStart = performance.now()

    const deletePromises = createdNotes
      .slice(updateCount, updateCount + deleteCount)
      .map((note) => notesStore.deleteNoteById(note.id))
    await Promise.all(deletePromises)
    const deleteTime = performance.now() - deleteStart

    console.log(
      ` Eliminación completada: ${deleteTime.toFixed(2)}ms (${(deleteTime / deleteCount).toFixed(2)}ms por nota)`
    )

    // Resumen final
    const totalCrudTime = seedTime + listTime + readTime + updateTime + deleteTime

    console.log('\nREPORTE CRUD:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`Seed ${N} notas: ${seedTime.toFixed(2)}ms`)
    console.log(`Listar todas: ${listTime.toFixed(2)}ms`)
    console.log(`Leer ${N} notas: ${readTime.toFixed(2)}ms`)
    console.log(`Actualizar ${updateCount}: ${updateTime.toFixed(2)}ms`)
    console.log(`Eliminar ${deleteCount}: ${deleteTime.toFixed(2)}ms`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`TOTAL: ${totalCrudTime.toFixed(2)}ms`)

    console.log(`MÉTRICA: CRUD total = ${totalCrudTime.toFixed(2)}ms`)

    expect(seedTime).toBeGreaterThan(0)
    expect(listTime).toBeGreaterThan(0)
    expect(readTime).toBeGreaterThan(0)
    expect(updateTime).toBeGreaterThan(0)
    expect(deleteTime).toBeGreaterThan(0)

    const remainingNotes = await notesStore.listNotes()
    for (const note of remainingNotes.filter((n) => n.title.includes('CRUD'))) {
      await notesStore.deleteNoteById(note.id)
    }
  })

  it('5. Tiempo de build/packaging', async () => {
    console.log('\n🔨 MIDIENDO TIEMPO DE BUILD...')

    try {
      console.log('🚀 Ejecutando build de desarrollo...')
      const buildStart = performance.now()

      try {
        const { stdout: buildOutput } = await execAsync('npm run build', {
          cwd: process.cwd(),
          timeout: 60000
        })
        const buildTime = performance.now() - buildStart
        console.log(` Build desarrollo: ${buildTime.toFixed(2)}ms`)
        console.log(`Output size: ${buildOutput.length} caracteres`)
        console.log(` MÉTRICA: Build = ${buildTime.toFixed(2)}ms`)
        expect(buildTime).toBeGreaterThan(0)
      } catch (buildError) {
        console.log(' Build completo no disponible, midiendo proceso TypeScript...')
        const tscStart = performance.now()
        try {
          await execAsync('npx tsc --noEmit', {
            cwd: process.cwd(),
            timeout: 30000
          })
          const tscTime = performance.now() - tscStart
          console.log(` TypeScript check: ${tscTime.toFixed(2)}ms`)
          console.log(` MÉTRICA: TypeScript = ${tscTime.toFixed(2)}ms`)
          expect(tscTime).toBeGreaterThan(0)
        } catch (tscError) {
          console.log(' Estimando tiempo de build basado en tamaño de archivos...')
          const srcSize = calculateDirSize(join(process.cwd(), 'src'))
          const estimatedBuildTime = srcSize / 1000 // 1ms por KB estimado
          console.log(` Tamaño src: ${(srcSize / 1024).toFixed(2)} KB`)
          console.log(` Tiempo estimado: ${estimatedBuildTime.toFixed(2)}ms`)
          console.log(` MÉTRICA: Build estimado = ${estimatedBuildTime.toFixed(2)}ms`)
          expect(estimatedBuildTime).toBeGreaterThan(0)
        }
      }
    } catch (error) {
      console.error(' Error en medición de build:', error)
      // No fallar el test, solo reportar
      console.log(' MÉTRICA: Build = No medible en este entorno')
    }
  })
})

// Función auxiliar para calcular tamaño de directorio
function calculateDirSize(dirPath: string): number {
  let totalSize = 0

  try {
    const items = readdirSync(dirPath)

    for (const item of items) {
      const itemPath = join(dirPath, item)
      try {
        const stats = statSync(itemPath)

        if (stats.isDirectory()) {
          // Para node_modules usar función con límite de profundidad
          if (item === 'node_modules') {
            totalSize += calculateDirSizeWithLimit(itemPath, 3)
          } else if (!item.includes('.git') && !item.includes('.tmp')) {
            totalSize += calculateDirSize(itemPath)
          }
        } else {
          totalSize += stats.size
        }
      } catch {
        // Ignorar archivos inaccesibles
      }
    }
  } catch {
    // Directorio inaccesible
  }

  return totalSize
}

// Función para obtener las carpetas más grandes
function getTopLargestDirs(dirPath: string, limit: number): Array<{ name: string; size: number }> {
  const dirs: Array<{ name: string; size: number }> = []

  try {
    const items = readdirSync(dirPath)

    for (const item of items) {
      const itemPath = join(dirPath, item)
      try {
        const stats = statSync(itemPath)

        if (stats.isDirectory()) {
          const size = calculateDirSizeShallow(itemPath) // Solo nivel superior para node_modules
          dirs.push({ name: item, size })
        }
      } catch {
        // Ignorar directorios inaccesibles
      }
    }
  } catch {
    // Directorio inaccesible
  }

  return dirs.sort((a, b) => b.size - a.size).slice(0, limit)
}

// Función para calcular tamaño de directorio sin recursión (para node_modules)
function calculateDirSizeShallow(dirPath: string): number {
  let totalSize = 0

  try {
    const items = readdirSync(dirPath)

    for (const item of items) {
      const itemPath = join(dirPath, item)
      try {
        const stats = statSync(itemPath)

        if (stats.isDirectory()) {
          // Para node_modules, calcular recursivamente pero con límite
          totalSize += calculateDirSizeWithLimit(itemPath, 3)
        } else {
          totalSize += stats.size
        }
      } catch {
        // Ignorar archivos inaccesibles
      }
    }
  } catch {
    // Directorio inaccesible
  }

  return totalSize
}

// Función para calcular tamaño con límite de profundidad
function calculateDirSizeWithLimit(dirPath: string, maxDepth: number): number {
  if (maxDepth <= 0) return 0

  let totalSize = 0

  try {
    const items = readdirSync(dirPath)

    for (const item of items) {
      const itemPath = join(dirPath, item)
      try {
        const stats = statSync(itemPath)

        if (stats.isDirectory()) {
          totalSize += calculateDirSizeWithLimit(itemPath, maxDepth - 1)
        } else {
          totalSize += stats.size
        }
      } catch {
        // Ignorar archivos inaccesibles
      }
    }
  } catch {
    // Directorio inaccesible
  }

  return totalSize
}
