import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { registerPrinterHandlers } from './ipc/printerHandlers'
import { initPrinter } from './printer/escposPrinter'

let mainWindow: BrowserWindow | null = null

const isDev = process.env.NODE_ENV === 'development'
const NUXT_URL = 'http://localhost:3000'

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: 'Tapsilogan POS',
    autoHideMenuBar: true,
  })

  if (isDev) {
    // Dev: load from Nuxt dev server
    mainWindow.loadURL(NUXT_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../.output/public/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(async () => {
  // Register printer IPC handlers
  registerPrinterHandlers(ipcMain)

  createWindow()

  // Auto-connect printer on startup (non-blocking)
  initPrinter().catch((err) => {
    console.error('Printer init failed:', err)
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (mainWindow === null) createWindow()
})