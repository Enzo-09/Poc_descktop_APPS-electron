import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFileSync } from 'fs'
import { join } from 'path'

const execAsync = promisify(exec)

interface MetricResult {
  name: string
  value: string
  unit: string
  timestamp: string
}

async function generatePerformanceReport() {
  console.log('🚀 Generando reporte de performance...\n')
  
  const results: MetricResult[] = []
  const startTime = Date.now()
  
  try {
    // Ejecutar tests de performance
    const { stdout } = await execAsync('npm test -- src/main/__tests__/performance.test.ts', {
      cwd: process.cwd()
    })
    
    const testTime = Date.now() - startTime
    
    // Extraer métricas del output usando regex
    const metrics = extractMetrics(stdout)
    results.push(...metrics)
    
    // Generar reporte HTML
    generateHTMLReport(results, testTime)
    
    // Generar reporte JSON
    generateJSONReport(results, testTime)
    
    // Mostrar resumen en consola
    showSummary(results, testTime)
    
  } catch (error) {
    console.error('❌ Error generando reporte:', error)
  }
}

function extractMetrics(output: string): MetricResult[] {
  const metrics: MetricResult[] = []
  const timestamp = new Date().toISOString()
  
  // Extraer métricas usando regex
  const patterns = [
    { name: 'Tamaño del Paquete', pattern: /MÉTRICA: Paquete = ([\d.]+) MB/, unit: 'MB' },
    { name: 'RAM Idle', pattern: /RAM idle = ([\d.]+) MB/, unit: 'MB' },
    { name: 'RAM Bajo Carga', pattern: /RAM carga = ([\d.]+) MB/, unit: 'MB' },
    { name: 'Tiempo de Arranque', pattern: /Arranque = ([\d.]+)ms/, unit: 'ms' },
    { name: 'CRUD Total', pattern: /CRUD total = ([\d.]+)ms/, unit: 'ms' },
    { name: 'Build/TypeScript', pattern: /TypeScript = ([\d.]+)ms/, unit: 'ms' }
  ]
  
  patterns.forEach(({ name, pattern, unit }) => {
    const match = output.match(pattern)
    if (match) {
      metrics.push({
        name,
        value: match[1],
        unit,
        timestamp
      })
    }
  })
  
  return metrics
}

function generateHTMLReport(results: MetricResult[], testTime: number) {
  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte de Performance - Mi App Electron</title>
    <style>
        body { 
            font-family: 'Segoe UI', sans-serif; 
            margin: 40px; 
            background: #1e1e1e; 
            color: #fff; 
        }
        .container { max-width: 800px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 40px; }
        .metric { 
            background: #2d2d2d; 
            border-radius: 8px; 
            padding: 20px; 
            margin-bottom: 20px;
            border-left: 4px solid #ffdd57;
        }
        .metric-name { font-size: 18px; font-weight: bold; margin-bottom: 8px; }
        .metric-value { font-size: 24px; color: #ffdd57; }
        .summary { 
            background: #0d1117; 
            border-radius: 8px; 
            padding: 20px; 
            margin-top: 40px;
        }
        .badge { 
            display: inline-block; 
            background: #238636; 
            color: white; 
            padding: 4px 8px; 
            border-radius: 4px; 
            font-size: 12px; 
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Reporte de Performance</h1>
            <p>Mi App Electron - ${new Date().toLocaleString()}</p>
            <span class="badge">Tests ejecutados en ${testTime}ms</span>
        </div>
        
        ${results.map(metric => `
            <div class="metric">
                <div class="metric-name">${metric.name}</div>
                <div class="metric-value">${metric.value} ${metric.unit}</div>
            </div>
        `).join('')}
        
        <div class="summary">
            <h2>📈 Resumen</h2>
            <ul>
                <li><strong>Tamaño optimizado:</strong> Paquete estimado de ${results.find(r => r.name.includes('Paquete'))?.value || 'N/A'} MB</li>
                <li><strong>Memoria eficiente:</strong> Incremento de RAM de solo ${
                  results.find(r => r.name.includes('Bajo Carga')) && results.find(r => r.name.includes('Idle'))
                    ? (parseFloat(results.find(r => r.name.includes('Bajo Carga'))!.value) - parseFloat(results.find(r => r.name.includes('Idle'))!.value)).toFixed(2)
                    : 'N/A'
                } MB bajo carga</li>
                <li><strong>Arranque rápido:</strong> ${results.find(r => r.name.includes('Arranque'))?.value || 'N/A'} ms</li>
                <li><strong>CRUD eficiente:</strong> ${results.find(r => r.name.includes('CRUD'))?.value || 'N/A'} ms para 100 operaciones</li>
                <li><strong>Build verificado:</strong> TypeScript check en ${results.find(r => r.name.includes('Build'))?.value || 'N/A'} ms</li>
            </ul>
        </div>
    </div>
</body>
</html>
  `
  
  writeFileSync(join(process.cwd(), 'performance-report.html'), html)
  console.log('📄 Reporte HTML generado: performance-report.html')
}

function generateJSONReport(results: MetricResult[], testTime: number) {
  const report = {
    timestamp: new Date().toISOString(),
    testExecutionTime: testTime,
    metrics: results.reduce((acc, metric) => {
      acc[metric.name] = {
        value: parseFloat(metric.value),
        unit: metric.unit,
        timestamp: metric.timestamp
      }
      return acc
    }, {} as Record<string, any>),
    summary: {
      packageSizeMB: parseFloat(results.find(r => r.name.includes('Paquete'))?.value || '0'),
      ramIdleMB: parseFloat(results.find(r => r.name.includes('Idle'))?.value || '0'),
      ramLoadMB: parseFloat(results.find(r => r.name.includes('Bajo Carga'))?.value || '0'),
      startupTimeMs: parseFloat(results.find(r => r.name.includes('Arranque'))?.value || '0'),
      crudTotalMs: parseFloat(results.find(r => r.name.includes('CRUD'))?.value || '0'),
      buildTimeMs: parseFloat(results.find(r => r.name.includes('Build'))?.value || '0')
    }
  }
  
  writeFileSync(join(process.cwd(), 'performance-report.json'), JSON.stringify(report, null, 2))
  console.log('📊 Reporte JSON generado: performance-report.json')
}

function showSummary(results: MetricResult[], testTime: number) {
  console.log('\n' + '='.repeat(60))
  console.log('📊 RESUMEN DE PERFORMANCE')
  console.log('='.repeat(60))
  
  results.forEach(metric => {
    console.log(`${metric.name}: ${metric.value} ${metric.unit}`)
  })
  
  console.log('='.repeat(60))
  console.log(`⏱️ Tiempo total de tests: ${testTime}ms`)
  console.log(`📅 Fecha: ${new Date().toLocaleString()}`)
  console.log('='.repeat(60))
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  generatePerformanceReport()
}

export { generatePerformanceReport }
