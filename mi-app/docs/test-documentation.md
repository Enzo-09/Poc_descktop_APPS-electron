# Documentación de Tests - Mi App

## Resumen General

Esta aplicación Electron cuenta con una suite completa de tests que validan tres módulos principales:

- **notesStore**: Gestión de notas (CRUD + operaciones masivas)
- **fsHelpers**: Operaciones del sistema de archivos
- **metrics**: Medición de rendimiento y métricas

## Tests de NotesStore (`src/main/__tests__/notesStore.test.ts`)

### Tests Básicos

#### 1. `crea y obtiene nota`

- **Propósito**: Validar que el flujo básico de crear→obtener funciona correctamente
- **Qué hace**: Crea una nota con título y contenido, luego la recupera por ID
- **Métricas**: Tiempo de creación + recuperación

#### 2. `lista varias notas`

- **Propósito**: Comprobar que la función listNotes retorna todas las notas creadas
- **Qué hace**: Crea 2 notas y verifica que el listado las incluya ambas
- **Métricas**: Tiempo total de crear 2 notas + listarlas

#### 3. `actualiza nota`

- **Propósito**: Validar que los cambios en una nota se persisten correctamente
- **Qué hace**: Crea una nota, modifica su contenido y verifica el cambio
- **Métricas**: Tiempo de creación + actualización

#### 4. `borra nota`

- **Propósito**: Comprobar que al eliminar una nota, esta ya no es accesible
- **Qué hace**: Crea una nota, la elimina y verifica que no se puede recuperar
- **Métricas**: Tiempo de creación + eliminación

#### 5. `seed limita y crea`

- **Propósito**: Validar que la función seed respeta el límite especificado
- **Qué hace**: Usa seedNotes(5) para crear exactamente 5 notas
- **Métricas**: Tiempo para crear 5 notas

### Test de Rendimiento Principal

#### 6. `test de rendimiento: crea 100 notas, lista y elimina` ⭐

- **Propósito**: Medir el rendimiento del sistema con un volumen mayor de notas
- **Fases del test**:
  1. **Creación**: Usa `seedNotes(100)` para crear 100 notas
  2. **Listado**: Ejecuta `listNotes()` para obtener todas las notas
  3. **Eliminación**: Elimina cada nota individualmente con `deleteNoteById()`
  4. **Verificación**: Confirma que no quedan notas

- **Métricas detalladas**:
  - Tiempo de creación de 100 notas
  - Tiempo de listado de 100 notas
  - Tiempo de eliminación de 100 notas
  - Tiempo total del test
  - Promedio por nota (creación y eliminación)

- **Reporte JSON**: Genera un objeto con todas las métricas para análisis posterior

## Tests de Métricas (`src/main/__tests__/metrics.test.ts`)

#### 1. `measure devuelve data y ms`

- **Propósito**: Validar que measure retorna tanto el resultado como el tiempo transcurrido
- **Qué hace**: Mide la ejecución de una función simple que retorna 42
- **Métricas**: Tiempo del test + tiempo medido por la función

#### 2. `footprint retorna dataBytes`

- **Propósito**: Comprobar que footprint calcula correctamente el tamaño en bytes
- **Qué hace**: Calcula el footprint del directorio de datos
- **Métricas**: Tiempo de cálculo + tamaño actual en bytes

#### 3. `memoryUsage retorna campos`

- **Propósito**: Validar que memoryUsage retorna métricas válidas de memoria
- **Qué hace**: Obtiene información de uso de memoria del proceso Node.js
- **Métricas**: Tiempo de obtención + memoria RSS en MB

## Tests de Sistema de Archivos (`src/main/__tests__/fsHelpers.test.ts`)

#### 1. `crea directorio y escribe/lee json`

- **Propósito**: Validar que los datos se escriben y leen correctamente del sistema de archivos
- **Qué hace**: Escribe un objeto JSON y lo lee de vuelta
- **Métricas**: Tiempo de escritura + lectura

#### 2. `lista archivos json`

- **Propósito**: Comprobar que listJsonFiles retorna todos los archivos .json existentes
- **Qué hace**: Crea 2 archivos JSON y verifica que aparezcan en el listado
- **Métricas**: Tiempo de creación + listado

#### 3. `borra archivo`

- **Propósito**: Validar que deleteFile elimina correctamente un archivo
- **Qué hace**: Crea un archivo, lo elimina y verifica que ya no existe
- **Métricas**: Tiempo de creación + eliminación

#### 4. `calcula tamaño`

- **Propósito**: Comprobar que dirSizeBytes calcula correctamente el espacio ocupado
- **Qué hace**: Crea un archivo con contenido y mide el tamaño del directorio
- **Métricas**: Tiempo de cálculo + tamaño en bytes

## Cómo Ejecutar los Tests

### Comando Principal

```bash
npm run test
```

### Opciones Adicionales

```bash
# Test con salida detallada
npx vitest run --reporter verbose

# Test en modo watch (desarrollo)
npm run test:ui

# Test con cobertura
npm run coverage

# Guardar resultados en JSON
npx vitest run --reporter=json > resultado.json
```

## Interpretación de Resultados

### Salida Típica

```
✓ src/main/__tests__/metrics.test.ts (3 tests) 31ms
✓ src/main/__tests__/fsHelpers.test.ts (4 tests) 59ms
✓ src/main/__tests__/notesStore.test.ts (6 tests) 62ms

Test Files  3 passed (3)
     Tests  13 passed (13)
```

### Métricas de Rendimiento

Los tests imprimen métricas detalladas en consola:

- ⏱️ Tiempos de ejecución individuales
- 📊 Reportes de rendimiento
- 💾 Información de espacio en disco
- 🧠 Uso de memoria

### Test de 100 Notas - Ejemplo de Salida

```
🚀 Iniciando test de rendimiento con 100 notas...
✅ Creadas 100 notas en 45.32ms
📋 Listadas 100 notas en 12.87ms
🗑️ Eliminadas 100 notas en 89.45ms
🏁 Tiempo total del test: 147.64ms
📊 Reporte de rendimiento: {
  "totalNotes": 100,
  "createTime": 45.32,
  "listTime": 12.87,
  "deleteTime": 89.45,
  "totalTime": 147.64,
  "avgCreatePerNote": 0.45,
  "avgDeletePerNote": 0.89
}
```

## Tecnologías Utilizadas

- **Vitest**: Framework de testing
- **Electron**: Aplicación de escritorio
- **Node.js**: Sistema de archivos y métricas
- **TypeScript**: Tipado estático
- **Performance API**: Medición de tiempos precisos
