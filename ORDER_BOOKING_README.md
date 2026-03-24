# Order Booking System with QR Code

## Overview
Complete order booking system for campus food service with QR code generation functionality.

## Features Implemented

### Backend Features
1. **Order Management**
   - Create, read, update, delete orders
   - Order status tracking (pending → confirmed → preparing → ready → delivered → cancelled)
   - Payment status management
   - Stock management integration

2. **QR Code Generation**
   - Automatic QR code generation for each order
   - QR code contains order details (ID, number, amount, timestamp)
   - Base64 encoded image storage
   - QR code retrieval endpoint

3. **Meal Management**
   - Meal catalog with categories
   - Price and stock management
   - Availability tracking
   - Nutritional information

4. **API Endpoints**
   - Complete REST API for orders and meals
   - Authentication and authorization
   - Pagination and filtering
   - Statistics and reporting

### Frontend Features
1. **Order Booking Interface**
   - Meal selection with quantity controls
   - Delivery address and special instructions
   - Payment method selection
   - Real-time validation

2. **Order History**
   - Table view with pagination
   - Status indicators with color coding
   - Order details view
   - Cancellation functionality

3. **QR Code Display**
   - QR code generation on order creation
   - QR code viewing dialog
   - Print functionality
   - Scan verification

4. **Dashboard**
   - Order statistics cards
   - Spending tracking
   - Monthly summaries

## File Structure

### Backend
```
backend/
├── src/
│   ├── models/
│   │   ├── Order.js          # Order schema with QR code
│   │   └── Meal.js           # Meal catalog
│   ├── controllers/
│   │   ├── order.controller.js
│   │   └── meal.controller.js
│   ├── routes/
│   │   ├── order.routes.js
│   │   └── meal.routes.js
│   ├── validators/
│   │   └── order.validator.js
│   └── middlewares/
└── server.js                 # Updated with order routes
```

### Frontend
```
frontend/
├── src/
│   ├── types/
│   │   ├── order.ts          # Order type definitions
│   │   └── meal.ts           # Meal type definitions
│   ├── api/
│   │   ├── order.api.ts      # Order API functions
│   │   └── meal.api.ts       # Meal API functions
│   └── pages/student/
│       └── OrdersPage.tsx    # Complete order booking page
```

## Installation & Setup

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 3. Environment Variables (backend/.env)
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/campus_food
JWT_ACCESS_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
CLIENT_URL=http://localhost:5173
```

## API Documentation

### Order Endpoints
- `POST /api/orders` - Create new order with QR code
- `GET /api/orders/my-orders` - Get user's orders
- `GET /api/orders/:id` - Get order details
- `GET /api/orders/:id/qr-code` - Get order QR code
- `PATCH /api/orders/:id/cancel` - Cancel order
- `GET /api/orders/stats/overview` - Get order statistics

### Meal Endpoints
- `GET /api/meals` - List all meals
- `GET /api/meals/available` - List available meals
- `GET /api/meals/category/:category` - List by category
- `GET /api/meals/:id` - Get meal details
- `POST /api/meals` - Create meal (admin)
- `PUT /api/meals/:id` - Update meal (admin)
- `DELETE /api/meals/:id` - Delete meal (admin)

## QR Code Implementation

### Data Structure
```json
{
  "orderId": "order_id",
  "orderNumber": "ORD2401011234",
  "userId": "user_id",
  "totalAmount": 25.98,
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### Generation Process
1. Order created → Generate QR data
2. Convert to Base64 image using `qrcode` package
3. Store in database
4. Return to frontend for display

### Usage
- Scan QR code to verify order details
- Print QR code for pickup verification
- Store QR code for order tracking

## Testing the System

### 1. Create Test Meals
```bash
curl -X POST http://localhost:5000/api/meals \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Meal",
    "category": "lunch",
    "price": 9.99,
    "stock": 100,
    "available": true
  }'
```

### 2. Create Order
```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "items": [{"mealId": "meal_id", "quantity": 2}],
    "deliveryAddress": "123 Campus St",
    "paymentMethod": "cash"
  }'
```

### 3. Get QR Code
```bash
curl -X GET http://localhost:5000/api/orders/order_id/qr-code \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Frontend Usage

1. **Login/Register** - Access the system
2. **Browse Meals** - View available meals
3. **Create Order** - Select meals, enter details, place order
4. **View Orders** - Check order history and status
5. **QR Code** - View/print QR code for order verification
6. **Cancel Order** - Cancel pending orders if needed

## Dependencies

### Backend
- `express` - Web framework
- `mongoose` - MongoDB ODM
- `qrcode` - QR code generation
- `jsonwebtoken` - Authentication
- `zod` - Validation

### Frontend
- `react` - UI library
- `@mui/material` - UI components
- `axios` - HTTP client
- `date-fns` - Date formatting

## Security Features

1. **Authentication** - JWT token based
2. **Authorization** - Role-based access control
3. **Input Validation** - Zod schema validation
4. **Stock Validation** - Prevent over-ordering
5. **Status Transition Validation** - Valid order state changes

## Performance Considerations

1. **Pagination** - Large order lists
2. **QR Code Caching** - Store generated QR codes
3. **Stock Updates** - Atomic operations
4. **Indexing** - Database indexes for queries

## Future Enhancements

1. **Real-time Updates** - WebSocket for order status
2. **Payment Integration** - PayPal, Stripe
3. **Email Notifications** - Order confirmations
4. **Mobile App** - React Native version
5. **Analytics Dashboard** - Advanced reporting
6. **Inventory Alerts** - Low stock notifications

## Troubleshooting

### Common Issues
1. **MongoDB Connection** - Check MONGO_URI in .env
2. **CORS Errors** - Verify CLIENT_URL matches frontend URL
3. **JWT Issues** - Check token expiration and secrets
4. **Stock Issues** - Verify meal availability and stock

### Logs
- Backend logs in console
- Check MongoDB connection status
- Verify API responses

## Support
For issues or questions, check the API documentation and test the endpoints using the provided test scripts.