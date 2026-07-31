import { useLocalDb } from './useLocalDb'
import { useServerConfig } from './useServerConfig'
import { useAuth } from './useAuth'

function isNativeApp(): boolean {
  try {
    return import.meta.client && !!(window as any).Capacitor?.isNativePlatform?.()
  } catch {
    return false
  }
}

const DEFAULT_CATEGORIES: Record<string, string[]> = {
  tapsilogan: ['Silog', 'Drinks', 'Extras'],
  restaurant: ['Rice', 'Ulam', 'Soup', 'Drinks', 'Extras'],
  karinderya: ['Rice', 'Ulam', 'Drinks', 'Extras'],
  sarisari: ['Dry Groceries', 'Condiments', 'Beverages', 'Snacks & Chichirya', 'Personal Care & Hygiene'],
  fastfood: ['Burgers', 'Fries', 'Drinks', 'Milktea', 'Tacos', 'Extras'],
}

export interface MenuItemSize {
  id: string
  name: string
  price: number
  wholesale_price: number | null
}

export function usePosData() {
  const { user } = useAuth()
  const { serverUrl } = useServerConfig()
  const local = useLocalDb()

  const isLocal = computed(() => isNativeApp())

  // ── Menu items ──────────────────────────────────────────────────────────

  async function getMenuItems() {
    if (isLocal.value) {
      const branchId = user.value?.branch_id
      const sql = branchId
        ? 'SELECT * FROM menu_items WHERE is_available = 1 AND branch_id = ? ORDER BY category, name'
        : 'SELECT * FROM menu_items WHERE is_available = 1 ORDER BY category, name'
      const items = branchId
        ? await local.query(sql, [branchId])
        : await local.query(sql)

      for (const item of items) {
        item.sizes = await local.query(
          'SELECT id, name, price, wholesale_price FROM menu_item_sizes WHERE menu_item_id = ? ORDER BY sort_order, name',
          [item.id],
        )
      }
      return items
    }

    const branchId = user.value?.branch_id
    if (!branchId) return []

    const res = await $fetch<any>(`${serverUrl.value}/api/menu-items`, {
      query: {
        branch_id: branchId,
        business_type: user.value?.business_type,
      },
    })
    return res.data ?? []
  }

  function getCategoriesLocal(businessType?: string) {
    const names = DEFAULT_CATEGORIES[businessType ?? ''] ?? DEFAULT_CATEGORIES.tapsilogan
    return names.map(name => ({ id: name.toLowerCase().replace(/[^a-z0-9]/g, '_'), name }))
  }

  // ── Menu items: ALL (including unavailable) — for kitchen availability manager ──
  async function getMenuItemsAll() {
    if (isLocal.value) {
      const branchId = user.value?.branch_id
      const sql = branchId
        ? 'SELECT * FROM menu_items WHERE branch_id = ? ORDER BY category, name'
        : 'SELECT * FROM menu_items ORDER BY category, name'
      const items = branchId
        ? await local.query(sql, [branchId])
        : await local.query(sql)
      return items.map((i: any) => ({ ...i, is_available: !!i.is_available }))
    }

    const branchId = user.value?.branch_id
    if (!branchId) return []

    const res = await $fetch<any>(`${serverUrl.value}/api/menu-items/all`, {
      query: { branch_id: branchId, business_type: user.value?.business_type },
    })
    return res.data ?? []
  }

  // ── Update a menu item's availability / stock status ──
  async function updateMenuItemAvailability(
    id: string,
    isAvailable: boolean,
    stockStatus: 'available' | 'low' | 'out_of_stock',
  ) {
    if (isLocal.value) {
      await local.run(
        'UPDATE menu_items SET is_available = ?, stock_status = ? WHERE id = ?',
        [isAvailable ? 1 : 0, stockStatus, id],
      )
      return { id, is_available: isAvailable, stock_status: stockStatus }
    }

    const res = await $fetch<any>(`${serverUrl.value}/api/menu-items/${id}/availability`, {
      method: 'PATCH',
      body: {
        is_available: isAvailable,
        stock_status: stockStatus,
      },
    })
    return res.data
  }

  async function saveMenuItemLocal(
    form: {
      id: string
      name: string
      category: string
      price: number
      wholesale_price: number | null
      sizes: Array<{ name: string; price: number; wholesale_price: number | null }>
    },
    imageDataUrl: string | null,
    isEditing: boolean,
  ) {
    const branchId = user.value?.branch_id ?? null
    let itemId = form.id

    if (isEditing && form.id) {
      const existing = await local.query('SELECT image_url FROM menu_items WHERE id = ?', [form.id])
      const finalImage = imageDataUrl ?? existing[0]?.image_url ?? null

      await local.run(
        `UPDATE menu_items SET name = ?, category = ?, price = ?, wholesale_price = ?, image_url = ? WHERE id = ?`,
        [form.name, form.category, form.price, form.wholesale_price, finalImage, form.id],
      )

      await local.run('DELETE FROM menu_item_sizes WHERE menu_item_id = ?', [form.id])
    } else {
      itemId = crypto.randomUUID()
      await local.run(
        `INSERT INTO menu_items (id, name, category, price, wholesale_price, image_url, branch_id, is_available, stock_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, 'available')`,
        [itemId, form.name, form.category, form.price, form.wholesale_price, imageDataUrl, branchId],
      )
    }

    for (let i = 0; i < form.sizes.length; i++) {
      const size = form.sizes[i]
      if (!size.name.trim()) continue
      await local.run(
        `INSERT INTO menu_item_sizes (id, menu_item_id, name, price, wholesale_price, sort_order)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [crypto.randomUUID(), itemId, size.name.trim(), size.price, size.wholesale_price, i],
      )
    }

    return { id: itemId, ...form, branch_id: branchId }
  }

  async function deleteMenuItemLocal(id: string) {
    await local.run('UPDATE menu_items SET is_available = 0 WHERE id = ?', [id])
  }

  // ── Orders ──────────────────────────────────────────────────────────────

  async function placeOrder(cart: any[], paymentMethod: string, orderType = 'dine-in', notesType = '') {
    const total = cart.reduce((s, i) => s + i.unit_price * i.quantity, 0)

    if (isLocal.value) {
      const branchId = user.value?.branch_id ?? null
      const orderId = crypto.randomUUID()
      const now = new Date().toISOString()

      const last = branchId
        ? await local.query('SELECT MAX(order_number) as n FROM orders WHERE branch_id = ?', [branchId])
        : await local.query('SELECT MAX(order_number) as n FROM orders')
      const orderNumber = (last[0]?.n ?? 0) + 1

      await local.run(
        `INSERT INTO orders (id, branch_id, order_number, status, total_amount, payment_method, order_type, notes_type, created_at)
         VALUES (?, ?, ?, 'completed', ?, ?, ?, ?, ?)`,
        [orderId, branchId, orderNumber, total, paymentMethod, orderType, notesType, now],
      )

      const orderItems: any[] = []
      for (const item of cart) {
        const itemId = crypto.randomUUID()
        const subtotal = item.unit_price * item.quantity
        await local.run(
          `INSERT INTO order_items (id, order_id, item_name, quantity, unit_price, subtotal, price_type, size_name)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [itemId, orderId, item.name, item.quantity, item.unit_price, subtotal, item.price_type ?? 'regular', item.size_name ?? null],
        )
        orderItems.push({
          id: itemId, item_name: item.name, quantity: item.quantity,
          unit_price: item.unit_price, subtotal,
          price_type: item.price_type ?? 'regular',
          size_name: item.size_name ?? null,
        })
      }

      return {
        id: orderId,
        branch_id: branchId,
        order_number: orderNumber,
        total_amount: total,
        payment_method: paymentMethod,
        order_type: orderType,
        notes_type: notesType,
        created_at: now,
        order_items: orderItems,
      }
    }

    const res = await $fetch<any>(`${serverUrl.value}/api/orders`, {
      method: 'POST',
      body: {
        branch_id: user.value?.branch_id,
        created_by: user.value?.id,
        items: cart,
        payment_method: paymentMethod,
        order_type: orderType,
        notes_type: notesType,
      },
    })
    return res.data
  }

  async function getNextOrderNumber(): Promise<number> {
    if (isLocal.value) {
      const branchId = user.value?.branch_id
      const rows = branchId
        ? await local.query('SELECT MAX(order_number) as n FROM orders WHERE branch_id = ?', [branchId])
        : await local.query('SELECT MAX(order_number) as n FROM orders')
      return (rows[0]?.n ?? 0) + 1
    }
    return 1
  }

  async function getOrdersLocal(filterStatus?: string) {
    const branchId = user.value?.branch_id

    let sql = 'SELECT * FROM orders WHERE 1=1'
    const params: any[] = []

    if (branchId) {
      sql += ' AND branch_id = ?'
      params.push(branchId)
    }
    if (filterStatus) {
      sql += ' AND status = ?'
      params.push(filterStatus)
    }
    sql += ' ORDER BY created_at DESC'

    const orders = await local.query(sql, params)

    const result = []
    for (const o of orders) {
      const items = await local.query(
        'SELECT id, item_name, quantity, unit_price, subtotal, price_type, size_name FROM order_items WHERE order_id = ?',
        [o.id],
      )
      result.push({ ...o, order_items: items, cashier: user.value?.full_name ?? user.value?.username })
    }
    return result
  }

  async function voidOrderLocal(orderId: string) {
    const branchId = user.value?.branch_id
    if (branchId) {
      await local.run(`UPDATE orders SET status = 'voided' WHERE id = ? AND branch_id = ?`, [orderId, branchId])
    } else {
      await local.run(`UPDATE orders SET status = 'voided' WHERE id = ?`, [orderId])
    }
  }

  async function deleteOrderLocal(orderId: string) {
    const branchId = user.value?.branch_id
    if (branchId) {
      const owned = await local.query('SELECT id FROM orders WHERE id = ? AND branch_id = ?', [orderId, branchId])
      if (!owned.length) return
    }
    await local.run('DELETE FROM order_items WHERE order_id = ?', [orderId])
    await local.run('DELETE FROM orders WHERE id = ?', [orderId])
  }

  async function editOrderLocal(
    orderId: string,
    items: Array<{ item_name: string; quantity: number; unit_price: number }>,
    paymentMethod: string,
  ) {
    const branchId = user.value?.branch_id
    if (branchId) {
      const owned = await local.query('SELECT id FROM orders WHERE id = ? AND branch_id = ?', [orderId, branchId])
      if (!owned.length) return
    }

    const total = items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0)

    await local.run(
      'UPDATE orders SET total_amount = ?, payment_method = ? WHERE id = ?',
      [total, paymentMethod, orderId],
    )

    await local.run('DELETE FROM order_items WHERE order_id = ?', [orderId])
    for (const item of items) {
      await local.run(
        'INSERT INTO order_items (id, order_id, item_name, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?)',
        [crypto.randomUUID(), orderId, item.item_name, item.quantity, item.unit_price, item.quantity * item.unit_price],
      )
    }
  }

  async function verifyAdminLocal(password: string): Promise<boolean> {
    const branchId = user.value?.branch_id
    if (!branchId) return false

    let adminBranchId: string | null = branchId

    const branchRows = await local.query('SELECT admin_branch_id FROM branches WHERE id = ?', [branchId])
    if (branchRows[0]?.admin_branch_id) {
      adminBranchId = branchRows[0].admin_branch_id
    }

    const adminRows = await local.query(
      `SELECT password_hash FROM users WHERE branch_id = ? AND role = 'admin' LIMIT 1`,
      [adminBranchId],
    )
    if (!adminRows[0]) return false

    const hashed = await local.hashPassword(password)
    return hashed === adminRows[0].password_hash
  }

  // ── Sales ───────────────────────────────────────────────────────────────

  async function getSalesStats() {
    if (isLocal.value) {
      const branchId = user.value?.branch_id
      const sql = branchId
        ? `SELECT COALESCE(SUM(total_amount),0) as totalRevenue, COUNT(*) as orderCount
           FROM orders WHERE status = 'completed' AND branch_id = ?`
        : `SELECT COALESCE(SUM(total_amount),0) as totalRevenue, COUNT(*) as orderCount
           FROM orders WHERE status = 'completed'`
      const rows = branchId ? await local.query(sql, [branchId]) : await local.query(sql)
      const r = rows[0] ?? { totalRevenue: 0, orderCount: 0 }
      return { totalRevenue: r.totalRevenue, orderCount: r.orderCount, averageOrder: r.orderCount ? r.totalRevenue / r.orderCount : 0 }
    }
    return $fetch(`${serverUrl.value}/api/sales/stats?branch_id=${user.value?.branch_id}`)
  }

  // ── Setup / branches ────────────────────────────────────────────────────

  async function createBranchesLocal(
    branches: Array<{
      name: string
      location: string
      business_type: string
      hasKitchen: boolean
      cashierUsername: string
      cashierPassword: string
      kitchenUsername: string
      kitchenPassword: string
    }>,
    adminBranchId?: string,
  ) {
    const now = new Date().toISOString()

    for (const b of branches) {
      const branchId = crypto.randomUUID()

      await local.run(
        `INSERT INTO branches (id, name, location, business_type, admin_branch_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [branchId, b.name, b.location, b.business_type, adminBranchId ?? null, now],
      )

      const cashierHash = await local.hashPassword(b.cashierPassword)
      await local.run(
        `INSERT INTO users (id, username, password_hash, role, business_type, branch_id, branch_name, full_name, created_at)
         VALUES (?, ?, ?, 'front', ?, ?, ?, ?, ?)`,
        [crypto.randomUUID(), b.cashierUsername, cashierHash, b.business_type, branchId, b.name, b.cashierUsername, now],
      )

      if (b.hasKitchen && b.kitchenUsername && b.kitchenPassword) {
        const kitchenHash = await local.hashPassword(b.kitchenPassword)
        await local.run(
          `INSERT INTO users (id, username, password_hash, role, business_type, branch_id, branch_name, full_name, created_at)
           VALUES (?, ?, ?, 'kitchen', ?, ?, ?, ?, ?)`,
          [crypto.randomUUID(), b.kitchenUsername, kitchenHash, b.business_type, branchId, b.name, b.kitchenUsername, now],
        )
      }
    }
  }

  return {
    isLocal,
    getMenuItems, getMenuItemsAll, updateMenuItemAvailability,
    getCategoriesLocal, saveMenuItemLocal, deleteMenuItemLocal,
    placeOrder, getNextOrderNumber, getOrdersLocal, voidOrderLocal, deleteOrderLocal, editOrderLocal, verifyAdminLocal,
    getSalesStats,
    createBranchesLocal,
  }
}