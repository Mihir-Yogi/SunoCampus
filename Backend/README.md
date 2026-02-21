# SunoCampus - Backend Setup Guide

## Overview

This is the backend server for SunoCampus, a college social networking and event management platform built with Node.js, Express, and MongoDB.

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MongoDB Atlas account
- Gmail account (for email OTP service)

## Installation Steps

### 1. Install Dependencies

```bash
cd Backend
npm install
```

### 2. Environment Configuration

Create a `.env` file in the Backend directory with the following variables:

```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/SunoCampusDB?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Email Configuration (Gmail)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_from_gmail

# Frontend Configuration
FRONTEND_URL=http://localhost:5173

# Environment
NODE_ENV=development
PORT=5000
```

### 3. Gmail App Password Setup

1. Enable 2-Factor Authentication on your Gmail account
2. Visit: https://myaccount.google.com/apppasswords
3. Select "Mail" and "Windows Computer" (or relevant device)
4. Generate a password - copy this as your `EMAIL_PASS`

### 4. MongoDB Atlas Setup

1. Create a cluster on MongoDB Atlas
2. Create a database named `SunoCampusDB`
3. Add your IP to IP Whitelist
4. Get your connection string and update `MONGODB_URI`

### 5. Seed Initial Data

Run the colleges seed script to populate the database with college data:

```bash
node seeds/colleges.js
```

This will add 8 colleges to the database (GNDU, IIITB, DTU, BITS, IIT Delhi, NIT Rourkela, Miranda House, St. Stephens)

## Running the Server

### Development Mode (with auto-reload)

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication Routes

#### 1. Send OTP

```
POST /api/auth/send-otp
Content-Type: application/json

{
  "email": "student@college.edu"
}

Response:
{
  "success": true,
  "message": "OTP sent to email successfully",
  "email": "student@college.edu"
}
```

#### 2. Verify OTP

```
POST /api/auth/verify-otp
Content-Type: application/json

{
  "email": "student@college.edu",
  "otp": "123456"
}

Response:
{
  "success": true,
  "message": "OTP verified successfully",
  "email": "student@college.edu"
}
```

#### 3. Register Account

```
POST /api/auth/register
Content-Type: application/json

{
  "email": "student@college.edu",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!",
  "fullName": "John Doe",
  "phone": "+91 9999999999",
  "dateOfBirth": "2003-01-15",
  "gender": "male",
  "studentId": "2024CS001",
  "branch": "CSE",
  "graduationYear": 2028
}

Response:
{
  "success": true,
  "message": "Account created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "student@college.edu",
    "fullName": "John Doe",
    "role": "student"
  }
}
```

#### 4. Login

```
POST /api/auth/login
Content-Type: application/json

{
  "email": "student@college.edu",
  "password": "SecurePass123!",
  "rememberMe": true
}

Response:
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "student@college.edu",
    "fullName": "John Doe",
    "role": "student",
    "avatar": null
  }
}
```

#### 5. Google Login

```
POST /api/auth/google-login
Content-Type: application/json

{
  "email": "student@college.edu",
  "displayName": "John Doe",
  "photoURL": "https://...",
  "googleId": "118234567890..."
}

Response:
{
  "success": true,
  "message": "Google login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "student@college.edu",
    "fullName": "John Doe",
    "role": "student",
    "avatar": "https://..."
  }
}
```

#### 6. Logout

```
POST /api/auth/logout
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Logout successful"
}
```

## Project Structure

```
Backend/
├── config/
│   └── db.js              # MongoDB connection
├── controllers/
│   └── authController.js  # Authentication logic
├── middleware/
│   └── authMiddleware.js  # JWT verification, role-based access
├── models/
│   ├── User.js            # User schema
│   ├── OTP.js             # OTP schema
│   └── College.js         # College schema
├── routes/
│   └── auth.js            # Authentication routes
├── seeds/
│   └── colleges.js        # Database seeding script
├── utils/
│   ├── emailService.js    # Nodemailer email sending
│   ├── generateOTP.js     # OTP generation
│   ├── tokenGenerator.js  # JWT token creation
│   └── validators.js      # Email domain & password validation
├── .env.example           # Environment variables template
├── .env                   # Environment variables (local, not in repo)
├── server.js              # Express server entry point
└── package.json           # Dependencies
```

## Key Features

### Email Verification Flow

1. User submits college email
2. System validates domain against registered colleges
3. OTP (6 digits) generated and sent via email
4. User has 10 minutes to verify OTP
5. Maximum 3 attempts before requiring new OTP

### Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (@$!%\*?&)

### College Management

- Admin can add new colleges through admin dashboard (future)
- Each college identified by unique email domain
- Only students with college email can register
- Supports multiple colleges with different domains

### JWT Token

- Automatically included in Authorization header
- Valid for 7 days (30 days if "Remember Me" selected)
- Contains user ID and role for authorization

## Troubleshooting

### MongoDB Connection Issues

- Verify IP whitelist in MongoDB Atlas includes your IP
- Check connection string in .env file
- Ensure database name is correct

### Email Not Sending

- Verify Gmail API is enabled
- Check EMAIL_PASS is correct app password (not regular password)
- Check EMAIL_USER is correct Gmail address

### OTP Verification Fails

- Ensure OTP hasn't expired (10 minutes)
- Check you haven't exceeded 3 attempts
- Create new OTP and try again

### CORS Errors

- Verify FRONTEND_URL in .env matches your frontend address
- Check browser console for specific CORS error messages

## Development Tips

1. Use Postman or VS Code REST Client to test API endpoints
2. Check server logs for detailed error messages
3. Use MongoDB Compass to view database data locally
4. Test email functionality frequently during development

## Security Notes

⚠️ **Important for Production:**

- Change JWT_SECRET to a strong random string
- Use environment variables for all sensitive data
- Never commit .env file to repository
- Enable HTTPS/TLS for all communications
- Implement rate limiting on API endpoints
- Add request validation and sanitization
- Consider implementing 2FA for admin accounts

## Next Steps

1. ✅ Authentication system ready
2. Create event management features
3. Add post/feed functionality
4. Implement messaging system
5. Build admin dashboard
6. Add analytics and reporting

## Support

For issues or questions, contact the development team or refer to the main README.md
