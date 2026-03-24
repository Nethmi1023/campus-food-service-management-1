export type MealCategory = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'beverage'
export type Allergen = 'gluten' | 'dairy' | 'nuts' | 'soy' | 'eggs' | 'fish' | 'shellfish'

export interface NutritionalInfo {
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
}

export interface Meal {
  _id: string
  name: string
  description?: string
  category: MealCategory
  price: number
  image?: string
  available: boolean
  stock: number
  nutritionalInfo?: NutritionalInfo
  ingredients?: string[]
  allergens?: Allergen[]
  preparationTime?: number
  rating: number
  ratingCount: number
  averageRating?: string
  createdAt: string
  updatedAt: string
}

export interface MealResponse {
  success: boolean
  message?: string
  data: Meal | Meal[]
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
}