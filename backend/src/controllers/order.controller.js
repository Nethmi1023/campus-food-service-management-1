const Order = require('../models/Order')
const Meal = require('../models/Meal')
const QRCode = require('qrcode')
const mongoose = require('mongoose')

// Create a new order
exports.createOrder = async (req, res) => {
  try {
    const { items, deliveryAddress, specialInstructions, paymentMethod } = req.body
    const userId = req.user.id

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one item is required'
      })
    }

    // Calculate total and validate items
    let totalAmount = 0
    const orderItems = []
    
    for (const item of items) {
      const meal = await Meal.findById(item.mealId)
      if (!meal) {
        return res.status(404).json({
          success: false,
          message: `Meal with ID ${item.mealId} not found`
        })
      }
      
      if (!meal.available) {
        return res.status(400).json({
          success: false,
          message: `Meal "${meal.name}" is not available`
        })
      }
      
      if (meal.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${meal.name}"`
        })
      }

      const itemTotal = meal.price * item.quantity
      totalAmount += itemTotal
      
      orderItems.push({
        mealId: meal._id,
        name: meal.name,
        quantity: item.quantity,
        price: meal.price,
        total: itemTotal
      })
    }

    // Create order
    const order = new Order({
      user: userId,
      items: orderItems,
      totalAmount,
      deliveryAddress,
      specialInstructions,
      paymentMethod,
      paymentStatus: 'pending',
      status: 'pending'
    })

    // Generate QR code data
    const qrData = {
      orderId: order._id,
      orderNumber: order.orderNumber,
      userId: userId,
      totalAmount,
      timestamp: new Date().toISOString()
    }

    // Generate QR code
    const qrCodeData = JSON.stringify(qrData)
    const qrCodeImage = await QRCode.toDataURL(qrCodeData)
    
    order.qrCode = qrCodeImage
    order.qrCodeData = qrCodeData

    await order.save()

    // Update meal stock
    for (const item of items) {
      await Meal.findByIdAndUpdate(item.mealId, {
        $inc: { stock: -item.quantity }
      })
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    })
  } catch (error) {
    console.error('Create order error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    })
  }
}

// Get all orders for a user
exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id
    const { status, page = 1, limit = 10 } = req.query
    
    const query = { user: userId }
    if (status) {
      query.status = status
    }
    
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('user', 'name email')
      .populate('items.mealId', 'name price')
    
    const total = await Order.countDocuments(query)
    
    res.json({
      success: true,
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    })
  }
}

// Get order by ID
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('items.mealId', 'name price')
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      })
    }

    // Check if user is authorized to view this order
    if (req.user.role !== 'admin' && order.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
      })
    }

    res.json({
      success: true,
      data: order
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: error.message
    })
  }
}

// Update order status (admin only)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body
    
    const order = await Order.findById(req.params.id)
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      })
    }

    // Check if status transition is valid
    const validTransitions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['preparing', 'cancelled'],
      preparing: ['ready', 'cancelled'],
      ready: ['delivered'],
      delivered: [],
      cancelled: []
    }

    if (!validTransitions[order.status]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from ${order.status} to ${status}`
      })
    }

    order.status = status
    order.updatedAt = Date.now()
    
    if (status === 'cancelled') {
      // Restore meal stock
      for (const item of order.items) {
        await Meal.findByIdAndUpdate(item.mealId, {
          $inc: { stock: item.quantity }
        })
      }
    }
    
    await order.save()

    res.json({
      success: true,
      message: 'Order status updated',
      data: order
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update order',
      error: error.message
    })
  }
}

// Cancel order
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      })
    }

    // Check if user is authorized
    if (req.user.role !== 'admin' && order.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this order'
      })
    }

    // Only allow cancellation for pending or confirmed orders
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel order in current status'
      })
    }

    order.status = 'cancelled'
    await order.save()

    // Restore meal stock
    for (const item of order.items) {
      await Meal.findByIdAndUpdate(item.mealId, {
        $inc: { stock: item.quantity }
      })
    }

    res.json({
      success: true,
      message: 'Order cancelled successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order',
      error: error.message
    })
  }
}

// Get order QR code
exports.getOrderQRCode = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      })
    }

    // Check if user is authorized
    if (req.user.role !== 'admin' && order.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this QR code'
      })
    }

    // Generate QR code if not exists
    if (!order.qrCode) {
      const qrData = {
        orderId: order._id,
        orderNumber: order.orderNumber,
        userId: order.user,
        totalAmount: order.totalAmount,
        timestamp: order.createdAt.toISOString()
      }
      
      const qrCodeData = JSON.stringify(qrData)
      const qrCodeImage = await QRCode.toDataURL(qrCodeData)
      
      order.qrCode = qrCodeImage
      order.qrCodeData = qrCodeData
      await order.save()
    }

    res.json({
      success: true,
      data: {
        qrCode: order.qrCode,
        orderNumber: order.orderNumber,
        orderId: order._id
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate QR code',
      error: error.message
    })
  }
}

// Get order statistics
exports.getOrderStats = async (req, res) => {
  try {
    const today = new Date()
    const startOfDay = new Date(today.setHours(0, 0, 0, 0))
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay())
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const startOfYear = new Date(today.getFullYear(), 0, 1)

    const [
      totalOrders,
      todayOrders,
      weeklyOrders,
      monthlyOrders,
      yearlyOrders,
      totalRevenue,
      todayRevenue,
      weeklyRevenue,
      monthlyRevenue,
      yearlyRevenue
    ] = await Promise.all([
      // Total orders
      Order.countDocuments(),
      // Today's orders
      Order.countDocuments({
        createdAt: { $gte: startOfDay }
      }),
      // This week's orders
      Order.countDocuments({
        createdAt: { $gte: startOfWeek }
      }),
      // This month's orders
      Order.countDocuments({
        createdAt: { $gte: startOfMonth }
      }),
      // This year's orders
      Order.countDocuments({
        createdAt: { $gte: startOfYear }
      }),
      // Total revenue
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      // Today's revenue
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfDay }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      // This week's revenue
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfWeek }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      // This month's revenue
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfMonth }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      // This year's revenue
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfYear }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ])
    ])

    res.json({
      success: true,
      data: {
        counts: {
          total: totalOrders,
          today: todayOrders,
          thisWeek: weeklyOrders,
          thisMonth: monthlyOrders,
          thisYear: yearlyOrders
        },
        revenue: {
          total: totalRevenue[0]?.total || 0,
          today: todayRevenue[0]?.total || 0,
          thisWeek: weeklyRevenue[0]?.total || 0,
          thisMonth: monthlyRevenue[0]?.total || 0,
          thisYear: yearlyRevenue[0]?.total || 0
        }
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    })
  }
}