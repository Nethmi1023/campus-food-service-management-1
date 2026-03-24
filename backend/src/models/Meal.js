const mongoose = require('mongoose')

const mealSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Meal name is required'],
    trim: true,
    maxlength: [100, 'Meal name too long'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description too long'],
  },
  category: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snack', 'beverage'],
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  image: {
    type: String, // URL or path to image
  },
  available: {
    type: Boolean,
    default: true,
  },
  stock: {
    type: Number,
    default: 0,
    min: 0,
  },
  nutritionalInfo: {
    calories: { type: Number, min: 0 },
    protein: { type: Number, min: 0 },
    carbs: { type: Number, min: 0 },
    fat: { type: Number, min: 0 },
  },
  ingredients: [{
    type: String,
    trim: true,
  }],
  allergens: [{
    type: String,
    enum: ['gluten', 'dairy', 'nuts', 'soy', 'eggs', 'fish', 'shellfish'],
  }],
  preparationTime: {
    type: Number, // in minutes
    min: 0,
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0,
  },
  ratingCount: {
    type: Number,
    default: 0,
    min: 0,
  },
}, { timestamps: true })

// Virtual for average rating
mealSchema.virtual('averageRating').get(function () {
  return this.ratingCount > 0 ? (this.rating / this.ratingCount).toFixed(1) : 0
})

// Method to update rating
mealSchema.methods.addRating = function (newRating) {
  if (newRating < 0 || newRating > 5) {
    throw new Error('Rating must be between 0 and 5')
  }
  
  this.rating += newRating
  this.ratingCount += 1
  return this.save()
}

// Method to check availability
mealSchema.methods.isAvailable = function (quantity = 1) {
  return this.available && this.stock >= quantity
}

// Method to reduce stock
mealSchema.methods.reduceStock = function (quantity = 1) {
  if (this.stock < quantity) {
    throw new Error('Insufficient stock')
  }
  this.stock -= quantity
  return this.save()
}

// Method to increase stock
mealSchema.methods.increaseStock = function (quantity = 1) {
  this.stock += quantity
  return this.save()
}

module.exports = mongoose.model('Meal', mealSchema)