const express = require('express')
const orderController = require('../controllers/order.controller')
const { authenticate, authorizeRoles } = require('../middlewares/auth.middleware')
const { validate } = require('../middlewares/validate.middleware')
const { 
  createOrderSchema, 
  updateOrderStatusSchema 
} = require('../validators/order.validator')

const router = express.Router()

// All order routes require authentication
router.use(authenticate)

// User routes
router.post(
  '/',
  validate(createOrderSchema),
  orderController.createOrder
)

router.get(
  '/my-orders',
  orderController.getUserOrders
)

router.get(
  '/:id',
  orderController.getOrderById
)

router.get(
  '/:id/qr-code',
  orderController.getOrderQRCode
)

router.patch(
  '/:id/cancel',
  orderController.cancelOrder
)

// Admin routes
router.get(
  '/',
  authorizeRoles('admin'),
  orderController.getUserOrders // Admin can see all orders
)

router.patch(
  '/:id/status',
  authorizeRoles('admin'),
  validate(updateOrderStatusSchema),
  orderController.updateOrderStatus
)

router.get(
  '/stats/overview',
  authorizeRoles('admin'),
  orderController.getOrderStats
)

module.exports = router