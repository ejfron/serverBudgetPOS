var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// electron/main.ts
var import_electron2 = require("electron");
var import_path = __toESM(require("path"), 1);

// electron/ipc/printerHandlers.ts
var import_electron = require("electron");

// electron/printer/escposPrinter.ts
var import_serialport = require("serialport");
var DEFAULT_PRINTER_PORT = "/dev/cu.PT-210_ECC5";
var BAUD_RATE = 115200;
var ESC = "\x1B";
var GS = "";
var CMD = {
  INIT: `${ESC}@`,
  BOLD_ON: `${ESC}E`,
  BOLD_OFF: `${ESC}E\0`,
  ALIGN_CENTER: `${ESC}a`,
  ALIGN_LEFT: `${ESC}a\0`,
  ALIGN_RIGHT: `${ESC}a`,
  DOUBLE_HEIGHT_ON: `${ESC}!`,
  DOUBLE_HEIGHT_OFF: `${ESC}!\0`,
  DOUBLE_WIDTH_ON: `${ESC}! `,
  DOUBLE_WIDTH_OFF: `${ESC}!\0`,
  UNDERLINE_ON: `${ESC}-`,
  UNDERLINE_OFF: `${ESC}-\0`,
  CUT: `${GS}VA`,
  // partial cut with 3mm feed
  FEED: (n) => `${ESC}d${String.fromCharCode(n)}`,
  LINE: "--------------------------------\n",
  // 32 chars = 58mm width
  DASHED: "- - - - - - - - - - - - - - - -\n"
};
var currentPort = null;
async function connectPrinter(portPath) {
  try {
    const targetPath = portPath || DEFAULT_PRINTER_PORT;
    if (currentPort == null ? void 0 : currentPort.isOpen) {
      await disconnectPrinter();
    }
    currentPort = new import_serialport.SerialPort({
      path: targetPath,
      baudRate: BAUD_RATE,
      autoOpen: false
    });
    await new Promise((resolve, reject) => {
      currentPort.open((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    console.log(`\u{1F5A8}\uFE0F Printer connected: ${targetPath} @ ${BAUD_RATE} baud`);
    return { ok: true, path: targetPath };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to connect printer";
    console.error("\u274C Printer connect failed:", message);
    return { ok: false, error: message };
  }
}
async function disconnectPrinter() {
  if (currentPort == null ? void 0 : currentPort.isOpen) {
    await new Promise((resolve) => currentPort.close(() => resolve()));
  }
  currentPort = null;
}
function getPrinterStatus() {
  return {
    connected: (currentPort == null ? void 0 : currentPort.isOpen) ?? false,
    path: (currentPort == null ? void 0 : currentPort.path) ?? null
  };
}
async function initPrinter() {
  const result = await connectPrinter(DEFAULT_PRINTER_PORT);
  if (!result.ok) {
    console.error("\u274C Printer init failed:", result.error);
  } else {
    console.log("\u2705 Printer ready:", result.path);
  }
}
function pad(left, right, width = 32) {
  const spaces = Math.max(width - left.length - right.length, 1);
  return left + " ".repeat(spaces) + right;
}
function peso(amount) {
  return `P${amount.toFixed(2)}`;
}
function buildReceipt(order, branchName) {
  const lines = [];
  const now = new Date(order.created_at);
  const dateStr = now.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
  const timeStr = now.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });
  lines.push(CMD.INIT);
  lines.push(CMD.ALIGN_CENTER);
  lines.push(CMD.BOLD_ON);
  lines.push(CMD.DOUBLE_HEIGHT_ON);
  lines.push("TAPSILOGAN\n");
  lines.push(CMD.DOUBLE_HEIGHT_OFF);
  lines.push(CMD.BOLD_OFF);
  lines.push(`${branchName}
`);
  lines.push("\n");
  lines.push(CMD.ALIGN_LEFT);
  lines.push(CMD.LINE);
  lines.push(`Order #: ${String(order.order_number).padStart(3, "0")}
`);
  lines.push(`Date   : ${dateStr}
`);
  lines.push(`Time   : ${timeStr}
`);
  lines.push(CMD.LINE);
  lines.push(CMD.BOLD_ON);
  lines.push(pad("ITEM", "AMOUNT"));
  lines.push("\n");
  lines.push(CMD.BOLD_OFF);
  lines.push(CMD.DASHED);
  for (const item of order.order_items ?? []) {
    lines.push(`${item.item_name}
`);
    const qtyPrice = `  ${item.quantity} x ${peso(item.unit_price)}`;
    lines.push(pad(qtyPrice, peso(item.subtotal)) + "\n");
  }
  lines.push(CMD.DASHED);
  lines.push(CMD.BOLD_ON);
  lines.push(pad("TOTAL", peso(order.total_amount)) + "\n");
  lines.push(CMD.BOLD_OFF);
  lines.push(CMD.LINE);
  lines.push(`Payment: Cash
`);
  lines.push(CMD.LINE);
  lines.push(CMD.ALIGN_CENTER);
  lines.push("\n");
  lines.push("Salamat po!\n");
  lines.push("Balik kayo :)\n");
  lines.push("\n");
  lines.push(CMD.FEED(5));
  lines.push(CMD.CUT);
  return lines.join("");
}
async function printReceipt(order, branchName) {
  if (!(currentPort == null ? void 0 : currentPort.isOpen)) {
    const reconnect = await connectPrinter(DEFAULT_PRINTER_PORT);
    if (!reconnect.ok) {
      return { ok: false, error: "Printer not connected. Make sure PT-210 is paired via Bluetooth." };
    }
  }
  try {
    const receipt = buildReceipt(order, branchName);
    const encoder = new TextEncoder();
    const bytes = Buffer.from(encoder.encode(receipt));
    await new Promise((resolve, reject) => {
      currentPort.write(bytes, (err) => {
        if (err) reject(err);
        else currentPort.drain(() => resolve());
      });
    });
    console.log(`\u2705 Receipt printed \u2014 Order #${order.order_number}`);
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Print failed";
    console.error("\u274C Print error:", message);
    return { ok: false, error: message };
  }
}

// electron/ipc/printerHandlers.ts
function registerPrinterHandlers() {
  import_electron.ipcMain.handle("printer:connect", async (_event, portPath) => {
    return await connectPrinter(portPath);
  });
  import_electron.ipcMain.handle("printer:disconnect", async () => {
    await disconnectPrinter();
    return { ok: true };
  });
  import_electron.ipcMain.handle("printer:status", () => {
    return getPrinterStatus();
  });
  import_electron.ipcMain.handle("printer:print", async (_event, payload) => {
    try {
      return await printReceipt(payload.orderData, payload.branchName);
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Print failed" };
    }
  });
}

// electron/main.ts
var mainWindow = null;
var isDev = process.env.NODE_ENV === "development";
var NUXT_URL = "http://localhost:3000";
function createWindow() {
  mainWindow = new import_electron2.BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    webPreferences: {
      preload: import_path.default.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    },
    title: "Tapsilogan POS",
    autoHideMenuBar: true
  });
  if (isDev) {
    mainWindow.loadURL(NUXT_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(import_path.default.join(__dirname, "../.output/public/index.html"));
  }
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}
import_electron2.app.whenReady().then(async () => {
  registerPrinterHandlers(import_electron2.ipcMain);
  createWindow();
  initPrinter().catch((err) => {
    console.error("Printer init failed:", err);
  });
});
import_electron2.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") import_electron2.app.quit();
});
import_electron2.app.on("activate", () => {
  if (mainWindow === null) createWindow();
});
