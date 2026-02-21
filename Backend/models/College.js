import mongoose from 'mongoose';

const collegeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'College name is required'],
    unique: true,
    trim: true,
  },
  emailDomain: {
    type: String,
    required: [true, 'Email domain is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  location: String,
  website: String,
  abbreviation: String,
  isActive: {
    type: Boolean,
    default: true,
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('College', collegeSchema);
