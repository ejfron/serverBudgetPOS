import { ipcMain } from 'electron'
import { connectPrinter, disconnectPrinter, getPrinterStatus, listPorts, printReceipt } from '../printer/escposPrinter'

export function registerPrinterHandlers(ipcMain: Electron.IpcMain) {
  ipcMain.handle('printer:connect', async (_event, portPath?: string) => {
    return await connectPrinter(portPath)
  })

  ipcMain.handle('printer:list-ports', async () => {
    return await listPorts()
  })

  ipcMain.handle('printer:disconnect', async () => {
    await disconnectPrinter()
    return { ok: true }
  })

  ipcMain.handle('printer:status', () => {
    return getPrinterStatus()
  })

  ipcMain.handle('printer:print', async (_event, payload: { orderData: any; branchName: string }) => {
    try {
      return await printReceipt(payload.orderData, payload.branchName)
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Print failed' }
    }
  })
}