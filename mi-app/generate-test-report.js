const fs = require('fs')
const path = require('path')

// Leer el archivo JSON de resultados
const resultsPath = path.join(__dirname, 'test-results.json')
const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'))

// Función para formatear duración
function formatDuration(ms) {
  if (ms < 1000) {
    return `${ms.toFixed(2)}ms`
  } else {
    return `${(ms / 1000).toFixed(2)}s`
  }
}

// Función para formatear fecha
function formatDate(timestamp) {
  return new Date(timestamp).toLocaleString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// Generar reporte en Markdown
function generateReport() {
  const startTime = results.startTime
  const totalDuration = results.testResults.reduce((total, suite) => {
    return total + (suite.endTime - suite.startTime)
  }, 0)

  let report = `# Reporte de Tests - Mi App Electron

## Resumen General

📅 **Fecha de ejecución**: ${formatDate(startTime)}
⏱️ **Duración total**: ${formatDuration(totalDuration)}
✅ **Tests exitosos**: ${results.numPassedTests}/${results.numTotalTests}
🗂️ **Suites exitosas**: ${results.numPassedTestSuites}/${results.numTotalTestSuites}
${results.success ? '🎉 **Estado**: TODOS LOS TESTS PASARON' : '❌ **Estado**: ALGUNOS TESTS FALLARON'}

## Resultados por Módulo

`

  // Procesar cada suite de tests
  results.testResults.forEach((suite) => {
    const suiteName = path.basename(suite.name, '.test.ts')
    const suiteDuration = suite.endTime - suite.startTime

    report += `### ${suiteName}\n\n`
    report += `- **Archivo**: \`${path.relative(process.cwd(), suite.name)}\`\n`
    report += `- **Duración**: ${formatDuration(suiteDuration)}\n`
    report += `- **Tests**: ${suite.assertionResults.length}\n`
    report += `- **Estado**: ${suite.status === 'passed' ? '✅ PASÓ' : '❌ FALLÓ'}\n\n`

    // Lista de tests individuales
    report += `#### Tests individuales:\n\n`
    suite.assertionResults.forEach((test) => {
      const status = test.status === 'passed' ? '✅' : '❌'
      report += `${status} **${test.title}** - ${formatDuration(test.duration)}\n`
    })
    report += '\n'
  })

  // Análisis de rendimiento del test de 100 notas
  const notesStoreSuite = results.testResults.find((suite) =>
    suite.name.includes('notesStore.test.ts')
  )

  if (notesStoreSuite) {
    const benchmarkTest = notesStoreSuite.assertionResults.find((test) =>
      test.title.includes('test de rendimiento')
    )

    if (benchmarkTest) {
      report += `## 🚀 Análisis de Rendimiento - Test de 100 Notas

El test más importante para medir rendimiento fue **"${benchmarkTest.title}"**:

- **Duración total**: ${formatDuration(benchmarkTest.duration)}
- **Operaciones realizadas**:
  1. ✏️ Creación de 100 notas
  2. 📋 Listado de 100 notas  
  3. 🗑️ Eliminación de 100 notas una por una
- **Promedio por operación**: ${formatDuration(benchmarkTest.duration / 300)} (300 operaciones totales)

### Interpretación de Resultados

`

      if (benchmarkTest.duration < 500) {
        report += `🟢 **Excelente rendimiento** - El sistema maneja 100 notas en menos de 500ms\n`
      } else if (benchmarkTest.duration < 1000) {
        report += `🟡 **Buen rendimiento** - El sistema maneja 100 notas en menos de 1 segundo\n`
      } else {
        report += `🔴 **Rendimiento a mejorar** - El sistema tarda más de 1 segundo para 100 notas\n`
      }
    }
  }

  report += `
## 📊 Estadísticas Detalladas

| Métrica | Valor |
|---------|--------|
| Tests totales | ${results.numTotalTests} |
| Tests exitosos | ${results.numPassedTests} |
| Tests fallidos | ${results.numFailedTests} |
| Suites totales | ${results.numTotalTestSuites} |
| Suites exitosas | ${results.numPassedTestSuites} |
| Tiempo promedio por test | ${formatDuration(totalDuration / results.numTotalTests)} |

## 🔧 Tecnologías Utilizadas

- **Framework de testing**: Vitest
- **Entorno**: Node.js + Electron
- **Lenguaje**: TypeScript
- **Sistema de archivos**: JSON files
- **Métricas**: Performance API

## 📝 Notas

Este reporte fue generado automáticamente el ${formatDate(Date.now())} basado en la ejecución de tests de la aplicación Electron Mi App.

Para ejecutar los tests manualmente:
\`\`\`bash
npm run test
\`\`\`

Para generar este reporte:
\`\`\`bash
npm run test:report
\`\`\`
`

  return report
}

// Generar el reporte
const report = generateReport()

// Guardar el reporte
const outputPath = path.join(__dirname, 'docs', 'test-report.md')
fs.mkdirSync(path.dirname(outputPath), { recursive: true })
fs.writeFileSync(outputPath, report, 'utf8')

console.log('✅ Reporte generado exitosamente en:', outputPath)
console.log('📊 Resumen:')
console.log(`   - Tests ejecutados: ${results.numTotalTests}`)
console.log(`   - Tests exitosos: ${results.numPassedTests}`)
console.log(
  `   - Duración total: ${results.testResults.reduce((total, suite) => total + (suite.endTime - suite.startTime), 0).toFixed(2)}ms`
)
