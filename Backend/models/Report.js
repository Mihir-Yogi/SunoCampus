import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    // Who filed the report
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // What is being reported
    reportType: {
      type: String,
      enum: ['user', 'post', 'event', 'comment', 'other'],
      required: true,
    },

    // Reported user (always populated — if reporting a post/event, this is the author)
    reportedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // For future: reference to specific content (post/event/comment ID)
    reportedContentId: {
      type: String,
      default: null,
    },

    // Report category
    category: {
      type: String,
      enum: [
        'spam',
        'harassment',
        'inappropriate_content',
        'broken_link',
        'misinformation',
        'impersonation',
        'hate_speech',
        'privacy_violation',
        'other',
      ],
      required: true,
    },

    // User's description of the issue
    description: {
      type: String,
      required: true,
      minlength: 10,
      maxlength: 1000,
    },

    // Admin moderation
    status: {
      type: String,
      enum: ['pending', 'reviewing', 'resolved', 'dismissed'],
      default: 'pending',
    },

    adminNotes: {
      type: String,
      default: '',
      maxlength: 1000,
    },

    actionTaken: {
      type: String,
      enum: ['none', 'warning_issued', 'content_removed', 'user_deactivated', 'user_banned', 'no_action_needed'],
      default: 'none',
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Index for efficient queries
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ reportedUser: 1 });
reportSchema.index({ reportedBy: 1 });

const Report = mongoose.model('Report', reportSchema);
export default Report;
