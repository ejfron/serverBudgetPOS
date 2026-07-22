// composables/useOrder.ts
import type { Order, CartLine, OrderStatus } from '@shared/types/order.types'

export function useOrder() {
  const config = useRuntimeConfig()
  const base = config.public.serverUrl

  const { printReceipt, connected: printerConnected } = usePrinter()
  const printing = ref(false)
  const lastPrintOk = ref<boolean | null>(null)

  async function fetchOrders(branchId: string, status?: OrderStatus): Promise<Order[]> {
    try {
      const params = new URLSearchParams({ branch_id: branchId })
      if (status) params.append('status', status)
      const res = await $fetch<{ success: boolean; data: Order[] }>(
        `${base}/api/orders?${params}`,
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
    paymentMethod: string = 'cash', 
    orderType: string = 'dine-in',
  ): Promise<Order | null> {
    try {
      const res = await $fetch<{ success: boolean; data: Order }>(
        `${base}/api/orders`,
        {
          method: 'POST' as const,
          body: {
            branch_id: branchId,
            created_by: createdBy,
            items: cart,
            payment_method: paymentMethod,  
            order_type: orderType, 
          },
        },
      )
      const order = res.data ?? null

      if (order) {
        // ✅ Attach payment method to order object for printing
        const orderForPrint = { ...order, payment_method: paymentMethod }
        
        printing.value = true
        lastPrintOk.value = null
        try {
          const receiptBranchName = branchName || 'TAPSILOGAN'
          lastPrintOk.value = await printReceipt(orderForPrint, receiptBranchName)
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
      await $fetch(`${base}/api/orders/${orderId}`, {
        method: 'PATCH' as 'POST',
        body: { status: 'ready' },
      })
      return true
    } catch { return false }
  }

  async function markCompleted(orderId: string): Promise<boolean> {
    try {
      await $fetch(`${base}/api/orders/${orderId}`, {
        method: 'PATCH' as 'POST',
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
    printerConnected,
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