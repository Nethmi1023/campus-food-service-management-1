import api from './axiosClient'
import type { Meal, MealResponse } from '../types/meal'

export const getMeals = (params?: {
  category?: string
  available?: boolean
  page?: number
  limit?: number
  search?: string
}) => {
  const queryParams = new URLSearchParams()
  if (params?.category) queryParams.append('category', params.category)
  if (params?.available !== undefined) queryParams.append('available', params.available.toString())
  if (params?.page) queryParams.append('page', params.page.toString())
  if (params?.limit) queryParams.append('limit', params.limit.toString())
  if (params?.search) queryParams.append('search', params.search)
  
  return api.get<MealResponse>(`/meals?${queryParams.toString()}`)
}

export const getMealById = (id: string) =>
  api.get<MealResponse>(`/meals/${id}`)

export const getAvailableMeals = () =>
  getMeals({ available: true })

export const getMealsByCategory = (category: string) =>
  getMeals({ category, available: true })