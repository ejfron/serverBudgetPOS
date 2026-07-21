import { useServerConfig } from './useServerConfig'

const businessName = ref('')
const loaded = ref(false)

export function useSettings() {
  const { serverUrl } = useServerConfig()

  async function loadSettings() {
    if (loaded.value) return
    try {
      const res = await $fetch<any>(`${serverUrl.value}/api/settings`)
      businessName.value = res?.business_name ?? 'My Business'
      loaded.value = true
    } catch (e) {
      console.error('loadSettings error:', e)
      businessName.value = 'My Business'
    }
  }

  return { businessName, loadSettings }
}