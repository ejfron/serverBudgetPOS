import { Router } from 'express'
import db from '../db/connection.js'

const router = Router()

router.get('/stats', (req, res) => {
  const branchId = req.query.branch_id as string | undefined

  const row = branchId
    ? db.prepare(`
        SELECT
          COALESCE(SUM(total_amount), 0) as totalRevenue,
          COUNT(*) as orderCount
        FROM orders
        WHERE status = 'completed' AND branch_id = ?
      `).get(branchId) as any
    : db.prepare(`
        SELECT
          COALESCE(SUM(total_amount), 0) as totalRevenue,
          COUNT(*) as orderCount
        FROM orders
        WHERE status = 'completed'
      `).get() as any

  const orderCount = Number(row?.orderCount ?? 0)
  const totalRevenue = Number(row?.totalRevenue ?? 0)

  return res.json({
    totalRevenue,
    orderCount,
    averageOrder: orderCount > 0 ? totalRevenue / orderCount : 0,
  })
})

export default router
