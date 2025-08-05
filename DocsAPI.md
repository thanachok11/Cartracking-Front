# Car Tracking Backend API Documentation

## Overview
Car Tracking Backend API เป็น RESTful API ที่ใช้สำหรับจัดการระบบติดตามรถยนต์ รองรับการจัดการผู้ใช้งาน คนขับ รถยนต์ และคอนเทนเนอร์

## เทคโนโลยีที่ใช้
- **Node.js** with **TypeScript**
- **Express.js** framework
- **MongoDB** with **Mongoose**
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Cloudinary** for image upload

## การติดตั้งและรัน

### Prerequisites
- Node.js (version 16+)
- MongoDB
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <repository-url>

# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file with following variables:
PORT=5000
MONGODB_URI=<your-mongodb-connection-string>
JWT_SECRET=<your-jwt-secret>
```

### Running the application
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## Base URL
```
http://localhost:5000/api
```

## Authentication
API ใช้ JWT token สำหรับ authentication ในส่วนของ endpoints ที่ต้องการความปลอดภัย

### Headers สำหรับ Protected Routes
```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

---

## API Endpoints

### 🔐 Authentication Routes
Base path: `/api`

#### 1. User Registration
```http
POST /register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "message": "User registered successfully"
}
```

#### 2. User Login
```http
POST /login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful as admin",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role": "admin"
}
```

#### 3. Get All Users
```http
GET /users
```

**Response:**
```json
{
  "users": [
    {
      "_id": "user_id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "admin",
      "profile_img": "image_url"
    }
  ]
}
```

---

### 🚛 Vehicle Routes
Base path: `/api`

#### 1. Get Vehicles with Positions
```http
GET /vehicles
```

**Description:** ดึงข้อมูลรถทั้งหมดพร้อมตำแหน่งปัจจุบัน (ใช้ Cartrack API)

**Response:**
```json
[
  {
    "vehicle_id": "12345",
    "name": "รถหมายเลข 1",
    "position": {
      "lat": 13.7563,
      "lng": 100.5018
    },
    "status": "online"
  }
]
```

#### 2. Get Vehicle List
```http
GET /car
```

**Description:** ดึงรายชื่อรถทั้งหมด

#### 3. Get Vehicle Timeline Events
```http
GET /vehicle/:vehicle_id/view
```

**Parameters:**
- `vehicle_id` - ID ของรถที่ต้องการดูข้อมูล

**Description:** ดึงข้อมูลเหตุการณ์ตามเวลาของรถคันใดคันหนึ่ง

#### 4. Reverse Geocoding
```http
GET /reverse-geocode
```

**Query Parameters:**
- `lat` - ละติจูด
- `lng` - ลองติจูด

**Description:** แปลงพิกัด GPS เป็นที่อยู่

#### 5. Get Drivers from Vehicle API
```http
GET /drivers
```

**Description:** ดึงข้อมูลคนขับจาก Cartrack API

#### 6. Get Geofences
```http
GET /geofences
```

**Description:** ดึงข้อมูล Geofence areas

---

### 👨‍💼 Driver Management Routes
Base path: `/api`

#### 1. Create Driver
```http
POST /drivers
```
🔒 **Requires Authentication**

**Request Body:**
```json
{
  "firstName": "สมชาย",
  "lastName": "ใจดี",
  "phoneNumber": "081-234-5678",
  "position": "พนักงานขับรถ",
  "company": "บริษัท ขนส่ง จำกัด",
  "detail": "คนขับมีประสบการณ์ 5 ปี",
  "profile_img": "image_url"
}
```

**Response:**
```json
{
  "message": "Driver created successfully",
  "data": {
    "_id": "driver_id",
    "firstName": "สมชาย",
    "lastName": "ใจดี",
    "phoneNumber": "081-234-5678",
    "position": "พนักงานขับรถ",
    "company": "บริษัท ขนส่ง จำกัด",
    "createdBy": "user_id"
  }
}
```

#### 2. Get All Drivers
```http
GET /vehicles/drivers
```

**Response:**
```json
[
  {
    "_id": "driver_id",
    "firstName": "สมชาย",
    "lastName": "ใจดี",
    "phoneNumber": "081-234-5678",
    "position": "พนักงานขับรถ",
    "company": "บริษัท ขนส่ง จำกัด"
  }
]
```

#### 3. Get Driver by ID
```http
GET /vehicles/drivers/:id
```
🔒 **Requires Authentication**

**Parameters:**
- `id` - Driver ID

#### 4. Update Driver
```http
PATCH /vehicles/drivers/:id
```
🔒 **Requires Authentication**

**Parameters:**
- `id` - Driver ID

**Request Body:**
```json
{
  "firstName": "สมชาย",
  "lastName": "ใจดีมาก",
  "phoneNumber": "081-234-5678"
}
```

#### 5. Delete Driver
```http
DELETE /vehicles/drivers/:id
```
🔒 **Requires Authentication**

**Parameters:**
- `id` - Driver ID

---

### 📦 Container Routes
Base path: `/api`

> **หมายเหตุ:** Container routes ใช้ path `/containers` แต่จริงๆ แล้วจัดการ Container data

#### 1. Create Container
```http
POST /containers
```
🔒 **Requires Authentication**

#### 2. Get All Containers
```http
GET /containers
```

#### 3. Get Container by ID
```http
GET /containers/:id
```
🔒 **Requires Authentication**

#### 4. Update Container
```http
PATCH /containers/:id
```
🔒 **Requires Authentication**

#### 5. Delete Container
```http
DELETE /containers/:id
```
🔒 **Requires Authentication**

---

## Error Responses

### Standard Error Format
```json
{
  "message": "Error description",
  "error": "Detailed error information"
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created successfully
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

---

## Models

### User Model
```typescript
{
  email: string;
  password: string; // hashed
  firstName: string;
  lastName: string;
  role: 'admin' | 'user';
  profile_img: string;
}
```

### Driver Model
```typescript
{
  firstName: string;
  lastName: string;
  phoneNumber: string;
  position: string;
  company: string;
  detail?: string;
  profile_img?: string;
  createdBy: ObjectId; // reference to User
}
```

---

## Environment Variables

สร้างไฟล์ `.env` ในโฟลเดอร์ backend และเพิ่มตัวแปรต่อไปนี้:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/cartracking
JWT_SECRET=your-super-secret-jwt-key
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret
```

---

## การใช้งาน Postman

1. สร้าง Collection ใหม่ชื่อ "Car Tracking API"
2. เพิ่ม Environment variable:
   - `base_url`: `http://localhost:5000/api`
   - `token`: `<jwt-token-after-login>`
3. ใน Headers ของ protected routes เพิ่ม:
   - `Authorization`: `Bearer {{token}}`

---

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## License

This project is licensed under the MIT License.

---

## Contact

สำหรับข้อสงสัยหรือปัญหา กรุณาติดต่อทีมพัฒนา
