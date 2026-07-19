export type BusinessType = 'tapsilogan' | 'restaurant' | 'karinderya' | 'sarisari'

export const BUSINESS_TYPES: { value: BusinessType; label: string; hasKitchen: boolean }[] = [
  { value: 'tapsilogan', label: 'Tapsilogan', hasKitchen: true },
  { value: 'restaurant', label: 'Restaurant', hasKitchen: true },
  { value: 'karinderya', label: 'Karinderya', hasKitchen: false },
  { value: 'sarisari', label: 'Sari-Sari Store', hasKitchen: false },
]

export function hasKitchen(type: BusinessType | undefined | null): boolean {
  if (!type) return true // safe default for legacy branches
  return BUSINESS_TYPES.find(t => t.value === type)?.hasKitchen ?? true
}

export function businessLabel(type: BusinessType | undefined | null): string {
  return BUSINESS_TYPES.find(t => t.value === type)?.label ?? 'Business'
}

export function isValidBusinessType(type: string | undefined | null): type is BusinessType {
  return BUSINESS_TYPES.some(t => t.value === type)
}