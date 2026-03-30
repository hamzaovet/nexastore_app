import { connectDB } from '@/lib/db'
import Product       from '@/models/Product'
import { notFound }  from 'next/navigation'
import ProductClient from './ProductClient'

export const revalidate = 60 // Cache for 60 seconds

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  await connectDB()
  
  const resolvedParams = await params
  const productId = resolvedParams.id

  if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
    notFound()
  }

  const product = await Product.findById(productId).lean()
  if (!product) {
    notFound()
  }

  // Serialize MongoDB `_id` and Dates for passing to Client Component
  const safeProduct = {
    ...product,
    _id: product._id.toString(),
    createdAt: product.createdAt?.toISOString(),
    updatedAt: product.updatedAt?.toISOString(),
  }

  return <ProductClient product={safeProduct} />
}
