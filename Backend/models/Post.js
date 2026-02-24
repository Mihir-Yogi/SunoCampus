import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Post title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  content: {
    type: String,
    required: [true, 'Post content is required'],
    trim: true,
    maxlength: [10000, 'Content cannot exceed 10000 characters'],
  },
  image: {
    type: String, // Cloudinary URL
    default: '',
  },
  imagePublicId: {
    type: String, // Cloudinary public_id for deletion
    default: '',
  },
  scope: {
    type: String,
    enum: ['campus', 'global'],
    default: 'campus',
  },
  likesCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  commentsCount: {
    type: Number,
    default: 0,
    min: 0,
  },
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
postSchema.index({ createdBy: 1 });
postSchema.index({ college: 1 });
postSchema.index({ scope: 1 });
postSchema.index({ createdAt: -1 });

const Post = mongoose.model('Post', postSchema);
export default Post;
