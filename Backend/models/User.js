import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  // Personal Details
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false,
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required'],
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: [true, 'Gender is required'],
  },

  // College Details
  college: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true,
  },
  collegeName: String,
  studentId: {
    type: String,
    required: [true, 'Student ID is required'],
  },
  branch: {
    type: String,
    required: [true, 'Branch is required'],
  },
  currentYear: {
    type: Number,
    min: 1,
    max: 4,
  },
  graduationYear: {
    type: Number,
  },
  expectedGraduationYear: {
    type: Number,
  },

  // Role & Status
  role: {
    type: String,
    enum: ['student', 'contributor', 'admin'],
    default: 'student',
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },

  // Profile
  googleId: String,
  avatar: String,
  profilePicture: String,
  bio: String,
  location: {
    type: String,
    trim: true,
  },
  degreeProgram: {
    type: String,
    trim: true,
  },
  academicInterests: {
    type: String,
    trim: true,
    maxlength: 500,
  },

  // Contributor request
  contributorStatus: {
    type: String,
    enum: ['none', 'pending', 'approved', 'rejected'],
    default: 'none',
  },
  contributorRequestedAt: Date,

  // Timestamps
  lastLogin: Date,
}, {
  timestamps: true,
});

export default mongoose.model('User', userSchema);
