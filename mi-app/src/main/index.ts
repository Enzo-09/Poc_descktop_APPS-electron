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
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
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

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Instalar React DevTools en desarrollo
  if (is.dev) {
    installExtension(REACT_DEVELOPER_TOOLS)
      .then((name) => console.log(`Added Extension: ${name}`))
      .catch((err) => console.log('An error occurred: ', err))
  }

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Denegar permisos del sistema por defecto
  session.defaultSession.setPermissionRequestHandler((_wc, _perm, callback) => callback(false))

  // CSP por cabecera (más estricto en prod, permite HMR en dev)
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const csp = [
      "default-src 'self'",
      "script-src 'self'",
      // Mantener 'unsafe-inline' en styles para no romper estilos inline de React
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      `connect-src 'self'${is.dev ? ' ws://localhost:*' : ''}`,
      "font-src 'self' data:",
      "object-src 'none'",
      "base-uri 'none'",
      "frame-ancestors 'none'",
      "worker-src 'none'",
    ].join('; ')

    const responseHeaders = {
      ...(details.responseHeaders || {}),
      'Content-Security-Policy': [csp]
    } as Record<string, string | string[]>

    callback({ responseHeaders })
  })

  // Registrar handlers IPC de notas y métricas
  registerIpcHandlers()//registra los canales IPC

  createWindow() //crea la ventana principal

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
