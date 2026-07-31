import type { Ref } from 'vue'

export function useFrontOrder() {
  const cart = useState<any[]>('front-cart', () => [])
  const orderNumber = useState<number>('front-order-number', () => 1)
  const loading = useState<boolean>('front-order-loading', () => false)

  function addToCart(item: any) {
    const unitPrice = item.selling_price ?? item.price
    const priceType = item.price_type ?? 'regular'
    const qty = item.quantity ?? 1
    const sizeName = item.size_name ?? null
    
    const lineKey = `${item.id}_${sizeName ?? ''}_${priceType}_${item.price_type === 'custom' ? unitPrice : ''}`

    const existing = cart.value.find((line) => line.line_key === lineKey)
    if (existing) {
      existing.quantity += qty
      return
    }

    cart.value.push({
      line_key: lineKey,
      menu_item_id: item.id,
      name: item.name,
      unit_price: unitPrice,
      regular_price: item.price,
      price_type: priceType,
      size_name: sizeName,
      quantity: qty,
      image_url: item.image_url ?? null,
    })
  }

  function incrementCart(lineKey: string) {
    const line = cart.value.find((item) => item.line_key === lineKey)
    if (line) line.quantity += 1
  }

  function decrementCart(lineKey: string) {
    const index = cart.value.findIndex((item) => item.line_key === lineKey)
    if (index === -1) return
    if (cart.value[index].quantity > 1) {
      cart.value[index].quantity -= 1
    } else {
      cart.value.splice(index, 1)
    }
  }

  function clearCart() {
    cart.value = []
  }

  function resetOrderNumber() {
    orderNumber.value = 1
  }

  return {
    cart,
    orderNumber,
    loading,
    addToCart,
    incrementCart,
    decrementCart,
    clearCart,
    resetOrderNumber,
  }
}