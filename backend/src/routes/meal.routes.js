const express = require('express')
const mealController = require('../controllers/meal.controller')
const { authenticate, authorizeRoles } = require('../middlewares/auth.middleware')

const router = express.Router()

// Public routes
router.get('/', mealController.getAllMeals)
router.get('/available', mealController.getAvailableMeals)
router.get('/category/:category', mealController.getMealsByCategory)
router.get('/:id', mealController.getMealById)

// Admin routes
router.post(
  '/',
  authenticate,
  authorizeRoles('admin'),
  mealController.createMeal
)

router.put(
  '/:id',
  authenticate,
  authorizeRoles('admin'),
  mealController.updateMeal
)

router.delete(
  '/:id',
  authenticate,
  authorizeRoles('admin'),
  mealController.deleteMeal
)

module.exports = router