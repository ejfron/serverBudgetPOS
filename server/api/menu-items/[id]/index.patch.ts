// @ts-nocheck
import db from '../../../db/connection'
import { randomUUID } from 'node:crypto'
import { writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const formData = await readFormData(event)
  
  const name = formData.get('name') as string
  const category = formData.get('category') as string
  const price = formData.get('price') as string
  const image = formData.get('image') as File | null

  let imageUrl: string | null = null
  if (image && image.size > 0) {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadDir, { recursive: true })
    const ext = path.extname(image.name) || '.png'
    const filename = `${randomUUID()}${ext}`
    const buffer = Buffer.from(await image.arrayBuffer())
    await writeFile(path.join(uploadDir, filename), buffer)
    imageUrl = `/uploads/${filename}`
    db.prepare('UPDATE menu_items SET name = ?, category = ?, price = ?, image_url = ? WHERE id = ?').run(name, category, Number(price), imageUrl, id)
  } else {
    db.prepare('UPDATE menu_items SET name = ?, category = ?, price = ? WHERE id = ?').run(name, category, Number(price), id)
  }

  return { success: true }
})
