import { app, shell, BrowserWindow, session } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { registerIpcHandlers } from './ipc'
import installExtension, { REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false, // Desactivar sandbox temporalmente para depuración
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    // Abrir DevTools en desarrollo para depurar
    if (is.dev) {
      mainWindow.webContents.openDevTools()
    }
  })

  // Cerrar/impedir DevTools en producción
  if (!is.dev) {
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow.webContents.closeDevTools()
    })
  }

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Bloquear navegación fuera de la app y abrir enlaces externos en el navegador
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    try {
      const url = new URL(navigationUrl)
      // Permitimos solo esquemas file: y about:blank
      if (url.protocol !== 'file:' && url.protocol !== 'about:') {
        event.preventDefault()
        shell.openExternal(navigationUrl)
      }
    } catch {
      // Si la URL es inválida, la bloqueamos por seguridad
      event.preventDefault()
    }
  })

  // HMR for renderer base on electron-vite cli.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Instalar React DevTools en desarrollo (sin duplicar app.whenReady)
  if (is.dev) {
    installExtension(REACT_DEVELOPER_TOOLS)
      .then((name) => console.log(`Added Extension: ${name}`))
      .catch((err) => console.log('Extension error:', err))
  }

  // Default open or close DevTools by F12 in development
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Denegar permisos del sistema por defecto
  session.defaultSession.setPermissionRequestHandler((_wc, _perm, callback) => callback(false))

  // CSP por cabecera: activo. En desarrollo permitimos el dev server y WS; en producción es estricto
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const devServer = process.env['ELECTRON_RENDERER_URL']
    const devOrigin = devServer ? new URL(devServer).origin : ''

    const csp = is.dev
      ? [
          `default-src 'self' ${devOrigin}`,
          `script-src 'self' 'unsafe-eval' 'unsafe-inline' ${devOrigin}`,
          `style-src 'self' 'unsafe-inline' ${devOrigin}`,
          `img-src 'self' data: blob: file: ${devOrigin}`,
          `font-src 'self' data: ${devOrigin}`,
          `connect-src 'self' ws://localhost:* ws://127.0.0.1:* ${devOrigin}`,
          "object-src 'none'",
          "base-uri 'none'",
          "frame-ancestors 'none'",
          "worker-src 'self' blob:",
        ].join('; ')
      : [
          "default-src 'self'",
          "script-src 'self'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: blob: file:",
          "font-src 'self' data:",
          "connect-src 'self'",
          "object-src 'none'",
          "base-uri 'none'",
          "frame-ancestors 'none'",
          "worker-src 'none'",
        ].join('; ')

    const responseHeaders = {
      ...(details.responseHeaders || {}),
      'Content-Security-Policy': [csp],
      'X-Content-Type-Options': ['nosniff']
    } as Record<string, string | string[]>

    callback({ responseHeaders })
  })

  // Registrar handlers IPC de notas y métricas
  registerIpcHandlers()

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
