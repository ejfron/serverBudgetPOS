export type OrderStatus = 'pending' | 'ready' | 'completed'

export interface OrderItem {
  id: string
  order_id: string
  menu_item_id: string
  item_name: string
  quantity: number
  unit_price: number
  subtotal: number
}

export interface Order {
  id: string
  branch_id: string
  status: OrderStatus
  order_number: number
  created_by: string
  total_amount: number
  created_at: string
  ready_at: string | null
  completed_at: string | null
  order_items: OrderItem[]
}

export interface CartLine {
  menu_item_id: string
  name: string
  unit_price: number
  quantity: number
}