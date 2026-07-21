import { contextBridge, ipcRenderer } from 'electron'

// Expose only specific IPC methods to the renderer (Nuxt UI)
// This keeps Node.js access sandboxed — renderer can't call Node directly
contextBridge.exposeInMainWorld('electronAPI', {
  // Printer
  connectPrinter: (portPath?: string) => ipcRenderer.invoke('printer:connect', portPath),
  disconnectPrinter: () => ipcRenderer.invoke('printer:disconnect'),
  printReceipt: (orderData: any, branchName: string) =>
    ipcRenderer.invoke('printer:print', { orderData, branchName }),
  getPrinterStatus: () => ipcRenderer.invoke('printer:status'),
  listPorts: () => ipcRenderer.invoke('printer:list-ports'),

  // Check if running inside Electron (Nuxt can check this)
  isElectron: true,
})