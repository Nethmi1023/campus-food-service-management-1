export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'
export type PaymentMethod = 'cash' | 'card' | 'paypal' | 'meal_plan'

export interface OrderItem {
  mealId: string
  name: string
  quantity: number
  price: number
  total: number
}

export interface Order {
  _id: string
  user: {
    _id: string
    name: string
    email: string
  }
  items: OrderItem[]
  totalAmount: number
  status: OrderStatus
  paymentStatus: PaymentStatus
  paymentMethod: PaymentMethod
  deliveryAddress?: string
  deliveryTime?: string
  specialInstructions?: string
  qrCode?: string
  qrCodeData?: string
  orderNumber: string
  createdAt: string
  updatedAt: string
  formattedDate?: string
  itemCount?: number
}

export interface CreateOrderRequest {
  items: Array<{
    mealId: string
    quantity: number
  }>
  deliveryAddress: string
  specialInstructions?: string
  paymentMethod: PaymentMethod
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus
  notes?: string
}

export interface OrderStats {
  counts: {
    total: number
    today: number
    thisWeek: number
    thisMonth: number
    thisYear: number
  }
  revenue: {
    total: number
    today: number
    thisWeek: number
    thisMonth: number
    thisYear: number
  }
}

export interface OrderResponse {
  success: boolean
  message?: string
  data: Order | Order[] | OrderStats
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface QRCodeResponse {
  success: boolean
  data: {
    qrCode: string
    orderNumber: string
    orderId: string
  }
}