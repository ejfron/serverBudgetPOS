export type MenuCategory = 'silog' | 'drinks' | 'extras'

export interface MenuItem {
  id: string
  name: string
  category: MenuCategory
  price: number
  is_available: boolean
}