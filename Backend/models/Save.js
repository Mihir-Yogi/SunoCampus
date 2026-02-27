import mongoose from 'mongoose';

const saveSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    contentType: {
      type: String,
      enum: ['post', 'event'],
      required: true,
    },
    content: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'contentType',
    },
  },
  { timestamps: true }
);

// Compound index to prevent duplicates and speed up queries
saveSchema.index({ user: 1, contentType: 1, content: 1 }, { unique: true });

const Save = mongoose.model('Save', saveSchema);
export default Save;
