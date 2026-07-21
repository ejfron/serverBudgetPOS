// composables/usePrinter.ts

// Singleton state shared across all components
const connected = ref(false)
const lastError = ref<string | null>(null)
const connectedDevice = ref<{ id: string; name: string } | null>(null)
const scanning = ref(false)
const pairedDevices = ref<any[]>([])
const errorMsg = ref('')
const successMsg = ref('')

// Paper width in characters — 32 for 58mm, 42 for 80mm printers.
const paperChars = ref<32 | 42>(32)

let initialized = false

export function usePrinter() {

  function isNative(): boolean {
    try {
      return import.meta.client && !!(window as any).Capacitor?.isNativePlatform?.()
    } catch {
      return false
    }
  }

  function isElectron(): boolean {
    try {
      return import.meta.client && !!(window as any).electronAPI?.isElectron
    } catch {
      return false
    }
  }

  // ✅ Safe initialization — NO auto-reconnect on app start
  if (!initialized && import.meta.client) {
    initialized = true
    try {
      // ✅ Don't auto-reconnect — prevents crash on app startup
      // const saved = localStorage.getItem('tapsilogan_printer')
      // if (saved && isNative()) autoReconnect(JSON.parse(saved))

      const savedWidth = localStorage.getItem('tapsilogan_printer_width')
      if (savedWidth === '32' || savedWidth === '42') paperChars.value = Number(savedWidth) as 32 | 42
    } catch {}
  }

  function setPaperWidth(chars: 32 | 42) {
    paperChars.value = chars
    localStorage.setItem('tapsilogan_printer_width', String(chars))
  }

  async function autoReconnect(device: { id: string; name: string }) {
    try {
      await connectToDevice(device)
      console.log('✅ Auto-reconnected to', device.name)
    } catch {
      connected.value = false
      console.warn('Auto-reconnect failed — connect manually')
    }
  }

  async function scanDevices() {
    scanning.value = true
    pairedDevices.value = []
    errorMsg.value = ''
    successMsg.value = ''

    if (!isNative()) {
      scanning.value = false
      errorMsg.value = 'Bluetooth printing only works in the Android app.'
      return
    }

    try {
      const { BluetoothSerial } = await import('@awesome-cordova-plugins/bluetooth-serial')

      let enabled = false
      try { enabled = await BluetoothSerial.isEnabled() } catch {}

      if (!enabled) {
        try {
          await BluetoothSerial.enable()
          await new Promise(r => setTimeout(r, 1500))
        } catch {
          errorMsg.value = 'Please enable Bluetooth in phone settings, then tap Refresh.'
          scanning.value = false
          return
        }
      }

      const devices = await BluetoothSerial.list()
      pairedDevices.value = Array.isArray(devices) ? devices : []

      if (pairedDevices.value.length === 0) {
        errorMsg.value = 'No paired devices found. Go to phone Settings → Bluetooth → pair your printer first. PIN is usually 0000 or 1234.'
      }
    } catch (err: any) {
      errorMsg.value = err?.message ?? 'Failed to scan. Make sure Bluetooth is ON and location permission is granted.'
      console.error('Scan error:', err)
    } finally {
      scanning.value = false
    }
  }

  function connectToDevice(device: { id: string; name: string }): Promise<void> {
    return new Promise(async (resolve, reject) => {
      if (!isNative()) {
        reject(new Error('Not running on Android'))
        return
      }
      try {
        const { BluetoothSerial } = await import('@awesome-cordova-plugins/bluetooth-serial')

        try {
          const isCon = await BluetoothSerial.isConnected()
          if (isCon) await BluetoothSerial.disconnect()
        } catch {}

        let settled = false

        BluetoothSerial.connect(device.id).subscribe({
          next: () => {
            if (settled) return
            settled = true
            connected.value = true
            connectedDevice.value = device
            localStorage.setItem('tapsilogan_printer', JSON.stringify(device))
            successMsg.value = `Connected to ${device.name}`
            resolve()
          },
          error: (err: any) => {
            connected.value = false
            if (!settled) {
              settled = true
              reject(err)
            } else {
              lastError.value = 'Printer disconnected'
              console.warn('Printer dropped connection')
            }
          },
        })
      } catch (err) {
        reject(err)
      }
    })
  }

  async function selectDevice(device: { id: string; name: string }) {
    errorMsg.value = ''
    successMsg.value = ''
    try {
      await connectToDevice(device)
    } catch (err: any) {
      errorMsg.value = `Cannot connect to ${device.name}. Make sure it is ON, charged, and nearby.`
      throw err
    }
  }

  async function disconnectPrinter() {
    if (!isNative()) return
    try {
      const { BluetoothSerial } = await import('@awesome-cordova-plugins/bluetooth-serial')
      await BluetoothSerial.disconnect()
    } catch {}
    connected.value = false
    connectedDevice.value = null
    localStorage.removeItem('tapsilogan_printer')
  }

  // ✅ Safe connect — returns false on error instead of crashing
  async function connect(): Promise<boolean> {
    if (isElectron()) {
      try {
        const result = await (window as any).electronAPI.connectPrinter()
        connected.value = result.ok ?? false
        return connected.value
      } catch {
        connected.value = false
        return false
      }
    }
    return connected.value
  }

  // ─────────────────────────────────────────────────────────────
  // Build ESC/POS byte array — Customer Copy + Kitchen Copy
  // ─────────────────────────────────────────────────────────────
  function buildBytes(order: any, branchName: string): Uint8Array {
    const ESC = 0x1B
    const GS  = 0x1D
    const W = paperChars.value
    const b: number[] = []
    const t = (s: string) => { for (const c of s) b.push(c.charCodeAt(0)) }
    const ln = (s = '') => t(s + '\n')
    const cmd = (...n: number[]) => b.push(...n)
    const pad = (l: string, r: string, w = W) =>
      l + ' '.repeat(Math.max(w - l.length - r.length, 1)) + r
    const rule = (ch: string) => ln(ch.repeat(W))
    const p = (n: number) => `P${Number(n).toFixed(2)}`
    const now = new Date(order.created_at)
    const date = now.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
    const time = now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })
    const paymentLabel = order.payment_method === 'gcash' ? 'Payment: GCash' : 'Payment: Cash'

    // ═══════════ CUSTOMER COPY ═══════════
    cmd(ESC, 0x40)
    cmd(ESC, 0x61, 0x01)
    cmd(ESC, 0x45, 0x01, ESC, 0x21, 0x10)
    ln('TAPSILOGAN')
    cmd(ESC, 0x21, 0x00, ESC, 0x45, 0x00)
    ln(branchName)
    ln()
    cmd(ESC, 0x61, 0x00)
    rule('-')
    ln(`Order #: ${String(order.order_number).padStart(3, '0')}`)
    ln(`Date   : ${date}`)
    ln(`Time   : ${time}`)
    rule('-')
    cmd(ESC, 0x45, 0x01)
    ln(pad('ITEM', 'AMOUNT'))
    cmd(ESC, 0x45, 0x00)
    rule('-')

    for (const item of order.order_items ?? []) {
      ln(item.item_name)
      ln(pad(`  ${item.quantity} x ${p(item.unit_price)}`, p(item.subtotal)))
    }

    rule('-')
    cmd(ESC, 0x45, 0x01)
    ln(pad('TOTAL', p(order.total_amount)))
    cmd(ESC, 0x45, 0x00)
    rule('-')
    ln(paymentLabel)
    rule('-')
    cmd(ESC, 0x61, 0x01)
    ln()
    ln('Salamat po!')
    ln('Balik kayo :)')
    ln()
    ln('--- CUSTOMER COPY ---')
    ln()
    cmd(ESC, 0x64, 2)

    // ═══════════ KITCHEN COPY ═══════════
    cmd(ESC, 0x61, 0x01)
    cmd(ESC, 0x45, 0x01, ESC, 0x21, 0x10)
    ln('KITCHEN COPY')
    cmd(ESC, 0x21, 0x00, ESC, 0x45, 0x00)
    ln()
    cmd(ESC, 0x61, 0x00)
    rule('=')
    cmd(ESC, 0x45, 0x01)
    ln(`Order #${String(order.order_number).padStart(3, '0')}`)
    cmd(ESC, 0x45, 0x00)
    ln(`Time: ${time}`)
    rule('=')
    ln()

    for (const item of order.order_items ?? []) {
      cmd(ESC, 0x45, 0x01)
      ln(`${item.quantity}x  ${item.item_name}`)
      cmd(ESC, 0x45, 0x00)
    }

    ln()
    rule('-')
    cmd(ESC, 0x45, 0x01)
    ln(`TOTAL: ${p(order.total_amount)}`)
    cmd(ESC, 0x45, 0x00)
    ln(paymentLabel)
    rule('-')
    cmd(ESC, 0x61, 0x01)
    ln()
    ln('--- KITCHEN COPY ---')
    ln()
    cmd(ESC, 0x64, 3)
    cmd(GS, 0x56, 0x41, 0x03)

    return new Uint8Array(b)
  }

  function buildTestBytes(): Uint8Array {
    const ESC = 0x1B, GS = 0x1D
    const b: number[] = []
    const t = (s: string) => { for (const c of s) b.push(c.charCodeAt(0)) }
    const ln = (s = '') => t(s + '\n')
    const cmd = (...n: number[]) => b.push(...n)

    cmd(ESC, 0x40)
    cmd(ESC, 0x61, 0x01)
    cmd(ESC, 0x45, 0x01)
    ln('TEST PRINT')
    cmd(ESC, 0x45, 0x00)
    ln(connectedDevice.value?.name ?? 'Printer')
    ln(new Date().toLocaleString('en-PH'))
    ln('If you can read this,')
    ln('your printer is ready.')
    ln()
    cmd(ESC, 0x64, 3)
    cmd(GS, 0x56, 0x41, 0x03)
    return new Uint8Array(b)
  }

  async function writeBytes(bytes: Uint8Array) {
    const { BluetoothSerial } = await import('@awesome-cordova-plugins/bluetooth-serial')
    const CHUNK = 128
    for (let i = 0; i < bytes.length; i += CHUNK) {
      await BluetoothSerial.write(bytes.slice(i, i + CHUNK))
      await new Promise(r => setTimeout(r, 30))
    }
  }

  async function testPrint(): Promise<boolean> {
    if (!isNative() || !connected.value) {
      alert('Connect a printer first.')
      return false
    }
    try {
      await writeBytes(buildTestBytes())
      return true
    } catch (err: any) {
      lastError.value = err?.message ?? 'Test print failed'
      alert(`Test print failed: ${lastError.value}`)
      connected.value = false
      return false
    }
  }

  function printViaBrowser(order: any, branchName: string): boolean {
    if (!import.meta.client) return false
    try {
      const iframe = document.createElement('iframe')
      Object.assign(iframe.style, { position: 'fixed', width: '0', height: '0', border: 'none' })
      document.body.appendChild(iframe)
      const doc = iframe.contentWindow!.document
      const p = (n: number) => `₱${Number(n).toFixed(2)}`
      const now = new Date(order.created_at)
      const paymentLabel = order.payment_method === 'gcash' ? 'GCash' : 'Cash'
      doc.open()
      doc.write(`
        <html><head><style>
          @page{size:58mm auto;margin:2mm}
          body{width:54mm;font-family:'Courier New',monospace;font-size:11px;padding:0;margin:0}
          .c{text-align:center}.b{font-weight:bold}.big{font-size:15px}
          .row{display:flex;justify-content:space-between}
          .sub{padding-left:8px}
          .div{border-top:1px dashed #000;margin:4px 0}
          .div2{border-top:2px solid #000;margin:6px 0}
        </style></head><body>
        <div class="c b big">TAPSILOGAN</div>
        <div class="c">${branchName}</div>
        <div class="div"></div>
        <div>Order #: ${String(order.order_number).padStart(3, '0')}</div>
        <div>Date: ${now.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
        <div>Time: ${now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}</div>
        <div class="div"></div>
        <div class="row b"><span>ITEM</span><span>AMOUNT</span></div>
        <div class="div"></div>
        ${(order.order_items ?? []).map((i: any) => `
          <div>${i.item_name}</div>
          <div class="row sub"><span>${i.quantity} x ${p(i.unit_price)}</span><span>${p(i.subtotal)}</span></div>
        `).join('')}
        <div class="div"></div>
        <div class="row b"><span>TOTAL</span><span>${p(order.total_amount)}</span></div>
        <div class="div"></div>
        <div>Payment: ${paymentLabel}</div>
        <div class="div"></div>
        <div class="c">Salamat po!</div>
        <div class="c">Balik kayo :)</div>
        <div class="div"></div>
        <div class="c">--- CUSTOMER COPY ---</div>
        <div style="margin-top:16px"></div>
        <div class="div2"></div>
        <div class="c b big">KITCHEN COPY</div>
        <div class="div2"></div>
        <div class="b">Order #${String(order.order_number).padStart(3, '0')}</div>
        <div>Time: ${now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}</div>
        <div class="div2"></div>
        ${(order.order_items ?? []).map((i: any) => `
          <div class="b">${i.quantity}x  ${i.item_name}</div>
        `).join('')}
        <div class="div"></div>
        <div class="row b"><span>TOTAL</span><span>${p(order.total_amount)}</span></div>
        <div>Payment: ${paymentLabel}</div>
        <div class="div"></div>
        <div class="c">--- KITCHEN COPY ---</div>
        </body></html>
      `)
      doc.close()
      iframe.contentWindow!.focus()
      iframe.contentWindow!.print()
      setTimeout(() => document.body.removeChild(iframe), 1000)
      return true
    } catch (err) {
      console.error('Browser print failed:', err)
      return false
    }
  }

  async function printReceipt(order: any, branchName: string): Promise<boolean> {
    if (isElectron()) {
      try {
        const result = await (window as any).electronAPI.printReceipt(order, branchName)
        return result.ok ?? false
      } catch { return false }
    }

    if (isNative()) {
      if (!connected.value || !connectedDevice.value) {
        alert('No printer connected. Tap "Connect printer" in the header first.')
        return false
      }
      try {
        await writeBytes(buildBytes(order, branchName))
        console.log('✅ Receipt printed successfully')
        return true
      } catch (err: any) {
        lastError.value = err?.message ?? 'Print failed'
        alert(`Print failed: ${lastError.value}`)
        connected.value = false
        return false
      }
    }

    return printViaBrowser(order, branchName)
  }

  return {
    connected, lastError, connectedDevice,
    scanning, pairedDevices, errorMsg, successMsg,
    paperChars, setPaperWidth,
    isNative, isElectron,
    connect, scanDevices, selectDevice,
    disconnectPrinter, printReceipt, printViaBrowser, testPrint,
  }
}