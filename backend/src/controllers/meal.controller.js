const Meal = require('../models/Meal')

// Get all meals
exports.getAllMeals = async (req, res) => {
  try {
    const { category, available, search, page = 1, limit = 10 } = req.query
    
    const query = {}
    
    if (category) {
      query.category = category
    }
    
    if (available !== undefined) {
      query.available = available === 'true'
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }
    
    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum
    
    const meals = await Meal.find(query)
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 })
    
    const total = await Meal.countDocuments(query)
    
    res.json({
      success: true,
      data: meals,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meals',
      error: error.message
    })
  }
}

// Get meal by ID
exports.getMealById = async (req, res) => {
  try {
    const meal = await Meal.findById(req.params.id)
    
    if (!meal) {
      return res.status(404).json({
        success: false,
        message: 'Meal not found'
      })
    }
    
    res.json({
      success: true,
      data: meal
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meal',
      error: error.message
    })
  }
}

// Create new meal (admin only)
exports.createMeal = async (req, res) => {
  try {
    const meal = await Meal.create(req.body)
    
    res.status(201).json({
      success: true,
      message: 'Meal created successfully',
      data: meal
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create meal',
      error: error.message
    })
  }
}

// Update meal (admin only)
exports.updateMeal = async (req, res) => {
  try {
    const meal = await Meal.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    
    if (!meal) {
      return res.status(404).json({
        success: false,
        message: 'Meal not found'
      })
    }
    
    res.json({
      success: true,
      message: 'Meal updated successfully',
      data: meal
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update meal',
      error: error.message
    })
  }
}

// Delete meal (admin only)
exports.deleteMeal = async (req, res) => {
  try {
    const meal = await Meal.findByIdAndDelete(req.params.id)
    
    if (!meal) {
      return res.status(404).json({
        success: false,
        message: 'Meal not found'
      })
    }
    
    res.json({
      success: true,
      message: 'Meal deleted successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete meal',
      error: error.message
    })
  }
}

// Get available meals (in stock and available)
exports.getAvailableMeals = async (req, res) => {
  try {
    const meals = await Meal.find({ 
      available: true,
      stock: { $gt: 0 }
    }).sort({ name: 1 })
    
    res.json({
      success: true,
      data: meals
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available meals',
      error: error.message
    })
  }
}

// Get meals by category
exports.getMealsByCategory = async (req, res) => {
  try {
    const { category } = req.params
    const meals = await Meal.find({ 
      category,
      available: true,
      stock: { $gt: 0 }
    })
    
    res.json({
      success: true,
      data: meals
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meals by category',
      error: error.message
    })
  }
}