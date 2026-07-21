import type { BusinessType } from '@shared/types/business.types'

export interface BusinessTheme {
  label: string
  icon: string
  emoji: string
  badgeBg: string
  badgeText: string
  solidBg: string
  solidBgHover: string
  ring: string
}

export const BUSINESS_THEMES: Record<BusinessType, BusinessTheme> = {
  tapsilogan: {
    label: 'Tapsilogan',
    icon: 'Utensils',
    emoji: '🍳',
    badgeBg: 'bg-orange-50',
    badgeText: 'text-orange-600',
    solidBg: 'bg-orange-500',
    solidBgHover: 'hover:bg-orange-600',
    ring: 'ring-orange-300',
  },
  restaurant: {
    label: 'Restaurant',
    icon: 'ChefHat',
    emoji: '🍽️',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-600',
    solidBg: 'bg-rose-500',
    solidBgHover: 'hover:bg-rose-600',
    ring: 'ring-rose-300',
  },
  karinderya: {
    label: 'Karinderya',
    icon: 'CookingPot',
    emoji: '🍲',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-600',
    solidBg: 'bg-amber-500',
    solidBgHover: 'hover:bg-amber-600',
    ring: 'ring-amber-300',
  },
  sarisari: {
    label: 'Sari-Sari Store',
    icon: 'ShoppingBasket',
    emoji: '🏪',
    badgeBg: 'bg-green-50',
    badgeText: 'text-green-600',
    solidBg: 'bg-green-500',
    solidBgHover: 'hover:bg-green-600',
    ring: 'ring-green-300',
  },
}

export function themeFor(type: BusinessType | undefined | null): BusinessTheme {
  return BUSINESS_THEMES[type as BusinessType] ?? BUSINESS_THEMES.tapsilogan
}