import mongoose from 'mongoose';

const likeSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Compound unique index: one like per user per post
likeSchema.index({ post: 1, user: 1 }, { unique: true });
likeSchema.index({ post: 1 });
likeSchema.index({ user: 1 });

const Like = mongoose.model('Like', likeSchema);
export default Like;
