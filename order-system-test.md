# Order Booking System Test Plan

## Backend Setup
1. Install dependencies:
```bash
cd backend
npm install
```

2. Create .env file:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/campus_food
JWT_ACCESS_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
CLIENT_URL=http://localhost:5173
```

3. Start backend:
```bash
npm run dev
```

## Frontend Setup
1. Install dependencies:
```bash
cd frontend
npm install
```

2. Start frontend:
```bash
npm run dev
```

## API Endpoints Test

### 1. Create Test Meal (Admin)
```bash
POST /api/meals
Content-Type: application/json

{
  "name": "Chicken Burger",
  "description": "Delicious chicken burger with fries",
  "category": "lunch",
  "price": 8.99,
  "stock": 50,
  "available": true
}
```

### 2. Get Available Meals
```bash
GET /api/meals/available
```

### 3. Create Order
```bash
POST /api/orders
Content-Type: application/json

{
  "items": [
    {
      "mealId": "meal_id_here",
      "quantity": 2
    }
  ],
  "deliveryAddress": "123 Campus Street",
  "paymentMethod": "cash"
}
```

### 4. Get User Orders
```bash
GET /api/orders/my-orders
```

### 5. Get Order QR Code
```bash
GET /api/orders/{orderId}/qr-code
```

## Test Flow

1. **Register/Login** - Get JWT token
2. **Browse Meals** - View available meals
3. **Create Order** - Select meals and create order
4. **View Orders** - Check order status
5. **Get QR Code** - View/print QR code
6. **Cancel Order** (if needed)

## Sample Test Data

### Meals to Create:
1. Chicken Burger - $8.99
2. Veggie Pizza - $12.99  
3. Caesar Salad - $9.99
4. Fruit Smoothie - $4.99
5. Chocolate Cake - $6.99

### Test Order:
```json
{
  "items": [
    {
      "mealId": "chicken_burger_id",
      "quantity": 2
    },
    {
      "mealId": "fruit_smoothie_id", 
      "quantity": 1
    }
  ],
  "deliveryAddress": "123 Campus Ave, Room 456",
  "specialInstructions": "No onions, please",
  "paymentMethod": "cash"
}
```

## Expected Flow

1. User logs in
2. Browses available meals
3. Selects meals and quantities
4. Enters delivery address
5. Places order
6. Receives order confirmation with QR code
7. Can view order status and QR code anytime
8. Can cancel order if still pending

## QR Code Usage

The QR code contains:
- Order ID and number
- User information
- Order total
- Timestamp
- Can be scanned to verify order details

## Testing Scenarios

### Happy Path:
1. User creates order successfully
2. QR code is generated
3. Order appears in order history
4. QR code can be scanned

### Edge Cases:
1. Insufficient stock
2. Invalid meal selection  
3. Payment method issues
4. Network failures
5. Duplicate orders

## Monitoring

Check these endpoints for system health:
- `GET /api/health` - System health
- `GET /api/meals/available` - Available meals
- `GET /api/orders/my-orders` - User's orders
- `GET /api/orders/stats` - Order statistics