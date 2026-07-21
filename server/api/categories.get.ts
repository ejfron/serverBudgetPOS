// @ts-nocheck
import db from '../db/connection'
export default defineEventHandler((event) => {
  const query = getQuery(event)
  const business_type = query.business_type as string
  let sql = 'SELECT * FROM categories'
  const params: any[] = []
  if (business_type && business_type !== 'undefined') { sql += ' WHERE business_type = ?'; params.push(business_type) }
  sql += ' ORDER BY name'
  return db.prepare(sql).all(...params)
})
