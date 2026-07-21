// @ts-nocheck
import db from '../db/connection'
import { randomUUID } from 'node:crypto'
import { writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

export default defineEventHandler(async (event) => {
  // Read as FormData for image upload support
  const formData = await readFormData(event)
  
  const name = formData.get('name') as string
  const category = formData.get('category') as string
  const price = formData.get('price') as string
  const image = formData.get('image') as File | null

  if (!name || !price) {
    throw createError({ statusCode: 400, statusMessage: 'Name and price required' })
  }

  let imageUrl: string | null = null
  if (image && image.size > 0) {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadDir, { recursive: true })
    const ext = path.extname(image.name) || '.png'
    const filename = `${randomUUID()}${ext}`
    const buffer = Buffer.from(await image.arrayBuffer())
    await writeFile(path.join(uploadDir, filename), buffer)
    imageUrl = `/uploads/${filename}`
  }

  const id = randomUUID()
  db.prepare('INSERT INTO menu_items (id, name, category, price, image_url, is_available) VALUES (?, ?, ?, ?, ?, 1)')
    .run(id, name, category || 'silog', Number(price), imageUrl)

  return { 
    success: true, 
    data: { id, name, category: category || 'silog', price: Number(price), image_url: imageUrl } 
  }
})
