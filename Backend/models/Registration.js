import mongoose from 'mongoose';

const registrationSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Custom form responses stored as flexible key-value
  // Keys = customField.fieldId, Values = student's answer
  formResponses: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: new Map(),
  },
  attended: {
    type: Boolean,
    default: false,
  },
  registeredAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Compound unique index: one registration per student per event
registrationSchema.index({ event: 1, student: 1 }, { unique: true });
registrationSchema.index({ event: 1 });
registrationSchema.index({ student: 1 });

const Registration = mongoose.model('Registration', registrationSchema);
export default Registration;
