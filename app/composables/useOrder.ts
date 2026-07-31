import type { Order, CartLine, OrderStatus } from '@shared/types/order.types'
import { useServerConfig } from './useServerConfig'

export function useOrder() {
  const { serverUrl } = useServerConfig()
  const { printReceipt } = usePrinter()
  const printing = ref(false)
  const lastPrintOk = ref<boolean | null>(null)

  function base(): string {
    return serverUrl.value
  }

  async function fetchOrders(branchId: string, status?: OrderStatus): Promise<Order[]> {
    try {
      const params = new URLSearchParams({ branch_id: branchId })
      if (status) params.append('status', status)
      const res = await $fetch<{ success: boolean; data: Order[] }>(
        `${base()}/api/orders?${params}`,
      )
      return res.data ?? []
    } catch (err) {
      console.error('fetchOrders error:', err)
      return []
    }
  }

async function placeOrder(
  branchId: string,
  createdBy: string,
  cart: CartLine[],
  branchName: string,
  paymentMethod = 'cash',
  orderType = 'dine-in',
  orderNote: string,
  businessType?: string,   
): Promise<Order | null> {
  try {
    const res = await $fetch<{ success: boolean; data: Order }>(
      `${base()}/api/orders`,
      {
        method: 'POST',
        body: {
          branch_id: branchId,
          created_by: createdBy,
          items: cart,
          payment_method: paymentMethod,
          order_type: orderType,
          notes_type: orderNote,
        },
      },
    )
    const order = res.data ?? null

    if (order) {
      const orderForPrint = { ...order, payment_method: paymentMethod }
      printing.value = true
      lastPrintOk.value = null
      try {
        lastPrintOk.value = await printReceipt(orderForPrint, branchName || 'Branch', businessType)
      } catch {
        lastPrintOk.value = false
      } finally {
        printing.value = false
      }
    }

    return order
  } catch (err) {
    console.error('placeOrder error:', err)
    return null
  }
}

  async function markReady(orderId: string): Promise<boolean> {
    try {
      await $fetch(`${base()}/api/orders/${orderId}`, {
        method: 'PATCH', // ✅ Changed from 'POST' to 'PATCH'
        body: { status: 'ready' },
      })
      return true
    } catch { return false }
  }

  async function markCompleted(orderId: string): Promise<boolean> {
    try {
      await $fetch(`${base()}/api/orders/${orderId}`, {
        method: 'PATCH', // 
        body: { status: 'completed' },
      })
      return true
    } catch { return false }
  }

  return {
    fetchOrders,
    placeOrder,
    markReady,
    markCompleted,
    printing,
    lastPrintOk,
  }
}

export function useLiveOrders(branchId: string, status?: OrderStatus, intervalMs = 4000) {
  const { fetchOrders } = useOrder()
  const orders = ref<Order[]>([])
  const isLoading = ref(false)
  const synced = ref(false)
  const lastError = ref<string | null>(null)

  let timer: ReturnType<typeof setInterval> | null = null

  async function refresh() {
    isLoading.value = true
    try {
      orders.value = await fetchOrders(branchId, status)
      synced.value = true
      lastError.value = null
    } catch (err: any) {
      synced.value = false
      lastError.value = err?.message ?? 'Failed to sync orders'
    } finally {
      isLoading.value = false
    }
  }

  function start() {
    if (timer) return
    refresh()
    timer = setInterval(refresh, intervalMs)
  }

  function stop() {
    if (timer) clearInterval(timer)
    timer = null
  }

  onMounted(start)
  onUnmounted(stop)

  if (import.meta.client) {
    const handleVisibility = () => {
      if (document.hidden) stop()
      else start()
    }
    document.addEventListener('visibilitychange', handleVisibility)
    onUnmounted(() => document.removeEventListener('visibilitychange', handleVisibility))
  }

  return { orders, isLoading, synced, lastError, refresh }
}