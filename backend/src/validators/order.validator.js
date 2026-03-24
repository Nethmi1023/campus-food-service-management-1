const { z } = require('zod')

const orderItemSchema = z.object({
  mealId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid meal ID format'),
  quantity: z.coerce.number().int().positive('Quantity must be positive'),
})

const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
  deliveryAddress: z.string().min(5, 'Delivery address is required').max(500),
  specialInstructions: z.string().max(500, 'Special instructions too long').optional(),
  paymentMethod: z.enum(['cash', 'card', 'paypal', 'meal_plan']).default('cash'),
})

const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled']),
  notes: z.string().max(500, 'Notes too long').optional(),
})

const updatePaymentStatusSchema = z.object({
  paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded']),
  paymentMethod: z.enum(['cash', 'card', 'paypal', 'meal_plan']).optional(),
  transactionId: z.string().optional(),
})

const validateOrder = (data) => {
  const result = createOrderSchema.safeParse(data)
  if (!result.success) {
    return { 
      success: false, 
      errors: result.error.errors,
      message: 'Validation failed'
    }
  }
  return { success: true, data: result.data }
}

const validateOrderStatusUpdate = (data) => {
  const result = updateOrderStatusSchema.safeParse(data)
  if (!result.success) {
    return { 
      success: false, 
      errors: result.error.errors,
      message: 'Validation failed'
    }
  }
  return { success: true, data: result.data }
}

const validatePaymentStatus = (data) => {
  const result = updatePaymentStatusSchema.safeParse(data)
  if (!result.success) {
    return { 
      success: false, 
      errors: result.error.errors,
      message: 'Validation failed'
    }
  }
  return { success: true, data: result.data }
}

module.exports = {
  createOrderSchema,
  updateOrderStatusSchema,
  updatePaymentStatusSchema,
  validateOrder,
  validateOrderStatusUpdate,
  validatePaymentStatus
}