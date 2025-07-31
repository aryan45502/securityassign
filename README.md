# Security Assignment - MediConnect Healthcare Platform

## 🏥 Project Overview

A comprehensive healthcare platform with advanced security features, including Khalti payment integration, password management, session handling, and audit logging.

## 🚀 Features

### 🔐 Security Features
- **Password Management**: 
  - Password strength validation
  - Password history tracking (prevents reuse of last 5 passwords)
  - Secure password hashing with bcrypt
  - Password expiration (90 days)

- **Session Management**:
  - JWT-based authentication
  - Inactivity timeout (3 minutes)
  - Real-time session countdown
  - Automatic logout on inactivity

- **Audit Logging**:
  - Comprehensive security event tracking
  - Password change logging
  - Login attempt monitoring
  - Failed authentication tracking

### 💳 Payment Integration
- **Khalti Payment Gateway**:
  - Web Checkout flow
  - Secure payment verification
  - Real-time payment status
  - Callback handling

### 👥 User Management
- **Multi-Factor Authentication (MFA)**
- **User Registration & Login**
- **Profile Management**
- **Role-based Access Control**

## 🛠️ Technology Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Bcrypt** for password hashing
- **Axios** for API calls

### Frontend
- **React.js** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Shadcn UI** components
- **React Router** for navigation

## 📁 Project Structure

```
securityfinal/
├── frame-shop-backend/          # Backend API
│   ├── config/                  # Configuration files
│   ├── controllers/             # Route controllers
│   ├── middleware/              # Custom middleware
│   ├── models/                  # Database models
│   ├── routes/                  # API routes
│   ├── utils/                   # Utility functions
│   └── server.js               # Main server file
├── newframefront/              # Frontend application
│   └── frame-fusion-ecommerce-app/
│       ├── src/
│       │   ├── components/     # React components
│       │   ├── contexts/       # React contexts
│       │   ├── pages/          # Page components
│       │   ├── hooks/          # Custom hooks
│       │   └── utils/          # Utility functions
│       └── package.json
└── README.md                   # This file
```

## 🔧 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB
- Git

### Backend Setup
```bash
cd frame-shop-backend
npm install
npm start
```

### Frontend Setup
```bash
cd newframefront/frame-fusion-ecommerce-app
npm install
npm run dev
```

## 🔐 Security Implementation

### Password Security
- **Strength Validation**: Minimum 8 characters, uppercase, lowercase, numbers, symbols
- **History Tracking**: Prevents reuse of last 5 passwords
- **Secure Hashing**: Bcrypt with salt rounds
- **Expiration**: 90-day password lifecycle

### Session Security
- **JWT Tokens**: Secure token-based authentication
- **Timeout Management**: 3-minute inactivity timer
- **Real-time Updates**: Live countdown display
- **Automatic Logout**: Session termination on timeout

### Payment Security
- **Khalti Integration**: Official Web Checkout flow
- **Payment Verification**: Server-side verification
- **Secure Callbacks**: Protected callback handling
- **Transaction Logging**: Complete payment audit trail

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-otp` - OTP verification
- `GET /api/auth/profile` - Get user profile

### Password Management
- `PUT /api/orders/change-password` - Change password
- `GET /api/orders/password-history` - Get password history

### Payment
- `POST /api/payments/initiate-khalti/:orderId` - Initiate Khalti payment
- `GET /api/payments/khalti-callback` - Payment callback handler

## 🔒 Security Best Practices

1. **Environment Variables**: All sensitive data stored in `.env` files
2. **Input Validation**: Comprehensive request validation
3. **Rate Limiting**: Protection against brute force attacks
4. **Audit Logging**: Complete security event tracking
5. **Secure Headers**: CORS and security headers implemented
6. **Error Handling**: Secure error responses without information leakage

## 🚀 Deployment

### Environment Variables Required
```env
# Database
MONGODB_URI=your_mongodb_connection_string

# JWT
JWT_SECRET=your_jwt_secret_key

# Khalti Payment
KHALTI_SECRET_KEY=your_khalti_secret_key
KHALTI_PUBLIC_KEY=your_khalti_public_key

# Server
PORT=3001
NODE_ENV=production
```

## 📝 License

This project is part of a security assignment and is for educational purposes.

## 👨‍💻 Author

Aryan Ghimire - Security Assignment Implementation

---

**Note**: This project includes comprehensive security features and is ready for production deployment with proper environment configuration. 