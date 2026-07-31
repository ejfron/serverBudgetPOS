import { runMigrations } from '../db/migrations'

export default defineNitroPlugin(async () => {
  if (import.meta.prerender) return
  await runMigrations()
})