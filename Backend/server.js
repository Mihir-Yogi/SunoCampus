import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import collegeRoutes from './routes/colleges.js';

console.log('\n🔧 Configuration Check:');
console.log(`  NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`  MONGODB_URI: ${process.env.MONGODB_URI ? '✓ Configured' : '✗ Missing'}`);
console.log(`  EMAIL_USER: ${process.env.EMAIL_USER ? '✓ Configured' : '✗ Missing'}`);
console.log(`  EMAIL_PASS: ${process.env.EMAIL_PASS ? '✓ Configured' : '✗ Missing'}\n`);

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Connect Database
connectDB();

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/colleges', collegeRoutes);

// Test Route
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
});
