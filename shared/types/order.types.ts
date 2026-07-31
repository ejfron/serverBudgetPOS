export interface Order {
  id: string
  branch_id: string
  status: OrderStatus
  order_number: number
  created_by: string
  total_amount: number
  payment_method?: string
  order_type?: string
  notes_type?: string  
  created_at: string
  ready_at?: string
  completed_at?: string
  order_items: OrderItem[]
  cashier?: string
  branch_name?: string
}

export interface OrderItem {
  id: string
  order_id: string
  menu_item_id?: string
  item_name: string
  quantity: number
  unit_price: number
  subtotal: number
}

export type OrderStatus = 'pending' | 'ongoing' | 'ready' | 'completed' | 'voided'

export interface CartLine {
  menu_item_id: string
  name: string
  quantity: number
  unit_price: number
}