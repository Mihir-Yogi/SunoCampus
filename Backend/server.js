import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import collegeRoutes from './routes/colleges.js';
import adminRoutes from './routes/admin.js';
import reportRoutes from './routes/reports.js';
import contributorRoutes from './routes/contributor.js';
import browseRoutes from './routes/browse.js';
import saveRoutes from './routes/saves.js';
import { scheduleEventReminders } from './jobs/eventReminderCron.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n🔧 Configuration Check:');
console.log(`  NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`  MONGODB_URI: ${process.env.MONGODB_URI ? '✓ Configured' : '✗ Missing'}`);
console.log(`  EMAIL_USER: ${process.env.EMAIL_USER ? '✓ Configured' : '✗ Missing'}`);
console.log(`  EMAIL_PASS: ${process.env.EMAIL_PASS ? '✓ Configured' : '✗ Missing'}`);
console.log(`  CLOUDINARY:  ${process.env.CLOUDINARY_CLOUD_NAME ? '✓ Configured' : '✗ Missing'}\n`);

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests from any localhost port in development
    if (!origin || /^http:\/\/localhost:\d+$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Connect Database
connectDB();

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/colleges', collegeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/contributor', contributorRoutes);
app.use('/api/browse', browseRoutes);
app.use('/api/saves', saveRoutes);

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

  // Start scheduled jobs
  scheduleEventReminders();
});
