// electron/preload.ts
var import_electron = require("electron");
import_electron.contextBridge.exposeInMainWorld("electronAPI", {
  // Send print request to main process
  printReceipt: (order, branchName) => import_electron.ipcRenderer.invoke("print-receipt", order, branchName)
  // You can add other IPC methods here (e.g., testPrint)
});
