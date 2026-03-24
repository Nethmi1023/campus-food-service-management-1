const mongoose = require('mongoose')

const orderItemSchema = new mongoose.Schema({
  mealId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meal',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  total: {
    type: Number,
    required: true,
    min: 0,
  },
})

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'],
    default: 'pending',
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'paypal', 'meal_plan'],
    default: 'cash',
  },
  deliveryAddress: {
    type: String,
    trim: true,
  },
  deliveryTime: {
    type: Date,
  },
  specialInstructions: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  qrCode: {
    type: String, // Base64 encoded QR code image
  },
  qrCodeData: {
    type: String, // The data encoded in the QR code
  },
  orderNumber: {
    type: String,
    unique: true,
  },
}, { timestamps: true })

// Generate order number before saving
orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const date = new Date()
    const year = date.getFullYear().toString().slice(-2)
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const random = Math.floor(1000 + Math.random() * 9000)
    this.orderNumber = `ORD${year}${month}${day}${random}`
  }
  
  // Generate QR code data if not present
  if (!this.qrCodeData) {
    this.qrCodeData = JSON.stringify({
      orderId: this._id,
      orderNumber: this.orderNumber,
      userId: this.user,
      totalAmount: this.totalAmount,
      timestamp: new Date().toISOString(),
    })
  }
  
  next()
})

// Virtual for formatted date
orderSchema.virtual('formattedDate').get(function () {
  return this.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
})

// Virtual for item count
orderSchema.virtual('itemCount').get(function () {
  return this.items.reduce((total, item) => total + item.quantity, 0)
})

// Method to update status
orderSchema.methods.updateStatus = function (newStatus) {
  const allowedTransitions = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['preparing', 'cancelled'],
    preparing: ['ready', 'cancelled'],
    ready: ['delivered'],
    delivered: [],
    cancelled: [],
  }

  if (!allowedTransitions[this.status].includes(newStatus)) {
    throw new Error(`Invalid status transition from ${this.status} to ${newStatus}`)
  }

  this.status = newStatus
  return this.save()
}

// Method to update payment status
orderSchema.methods.updatePaymentStatus = function (newPaymentStatus) {
  this.paymentStatus = newPaymentStatus
  return this.save()
}

module.exports = mongoose.model('Order', orderSchema)