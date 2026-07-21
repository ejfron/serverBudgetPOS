import { SerialPort } from 'serialport'
import type { Order } from '../../shared/types/order.types'

const DEFAULT_PRINTER_PORT = '/dev/cu.PT-210_ECC5'
const BAUD_RATE = 115200
const PORT_HINTS = [
  /PT-210/i,
  /XPrinter/i,
  /ttyUSB/i,
  /tty\.usbserial/i,
  /cu\.usbserial/i,
  /usbmodem/i,
]

const ESC = '\x1B'
const GS  = '\x1D'

const CMD = {
  INIT:              `${ESC}\x40`,
  BOLD_ON:           `${ESC}\x45\x01`,
  BOLD_OFF:          `${ESC}\x45\x00`,
  ALIGN_CENTER:      `${ESC}\x61\x01`,
  ALIGN_LEFT:        `${ESC}\x61\x00`,
  ALIGN_RIGHT:       `${ESC}\x61\x02`,
  DOUBLE_HEIGHT_ON:  `${ESC}\x21\x10`,
  DOUBLE_HEIGHT_OFF: `${ESC}\x21\x00`,
  DOUBLE_WIDTH_ON:   `${ESC}\x21\x20`,
  DOUBLE_WIDTH_OFF:  `${ESC}\x21\x00`,
  UNDERLINE_ON:      `${ESC}\x2D\x01`,
  UNDERLINE_OFF:     `${ESC}\x2D\x00`,
  CUT:               `${GS}\x56\x41\x03`,   // partial cut with 3mm feed
  FEED:              (n: number) => `${ESC}\x64${String.fromCharCode(n)}`,
  LINE:              '--------------------------------\n',  // 32 chars = 58mm width
  DASHED:            '- - - - - - - - - - - - - - - -\n',
}

let currentPort: SerialPort | null = null

export async function listPorts(): Promise<string[]> {
  const ports = await SerialPort.list()
  return ports.map((p) => p.path)
}

async function pickPort(portPath?: string): Promise<string> {
  if (portPath) return portPath

  const ports = await listPorts()
  const hintedPort = ports.find((candidate) => PORT_HINTS.some((pattern) => pattern.test(candidate)))
  if (hintedPort) return hintedPort

  if (ports.includes(DEFAULT_PRINTER_PORT)) return DEFAULT_PRINTER_PORT

  return DEFAULT_PRINTER_PORT
}

export async function connectPrinter(portPath?: string): Promise<{ ok: boolean; path?: string; error?: string; availablePorts?: string[] }> {
  try {
    const availablePorts = await listPorts()
    const targetPath = await pickPort(portPath)

    if (currentPort?.isOpen) {
      await disconnectPrinter()
    }

    currentPort = new SerialPort({
      path: targetPath,
      baudRate: BAUD_RATE,
      autoOpen: false,
    })

    await new Promise<void>((resolve, reject) => {
      currentPort!.open((err) => {
        if (err) reject(err)
        else resolve()
      })
    })

    console.log(`🖨️ Printer connected: ${targetPath} @ ${BAUD_RATE} baud`)
    return { ok: true, path: targetPath, availablePorts }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to connect printer'
    const availablePorts = await listPorts()
    console.error('❌ Printer connect failed:', message)
    return {
      ok: false,
      error: `${message}. Available ports: ${availablePorts.join(', ') || 'none found'}`,
      availablePorts,
    }
  }
}

export async function disconnectPrinter(): Promise<void> {
  if (currentPort?.isOpen) {
    await new Promise<void>((resolve) => currentPort!.close(() => resolve()))
  }
  currentPort = null
}

export function getPrinterStatus(): { connected: boolean; path: string | null } {
  return {
    connected: currentPort?.isOpen ?? false,
    path: currentPort?.path ?? null,
  }
}

export async function initPrinter(): Promise<void> {
  const result = await connectPrinter(DEFAULT_PRINTER_PORT)
  if (!result.ok) {
    console.error('❌ Printer init failed:', result.error)
  } else {
    console.log('✅ Printer ready:', result.path)
  }
}

// ─── Receipt layout (58mm = 32 chars wide) ──────────────────────────────────

function pad(left: string, right: string, width = 32): string {
  const spaces = Math.max(width - left.length - right.length, 1)
  return left + ' '.repeat(spaces) + right
}

function peso(amount: number): string {
  return `P${amount.toFixed(2)}`
}

function centerText(text: string, width = 32): string {
  const spaces = Math.max(Math.floor((width - text.length) / 2), 0)
  return ' '.repeat(spaces) + text
}

function buildReceipt(order: Order, branchName: string): string {
  const lines: string[] = []
  const now = new Date(order.created_at)
  const dateStr = now.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
  const timeStr = now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })

  // ── Header ──
  lines.push(CMD.INIT)
  lines.push(CMD.ALIGN_CENTER)
  lines.push(CMD.BOLD_ON)
  lines.push(CMD.DOUBLE_HEIGHT_ON)
  lines.push('TAPSILOGAN\n')
  lines.push(CMD.DOUBLE_HEIGHT_OFF)
  lines.push(CMD.BOLD_OFF)
  lines.push(`${branchName}\n`)
  lines.push('\n')

  // ── Order info ──
  lines.push(CMD.ALIGN_LEFT)
  lines.push(CMD.LINE)
  lines.push(`Order #: ${String(order.order_number).padStart(3, '0')}\n`)
  lines.push(`Date   : ${dateStr}\n`)
  lines.push(`Time   : ${timeStr}\n`)
  lines.push(CMD.LINE)

  // ── Column headers ──
  lines.push(CMD.BOLD_ON)
  lines.push(pad('ITEM', 'AMOUNT'))
  lines.push('\n')
  lines.push(CMD.BOLD_OFF)
  lines.push(CMD.DASHED)

  // ── Items ──
  for (const item of order.order_items ?? []) {
    // Item name on first line
    lines.push(`${item.item_name}\n`)
    // Qty x price = subtotal on second line, indented
    const qtyPrice = `  ${item.quantity} x ${peso(item.unit_price)}`
    lines.push(pad(qtyPrice, peso(item.subtotal)) + '\n')
  }

  // ── Total ──
  lines.push(CMD.DASHED)
  lines.push(CMD.BOLD_ON)
  lines.push(pad('TOTAL', peso(order.total_amount)) + '\n')
  lines.push(CMD.BOLD_OFF)
  lines.push(CMD.LINE)

  // ── Payment ──
  lines.push(`Payment: Cash\n`)
  lines.push(CMD.LINE)

  // ── Footer ──
  lines.push(CMD.ALIGN_CENTER)
  lines.push('\n')
  lines.push('Salamat po!\n')
  lines.push('Balik kayo :)\n')
  lines.push('\n')

  // ── Feed + cut ──
  lines.push(CMD.FEED(5))
  lines.push(CMD.CUT)

  return lines.join('')
}

export async function printReceipt(
  order: Order,
  branchName: string,
): Promise<{ ok: boolean; error?: string }> {
  // Auto-reconnect if disconnected
  if (!currentPort?.isOpen) {
    const reconnect = await connectPrinter(DEFAULT_PRINTER_PORT)
    if (!reconnect.ok) {
      return { ok: false, error: 'Printer not connected. Make sure PT-210 is paired via Bluetooth.' }
    }
  }

  try {
    const receipt = buildReceipt(order, branchName)
    const encoder = new TextEncoder()
    const bytes = Buffer.from(encoder.encode(receipt))

    await new Promise<void>((resolve, reject) => {
      currentPort!.write(bytes, (err) => {
        if (err) reject(err)
        else currentPort!.drain(() => resolve())
      })
    })

    console.log(`✅ Receipt printed — Order #${order.order_number}`)
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Print failed'
    console.error('❌ Print error:', message)
    return { ok: false, error: message }
  }
}