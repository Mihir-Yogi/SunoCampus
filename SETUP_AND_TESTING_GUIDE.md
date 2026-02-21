# SunoCampus - Complete Setup & Testing Guide

## 🚀 Quick Start

### Backend Setup

1. **Create `.env` file** in `Backend/` directory:

```env
MONGODB_URI=mongodb+srv://your_username:your_password@cluster.mongodb.net/SunoCampusDB?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_12345_change_this_in_production
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_from_gmail
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
PORT=5000
```

2. **Install backend dependencies** (if not already done):

```bash
cd Backend
npm install
```

3. **Seed college data**:

```bash
node seeds/colleges.js
```

4. **Start backend server**:

```bash
npm run dev
```

Backend will run on: `http://localhost:5000`

### Frontend Setup

1. **Build frontend** (in root SunoCampus directory):

```bash
npm run dev
```

Frontend will run on: `http://localhost:5173`

---

## 📋 Authentication Flow

### Registration Step-by-Step

1. **Visit**: http://localhost:5173/register
2. **Step 1 - Email Verification**:
   - Enter college email (must be registered domain)
   - Click "Send OTP"
   - Check email for 6-digit code
   - Enter OTP and click "Verify OTP"

3. **Step 2 - Personal Details**:
   - Full Name: John Doe
   - Phone: +91 9999999999
   - Date of Birth: Select from calendar
   - Gender: Male/Female/Other

4. **Step 3 - College Information**:
   - Student ID: 2024CS001
   - Branch: Computer Science
   - Graduation Year: 2028

5. **Step 4 - Password**:
   - Password: SecurePass123! (min 8 chars, uppercase, lowercase, number, symbol)
   - Confirm Password: SecurePass123!

6. **Click "Create Account"** - Account created! Redirects to /about

### Login Step-by-Step

1. **Visit**: http://localhost:5173/login
2. **Enter credentials**:
   - Email: student@college.edu
   - Password: Your password
3. **Optional**: Check "Remember me" for 30-day token
4. **Click "Sign In"** - Logs in! Redirects to /about

---

## 🧪 Testing with Postman/REST Client

### Test Email 1: GNU (Ganpat University)

```
Email Domain: gnu.ac.in
Example: student@gnu.ac.in
```

### Test Email 2: IIITB (Indian Institute of Information Technology, Bangalore)

```
Email Domain: iiitb.ac.in
Example: student@iiitb.ac.in
```

### API Test Cases

#### 1️⃣ Send OTP

```
POST http://localhost:5000/api/auth/send-otp
Content-Type: application/json

{
  "email": "student@gnu.ac.in"
}

Expected Response:
{
  "success": true,
  "message": "OTP sent to email successfully",
  "email": "student@gnu.ac.in"
}
```

#### 2️⃣ Verify OTP

```
POST http://localhost:5000/api/auth/verify-otp
Content-Type: application/json

{
  "email": "student@gnu.ac.in",
  "otp": "123456"  (check email for actual OTP)
}

Expected Response:
{
  "success": true,
  "message": "OTP verified successfully",
  "email": "student@gnu.ac.in"
}
```

#### 3️⃣ Register Account

```
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "email": "student@gnu.ac.in",
  "password": "TestPass123!",
  "confirmPassword": "TestPass123!",
  "fullName": "Test Student",
  "phone": "+91 9999999999",
  "dateOfBirth": "2004-01-15",
  "gender": "male",
  "studentId": "2024CS001",
  "branch": "CSE",
  "graduationYear": 2028
}

Expected Response:
{
  "success": true,
  "message": "Account created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "student@gnu.ac.in",
    "fullName": "Test Student",
    "role": "student"
  }
}
```

#### 4️⃣ Login

```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "student@gnu.ac.in",
  "password": "TestPass123!",
  "rememberMe": true
}

Expected Response:
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "student@gnu.ac.in",
    "fullName": "Test Student",
    "role": "student",
    "avatar": null
  }
}
```

#### 5️⃣ Protected Route Test (Logout)

```
POST http://localhost:5000/api/auth/logout
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

Expected Response:
{
  "success": true,
  "message": "Logout successful"
}
```

---

## 🔧 Environment Setup Details

### MongoDB Atlas

1. Go to https://www.mongodb.com/cloud/atlas
2. Create account or sign in
3. Create a new project
4. Create a cluster (free tier available)
5. Create database named `SunoCampusDB`
6. Create user with database password
7. Add your IP to whitelist
8. Copy connection string and update `.env`

### Gmail App Password

1. Enable 2-Step Verification: https://myaccount.google.com/security
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Select Mail → Windows (or your device)
4. Generate and copy the 16-character password
5. Update `EMAIL_USER` and `EMAIL_PASS` in `.env`

---

## 📱 Features Tested

✅ **Email Verification with OTP**

- OTP generation and email sending
- 10-minute expiration
- 3 attempt limit
- Domain validation

✅ **User Registration**

- Multi-step form validation
- Password strength requirements
- College information capture
- Student role assignment

✅ **User Login**

- Email/password authentication
- Remember me functionality
- Token generation (7 or 30 days)
- Error handling for invalid credentials

✅ **JWT Authentication**

- Token generation on login/register
- Automatic token inclusion in API requests
- Token validation and expiration
- Automatic redirect to login on 401

✅ **Frontend Integration**

- Real-time form validation
- Toast notifications for feedback
- Loading states and animations
- Error handling and display

---

## 🎨 UI/UX Features

- ✅ Professional navy blue theme (#1e3a5f)
- ✅ Smooth animations and transitions
- ✅ Loading spinners and states
- ✅ Real-time form validation with visual feedback
- ✅ Toast notifications (success, error, warning, info)
- ✅ Responsive mobile design
- ✅ Password visibility toggle
- ✅ Multi-step registration progress indicator
- ✅ Remember me checkbox
- ✅ Google login button (integration ready)

---

## 📊 Database Schema

### Users Collection

```javascript
{
  _id: ObjectId,
  fullName: String,
  email: String (unique),
  password: String (hashed),
  phone: String,
  dateOfBirth: Date,
  gender: String enum['male', 'female', 'other'],
  college: ObjectId (ref: College),
  studentId: String,
  branch: String,
  graduationYear: Number,
  role: String enum['student', 'contributor', 'admin'],
  isVerified: Boolean,
  isActive: Boolean,
  googleId: String,
  avatar: String,
  bio: String,
  createdAt: Date,
  updatedAt: Date,
  lastLogin: Date
}
```

### OTP Collection

```javascript
{
  _id: ObjectId,
  email: String,
  otp: String (6 digits),
  expiresAt: Date (auto-deletes after 10 min),
  attempts: Number (max 3),
  createdAt: Date
}
```

### Colleges Collection

```javascript
{
  _id: ObjectId,
  name: String (unique),
  emailDomain: String (unique),
  location: String,
  website: String,
  abbreviation: String,
  isActive: Boolean,
  addedBy: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🐛 Troubleshooting

### Backend won't start

```
Error: ENOENT: no such file or directory, open '.env'
Solution: Create .env file in Backend/ directory with required variables
```

### Email not sending

```
Error: Invalid login credentials
Solution:
1. Use Gmail App Password, not regular password
2. Enable 2-Step Verification first
3. Verify EMAIL_USER and EMAIL_PASS in .env
```

### MongoDB connection failed

```
Error: MongoNetworkError: getaddrinfo ENOTFOUND
Solution:
1. Check MONGODB_URI in .env is correct
2. Verify IP whitelist includes your IP
3. Check internet connection
```

### CORS errors in browser

```
Error: Access to XMLHttpRequest blocked by CORS
Solution:
1. Verify FRONTEND_URL in Backend .env matches frontend address
2. Ensure backend CORS is enabled (already configured)
3. Clear browser cache and try again
```

### OTP expired error

```
Error: OTP has expired
Solution: OTP is valid for 10 minutes. Send new OTP and try again.
```

### Password validation fails

```
Error: Password must be at least 8 characters with uppercase, lowercase, number, and symbol
Solution: Use format like: SecurePass123!
- Minimum 8 characters
- Include uppercase (A-Z)
- Include lowercase (a-z)
- Include number (0-9)
- Include symbol (@$!%*?&)
```

---

## 🚀 What's Next?

### Features to Build:

1. **Google OAuth Integration** - Currently has UI ready
2. **Event Management** - Create, list, manage events
3. **Post/Feed System** - User posts and comments
4. **Messaging** - Direct messaging between users
5. **Admin Dashboard** - Manage users, colleges, content
6. **Contributor Application** - Apply for contributor status
7. **Analytics** - User engagement and platform stats
8. **Notifications** - Real-time notifications system

---

## 📝 Notes

- All API responses follow a consistent structure: `{ success, message, data }`
- All errors include helpful error messages
- Tokens are valid for 7 days (or 30 days if Remember Me selected)
- Passwords are hashed with bcryptjs (salt rounds: 10)
- All email addresses are normalized to lowercase
- College domains are validated during registration

---

## ✅ Checklist Before Deployment

- [ ] Change JWT_SECRET to strong random string
- [ ] Change MongoDB user password to strong password
- [ ] Enable HTTPS/TLS
- [ ] Set NODE_ENV=production
- [ ] Implement rate limiting
- [ ] Add request validation middleware
- [ ] Enable CORS for production domain only
- [ ] Set up error logging service
- [ ] Test all API endpoints
- [ ] Load test the application
- [ ] Set up database backups
- [ ] Document API endpoints
- [ ] Create user documentation

---

For issues or questions, refer to Backend/README.md or contact the development team.
