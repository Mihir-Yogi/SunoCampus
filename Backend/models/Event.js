import mongoose from 'mongoose';

const customFieldSchema = new mongoose.Schema({
  fieldId: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    required: true,
    enum: [
      'text', 'number', 'dropdown', 'multi-select', 'checkbox',
      'radio', 'textarea', 'date', 'email', 'phone', 'url', 'file'
    ],
  },
  required: {
    type: Boolean,
    default: false,
  },
  placeholder: {
    type: String,
    trim: true,
    default: '',
  },
  options: [{
    type: String,
    trim: true,
  }],
}, { _id: false });

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    maxlength: [200, 'Event title cannot exceed 200 characters'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [5000, 'Description cannot exceed 5000 characters'],
    default: '',
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: ['Workshop', 'Seminar', 'Conference', 'Competition', 'Cultural', 'Sports', 'Technical', 'Other'],
      message: '{VALUE} is not a valid category',
    },
  },
  mode: {
    type: String,
    required: [true, 'Mode is required'],
    enum: {
      values: ['Online', 'Offline', 'Hybrid'],
      message: '{VALUE} is not a valid mode',
    },
  },
  eventDate: {
    type: Date,
    required: [true, 'Event date is required'],
  },
  eventTime: {
    type: String,
    required: [true, 'Event time is required'],
    trim: true,
  },
  registrationDeadline: {
    type: Date,
    default: null,
  },
  totalSeats: {
    type: Number,
    default: null, // null means unlimited
    min: [1, 'Must have at least 1 seat'],
    max: [100000, 'Cannot exceed 100000 seats'],
  },
  registeredCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  location: {
    type: String,
    trim: true,
    default: '',
  },
  zoomLink: {
    type: String,
    trim: true,
    default: '',
  },
  bannerImage: {
    type: String, // Cloudinary URL
    default: '',
  },
  bannerImagePublicId: {
    type: String, // Cloudinary public_id for deletion
    default: '',
  },
  scope: {
    type: String,
    enum: ['campus', 'global'],
    default: 'campus',
  },
  status: {
    type: String,
    enum: ['open', 'full', 'cancelled'],
    default: 'open',
  },
  customFormFields: [customFieldSchema],
  rules: [{
    type: String,
    trim: true,
    maxlength: [500, 'Each rule cannot exceed 500 characters'],
  }],
  faqs: [{
    question: {
      type: String,
      required: true,
      trim: true,
      maxlength: [300, 'FAQ question cannot exceed 300 characters'],
    },
    answer: {
      type: String,
      required: true,
      trim: true,
      maxlength: [1000, 'FAQ answer cannot exceed 1000 characters'],
    },
  }],
  // Default student fields the contributor wants to collect during registration
  // Name, Email & College are ALWAYS collected. These are the optional ones.
  defaultFormFields: [{
    type: String,
    enum: ['phone', 'branch', 'currentYear', 'studentId', 'gender', 'dateOfBirth'],
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  college: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true,
  },
  isBlocked: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Indexes
eventSchema.index({ college: 1, status: 1 });
eventSchema.index({ createdBy: 1 });
eventSchema.index({ eventDate: 1 });
eventSchema.index({ scope: 1, status: 1 });

// Virtual: available seats (null totalSeats = unlimited)
eventSchema.virtual('availableSeats').get(function () {
  if (this.totalSeats == null) return null; // unlimited
  return this.totalSeats - this.registeredCount;
});

// Auto-set status to 'full' when seats fill up
eventSchema.methods.checkAndUpdateStatus = function () {
  if (this.totalSeats != null && this.totalSeats > 0 && this.registeredCount >= this.totalSeats && this.status === 'open') {
    this.status = 'full';
  }
  return this;
};

// Ensure virtuals are included in JSON
eventSchema.set('toJSON', { virtuals: true });
eventSchema.set('toObject', { virtuals: true });

const Event = mongoose.model('Event', eventSchema);
export default Event;
