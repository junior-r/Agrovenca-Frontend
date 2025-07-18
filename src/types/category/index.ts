import { User } from '../auth/user'

export interface Category {
  id: string
  name: string
  description?: string
  active: boolean
  user: User
  createdAt: string
  updatedAt: string
  _count: { products: number }
}

export interface CategoryResponse {
  category: Category
  message: string
}
