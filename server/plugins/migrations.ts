import { runMigrations } from '../db/migrations'

export default defineNitroPlugin(() => {
  runMigrations()
})