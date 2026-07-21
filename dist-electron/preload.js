import { contextBridge as e, ipcRenderer as t } from "electron";
//#region electron/preload.ts
e.exposeInMainWorld("electronAPI", { printReceipt: (e, n) => t.invoke("print-receipt", e, n) });
//#endregion
export {};
