import { hasKitchen, isValidBusinessType } from '@shared/types/business.types'

export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return

  const publicPages = ['/login', '/signup', '/', '/pricing', '/features', '/about', '/setup', '/setup-network']
  if (publicPages.includes(to.path)) return

  const stored = localStorage.getItem('tapsilogan_user')
  const user = stored ? JSON.parse(stored) : null

  if (!user) return navigateTo('/login')


  if (!user.business_type || user.business_type === '') {
    if (to.path !== '/setup') return navigateTo('/setup')
    return
  }

  const businessType = isValidBusinessType(user.business_type) ? user.business_type : 'tapsilogan'

  const getFrontPath = () => `/${businessType}/front`
  const getKitchenPath = () => `/${businessType}/kitchen`

  if (user.role === 'admin') {
    if (to.path === '/setup' || to.path === '/setup-network') {
      return
    }
    if (to.path === '/admin' || !to.path.startsWith('/admin/')) {
      return navigateTo(`/admin/${businessType}`)
    }
    return
  }

  const branchHasKitchen = hasKitchen(user.business_type)

  if (user.role === 'kitchen' && !branchHasKitchen) {
    return navigateTo(getFrontPath())
  }

  if (to.path.startsWith('/front') && user.role !== 'front') {
    return navigateTo(branchHasKitchen ? getKitchenPath() : getFrontPath())
  }

  if (to.path.startsWith('/kitchen')) {
    if (user.role !== 'kitchen') return navigateTo(getFrontPath())
    if (!branchHasKitchen) return navigateTo(getFrontPath())
  }

  if (to.path.startsWith('/admin') || to.path === '/setup' || to.path === '/setup-network') {
    return navigateTo(user.role === 'front' ? getFrontPath() : getKitchenPath())
  }
  
  if (to.path === '/' || to.path === '') {
    if (user.role === 'admin') return navigateTo(`/admin/${businessType}`)
    if (user.role === 'kitchen' && branchHasKitchen) {
      return navigateTo(getKitchenPath())
    }
    return navigateTo(getFrontPath())
  }
})