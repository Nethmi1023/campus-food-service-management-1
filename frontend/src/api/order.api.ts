import api from './axiosClient'
import type { 
  CreateOrderRequest, 
  OrderResponse, 
  OrderStats,
  QRCodeResponse 
} from '../types/order'

export const createOrder = (data: CreateOrderRequest) =>
  api.post<OrderResponse>('/orders', data)

export const getUserOrders = (params?: {
  status?: string
  page?: number
  limit?: number
}) => {
  const queryParams = new URLSearchParams()
  if (params?.status) queryParams.append('status', params.status)
  if (params?.page) queryParams.append('page', params.page.toString())
  if (params?.limit) queryParams.append('limit', params.limit.toString())
  
  return api.get<OrderResponse>(`/orders/my-orders?${queryParams.toString()}`)
}

export const getOrderById = (id: string) =>
  api.get<OrderResponse>(`/orders/${id}`)

export const getOrderQRCode = (orderId: string) =>
  api.get<QRCodeResponse>(`/orders/${orderId}/qr-code`)

export const cancelOrder = (orderId: string) =>
  api.patch(`/orders/${orderId}/cancel`)

export const getOrderStats = () =>
  api.get<{ success: boolean; data: OrderStats }>('/orders/stats/overview')

export const updateOrderStatus = (orderId: string, status: string) =>
  api.patch(`/orders/${orderId}/status`, { status })

export const getOrderStatsAdmin = () =>
  api.get<{ success: boolean; data: OrderStats }>('/orders/stats/overview')