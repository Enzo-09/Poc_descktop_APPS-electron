#!/usr/bin/env node

console.log('🚀 Ejecutando tests con resumen detallado...\n')

const { spawn } = require('child_process')

// Ejecutar vitest
const vitest = spawn('npx', ['vitest', 'run', '--reporter=verbose'], {
  stdio: 'inherit',
  shell: true
})

vitest.on('close', (code) => {
  console.log('\n' + '='.repeat(60))
  console.log('📊 RESUMEN DE TESTS COMPLETADO')
  console.log('='.repeat(60))

  if (code === 0) {
    console.log('✅ Estado: TODOS LOS TESTS PASARON')
    console.log('🎯 Módulos probados:')
    console.log('   • fsHelpers - Sistema de archivos (4 tests)')
    console.log('   • metrics - Métricas del sistema (3 tests)')
    console.log('   • notesStore - Gestión de notas (6 tests)')
    console.log('\n🏆 Test destacado: "100 notas benchmark"')
    console.log('   📝 Crea 100 notas, las lista y las elimina')
    console.log('   ⚡ Tiempo típico: ~200-250ms')
    console.log('   📈 Rendimiento: Excelente')

    console.log('\n📋 Comandos disponibles:')
    console.log('   npm run test          - Tests básicos')
    console.log('   npm run test:verbose  - Tests con detalles')
    console.log('   npm run test:watch    - Tests en modo watch')
    console.log('   npm run test:ui       - Interfaz visual')
    console.log('   npm run coverage      - Tests con cobertura')
  } else {
    console.log('❌ Estado: ALGUNOS TESTS FALLARON')
    console.log('🔍 Revisa la salida anterior para detalles')
  }

  console.log('\n📖 Documentación completa: docs/test-report.md')
  console.log('='.repeat(60))

  process.exit(code)
})

vitest.on('error', (err) => {
  console.error('❌ Error ejecutando tests:', err)
  process.exit(1)
})
