import type { Ref } from 'vue'

export function useFrontOrder() {
  const cart = useState<any[]>('front-cart', () => [])
  const orderNumber = useState<number>('front-order-number', () => 1)
  const loading = useState<boolean>('front-order-loading', () => false)

  function addToCart(item: any) {
    const existing = cart.value.find((line) => line.menu_item_id === item.id)
    if (existing) {
      existing.quantity += 1
      return
    }

    cart.value.push({
      menu_item_id: item.id,
      name: item.name,
      unit_price: item.price,
      quantity: 1,
    })
  }

  function incrementCart(id: string) {
    const line = cart.value.find((item) => item.menu_item_id === id)
    if (line) line.quantity += 1
  }

  function decrementCart(id: string) {
    const index = cart.value.findIndex((item) => item.menu_item_id === id)
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
