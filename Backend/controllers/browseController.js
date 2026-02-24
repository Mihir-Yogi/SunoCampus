import Post from '../models/Post.js';
import Event from '../models/Event.js';
import Comment from '../models/Comment.js';
import Like from '../models/Like.js';
import Registration from '../models/Registration.js';
import User from '../models/User.js';
import { sendEventRegistrationEmail, sendEventFullEmail } from '../utils/eventEmailService.js';

// ============================================================
// GET FEED — Mixed posts & events, paginated, filterable
// ============================================================
export const getFeed = async (req, res) => {
  try {
    const {
      scope = 'campus',      // campus | global
      type = 'all',           // all | posts | events
      category,               // event category filter
      eventStatus,            // open | full | past
      sort = 'newest',        // newest | mostLiked | mostCommented | soonest
      search = '',
      page = 1,
      limit = 12,
    } = req.query;

    const userId = req.user._id;
    const userCollege = req.user.college;
    const userRole = req.user.role;
    const isAdmin = userRole === 'admin';
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(30, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    let posts = [];
    let events = [];
    let totalPosts = 0;
    let totalEvents = 0;

    // Get blocked user IDs to exclude their content from the feed for ALL users
    const blockedUsers = await User.find({ isBlocked: true }).select('_id').lean();
    const blockedUserIds = blockedUsers.map(u => u._id);

    // --- POSTS ---
    if (type === 'all' || type === 'posts') {
      const postQuery = {};

      // Always hide blocked posts and content from blocked users on Browse
      postQuery.isBlocked = { $ne: true };
      if (blockedUserIds.length > 0) {
        postQuery.createdBy = { $nin: blockedUserIds };
      }

      // Scope filter — admins see ALL posts regardless of scope
      if (isAdmin) {
        // No college filter for admins — they see everything
      } else if (scope === 'campus') {
        postQuery.college = userCollege;
      } else {
        // Global: show global-scoped posts + user's campus posts
        postQuery.$or = [
          { scope: 'global' },
          { college: userCollege },
        ];
      }

      // Search
      if (search.trim()) {
        const searchRegex = new RegExp(search.trim(), 'i');
        postQuery.$and = postQuery.$and || [];
        postQuery.$and.push({
          $or: [
            { title: searchRegex },
            { content: searchRegex },
          ],
        });
      }

      // Sort
      let postSort = { createdAt: -1 }; // default newest
      if (sort === 'mostLiked') postSort = { likesCount: -1, createdAt: -1 };
      if (sort === 'mostCommented') postSort = { commentsCount: -1, createdAt: -1 };

      if (type === 'posts') {
        // Posts-only mode: use proper pagination
        totalPosts = await Post.countDocuments(postQuery);
        posts = await Post.find(postQuery)
          .populate('createdBy', 'fullName email avatar profilePicture')
          .populate('college', 'name abbreviation')
          .sort(postSort)
          .skip(skip)
          .limit(limitNum)
          .lean();
      } else {
        // Mixed mode: fetch half the limit for posts
        const halfLimit = Math.ceil(limitNum / 2);
        totalPosts = await Post.countDocuments(postQuery);
        posts = await Post.find(postQuery)
          .populate('createdBy', 'fullName email avatar profilePicture')
          .populate('college', 'name abbreviation')
          .sort(postSort)
          .skip(skip > 0 ? Math.floor(skip / 2) : 0)
          .limit(halfLimit)
          .lean();
      }

      // Check which posts the user has liked
      if (posts.length > 0) {
        const postIds = posts.map(p => p._id);
        const userLikes = await Like.find({
          post: { $in: postIds },
          user: userId,
        }).select('post').lean();

        const likedPostIds = new Set(userLikes.map(l => l.post.toString()));
        posts = posts.map(p => ({
          ...p,
          _type: 'post',
          isLiked: likedPostIds.has(p._id.toString()),
        }));
      }
    }

    // --- EVENTS ---
    if (type === 'all' || type === 'events') {
      const eventQuery = {};

      // Always hide blocked events and content from blocked users on Browse
      eventQuery.isBlocked = { $ne: true };
      if (blockedUserIds.length > 0) {
        eventQuery.createdBy = { $nin: blockedUserIds };
      }

      // Scope filter — admins see ALL events regardless of scope
      if (isAdmin) {
        // No college filter for admins — they see everything
      } else if (scope === 'campus') {
        eventQuery.college = userCollege;
      } else {
        eventQuery.$or = [
          { scope: 'global' },
          { college: userCollege },
        ];
      }

      // Category filter
      if (category && category !== 'all') {
        eventQuery.category = category;
      }

      // Status filter
      if (eventStatus === 'open') {
        eventQuery.status = 'open';
        eventQuery.eventDate = { $gte: new Date() };
      } else if (eventStatus === 'full') {
        eventQuery.status = 'full';
      } else if (eventStatus === 'past') {
        eventQuery.eventDate = { $lt: new Date() };
        eventQuery.status = { $ne: 'cancelled' };
      } else {
        // Default: exclude cancelled, show all
        eventQuery.status = { $ne: 'cancelled' };
      }

      // Search
      if (search.trim()) {
        const searchRegex = new RegExp(search.trim(), 'i');
        eventQuery.$and = eventQuery.$and || [];
        eventQuery.$and.push({
          $or: [
            { title: searchRegex },
            { description: searchRegex },
          ],
        });
      }

      // Sort
      let eventSort = { createdAt: -1 };
      if (sort === 'soonest') eventSort = { eventDate: 1, createdAt: -1 };

      if (type === 'events') {
        totalEvents = await Event.countDocuments(eventQuery);
        events = await Event.find(eventQuery)
          .populate('createdBy', 'fullName email avatar profilePicture')
          .populate('college', 'name abbreviation')
          .sort(eventSort)
          .skip(skip)
          .limit(limitNum)
          .lean();
      } else {
        const halfLimit = Math.floor(limitNum / 2);
        totalEvents = await Event.countDocuments(eventQuery);
        events = await Event.find(eventQuery)
          .populate('createdBy', 'fullName email avatar profilePicture')
          .populate('college', 'name abbreviation')
          .sort(eventSort)
          .skip(skip > 0 ? Math.floor(skip / 2) : 0)
          .limit(halfLimit)
          .lean();
      }

      // Check which events the user has registered for
      if (events.length > 0) {
        const eventIds = events.map(e => e._id);
        const userRegistrations = await Registration.find({
          event: { $in: eventIds },
          student: userId,
        }).select('event').lean();

        const registeredEventIds = new Set(userRegistrations.map(r => r.event.toString()));
        events = events.map(e => ({
          ...e,
          _type: 'event',
          isRegistered: registeredEventIds.has(e._id.toString()),
          availableSeats: e.totalSeats != null ? e.totalSeats - e.registeredCount : null,
          isPast: new Date(e.eventDate) < new Date(),
          deadlinePassed: e.registrationDeadline ? new Date(e.registrationDeadline) < new Date() : false,
        }));
      }
    }

    // --- MERGE & SORT ---
    let feed = [];
    if (type === 'all') {
      feed = [...posts, ...events];
      // Sort merged feed
      if (sort === 'newest') {
        feed.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      } else if (sort === 'soonest') {
        // Events first by date, then posts by date
        feed.sort((a, b) => {
          if (a._type === 'event' && b._type === 'event') {
            return new Date(a.eventDate) - new Date(b.eventDate);
          }
          if (a._type === 'event') return -1;
          if (b._type === 'event') return 1;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
      } else {
        feed.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
    } else if (type === 'posts') {
      feed = posts;
    } else {
      feed = events;
    }

    const totalItems = type === 'all'
      ? totalPosts + totalEvents
      : type === 'posts' ? totalPosts : totalEvents;

    const totalPages = Math.ceil(totalItems / limitNum);

    res.json({
      success: true,
      data: {
        feed,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalItems,
          hasMore: pageNum < totalPages,
        },
      },
    });
  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({ error: 'Failed to fetch feed' });
  }
};

// ============================================================
// GET SINGLE POST — Full details
// ============================================================
export const getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('createdBy', 'fullName email avatar profilePicture')
      .populate('college', 'name abbreviation')
      .lean();

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if user liked this post
    const like = await Like.findOne({ post: post._id, user: req.user._id });

    res.json({
      success: true,
      data: {
        ...post,
        isLiked: !!like,
      },
    });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
};

// ============================================================
// TOGGLE LIKE — Like/unlike a post
// ============================================================
export const toggleLike = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const existingLike = await Like.findOne({ post: postId, user: userId });

    if (existingLike) {
      // Unlike
      await Like.deleteOne({ _id: existingLike._id });
      post.likesCount = Math.max(0, post.likesCount - 1);
      await post.save();

      return res.json({
        success: true,
        data: { isLiked: false, likesCount: post.likesCount },
        message: 'Post unliked',
      });
    } else {
      // Like
      await Like.create({ post: postId, user: userId });
      post.likesCount += 1;
      await post.save();

      return res.json({
        success: true,
        data: { isLiked: true, likesCount: post.likesCount },
        message: 'Post liked',
      });
    }
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({ error: 'Failed to toggle like' });
  }
};

// ============================================================
// GET COMMENTS — Paginated comments for a post
// ============================================================
export const getComments = async (req, res) => {
  try {
    const postId = req.params.id;
    const { page = 1, limit = 15 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const total = await Comment.countDocuments({ post: postId });
    const comments = await Comment.find({ post: postId })
      .populate('user', 'fullName email')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    res.json({
      success: true,
      data: {
        comments,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalItems: total,
          hasMore: pageNum < Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
};

// ============================================================
// ADD COMMENT — Comment on a post
// ============================================================
export const addComment = async (req, res) => {
  try {
    const postId = req.params.id;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    if (content.trim().length > 2000) {
      return res.status(400).json({ error: 'Comment cannot exceed 2000 characters' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const comment = await Comment.create({
      post: postId,
      user: req.user._id,
      content: content.trim(),
    });

    // Increment comment count
    post.commentsCount += 1;
    await post.save();

    // Populate user info for response
    const populatedComment = await Comment.findById(comment._id)
      .populate('user', 'fullName email')
      .lean();

    res.status(201).json({
      success: true,
      data: populatedComment,
      message: 'Comment added',
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
};

// ============================================================
// DELETE COMMENT — Delete own comment
// ============================================================
export const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Only comment author or admin can delete
    if (comment.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this comment' });
    }

    // Decrement comment count on post
    await Post.findByIdAndUpdate(comment.post, {
      $inc: { commentsCount: -1 },
    });

    await Comment.deleteOne({ _id: comment._id });

    res.json({
      success: true,
      message: 'Comment deleted',
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
};

// ============================================================
// GET SINGLE EVENT — Full details
// ============================================================
export const getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'fullName email avatar profilePicture')
      .populate('college', 'name abbreviation')
      .lean();

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if user registered
    const registration = await Registration.findOne({
      event: event._id,
      student: req.user._id,
    });

    res.json({
      success: true,
      data: {
        ...event,
        isRegistered: !!registration,
        availableSeats: event.totalSeats != null ? event.totalSeats - event.registeredCount : null,
        isPast: new Date(event.eventDate) < new Date(),
        deadlinePassed: event.registrationDeadline ? new Date(event.registrationDeadline) < new Date() : false,
      },
    });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
};

// ============================================================
// REGISTER FOR EVENT — Student registers
// ============================================================
export const registerForEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user._id;
    const { formResponses = {} } = req.body;

    const event = await Event.findById(eventId)
      .populate('createdBy', 'fullName email avatar profilePicture')
      .populate('college', 'name abbreviation');

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Validation checks
    if (event.status === 'cancelled') {
      return res.status(400).json({ error: 'This event has been cancelled' });
    }

    if (event.status === 'full') {
      return res.status(400).json({ error: 'This event is full. No seats available' });
    }

    if (new Date(event.eventDate) < new Date()) {
      return res.status(400).json({ error: 'This event has already passed' });
    }

    if (event.registrationDeadline && new Date(event.registrationDeadline) < new Date()) {
      return res.status(400).json({ error: 'Registration deadline has passed' });
    }

    if (event.totalSeats != null && event.registeredCount >= event.totalSeats) {
      return res.status(400).json({ error: 'No seats available' });
    }

    // Check already registered
    const existing = await Registration.findOne({ event: eventId, student: userId });
    if (existing) {
      return res.status(400).json({ error: 'You are already registered for this event' });
    }

    // Validate custom form fields
    if (event.customFormFields && event.customFormFields.length > 0) {
      for (const field of event.customFormFields) {
        if (field.required) {
          const value = formResponses[field.fieldId];
          if (value === undefined || value === null || value === '') {
            return res.status(400).json({
              error: `"${field.label}" is required`,
            });
          }
        }
      }
    }

    // Create registration
    const registration = await Registration.create({
      event: eventId,
      student: userId,
      formResponses: formResponses,
    });

    // Increment registered count
    event.registeredCount += 1;
    event.checkAndUpdateStatus();
    await event.save();

    // Send confirmation email to student
    try {
      await sendEventRegistrationEmail(req.user.email, req.user.fullName, event);
    } catch (emailErr) {
      console.error('Registration email failed:', emailErr.message);
    }

    // If event is now full, notify the contributor
    if (event.status === 'full') {
      try {
        const contributor = await User.findById(event.createdBy._id || event.createdBy);
        if (contributor) {
          await sendEventFullEmail(contributor.email, contributor.fullName, event);
        }
      } catch (emailErr) {
        console.error('Event full email failed:', emailErr.message);
      }
    }

    res.status(201).json({
      success: true,
      data: {
        registrationId: registration._id,
        isRegistered: true,
        registeredCount: event.registeredCount,
        availableSeats: event.totalSeats != null ? event.totalSeats - event.registeredCount : null,
        status: event.status,
      },
      message: 'Successfully registered for the event!',
    });
  } catch (error) {
    // Handle duplicate key error (race condition)
    if (error.code === 11000) {
      return res.status(400).json({ error: 'You are already registered for this event' });
    }
    console.error('Register for event error:', error);
    res.status(500).json({ error: 'Failed to register for event' });
  }
};

// ============================================================
// CHECK REGISTRATION STATUS — Is user registered for an event?
// ============================================================
export const getRegistrationStatus = async (req, res) => {
  try {
    const registration = await Registration.findOne({
      event: req.params.id,
      student: req.user._id,
    });

    res.json({
      success: true,
      data: {
        isRegistered: !!registration,
        registrationId: registration?._id || null,
      },
    });
  } catch (error) {
    console.error('Registration status error:', error);
    res.status(500).json({ error: 'Failed to check registration status' });
  }
};

// ============================================================
// GET PUBLIC USER PROFILE — View another user's public info
// ============================================================
export const getPublicProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('fullName avatar profilePicture bio college branch currentYear degreeProgram academicInterests role isBlocked createdAt')
      .populate('college', 'name abbreviation')
      .lean();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Hide blocked user profiles
    if (user.isBlocked) {
      return res.status(403).json({ error: 'This user has been blocked' });
    }

    // Count their posts and events
    const [postsCount, eventsCount] = await Promise.all([
      Post.countDocuments({ createdBy: user._id }),
      Event.countDocuments({ createdBy: user._id }),
    ]);

    res.json({
      success: true,
      data: {
        _id: user._id,
        fullName: user.fullName,
        avatar: user.avatar || user.profilePicture || null,
        bio: user.bio || '',
        college: user.college,
        branch: user.branch || '',
        currentYear: user.currentYear || null,
        degreeProgram: user.degreeProgram || '',
        academicInterests: user.academicInterests || '',
        role: user.role,
        joinedAt: user.createdAt,
        postsCount,
        eventsCount,
      },
    });
  } catch (error) {
    console.error('Get public profile error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
};

// ============================================================
// GET USER'S POSTS — All posts by a specific user
// ============================================================
export const getUserPosts = async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(30, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;
    const userId = req.params.id;

    // Check if the target user is blocked — hide their posts
    const targetUser = await User.findById(userId).select('isBlocked').lean();
    if (targetUser?.isBlocked) {
      return res.json({ success: true, data: { posts: [], pagination: { currentPage: 1, totalPages: 0, totalItems: 0, hasMore: false } } });
    }

    const postQuery = { createdBy: userId, isBlocked: { $ne: true } };

    const total = await Post.countDocuments(postQuery);
    const posts = await Post.find(postQuery)
      .populate('createdBy', 'fullName email avatar profilePicture')
      .populate('college', 'name abbreviation')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Check which posts the current user has liked
    if (posts.length > 0) {
      const postIds = posts.map(p => p._id);
      const userLikes = await Like.find({
        post: { $in: postIds },
        user: req.user._id,
      }).select('post').lean();
      const likedPostIds = new Set(userLikes.map(l => l.post.toString()));
      posts.forEach(p => { p.isLiked = likedPostIds.has(p._id.toString()); p._type = 'post'; });
    }

    const totalPages = Math.ceil(total / limitNum);
    res.json({
      success: true,
      data: {
        posts,
        pagination: { currentPage: pageNum, totalPages, totalItems: total, hasMore: pageNum < totalPages },
      },
    });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ error: 'Failed to fetch user posts' });
  }
};

// ============================================================
// GET USER'S EVENTS — All events by a specific user
// ============================================================
export const getUserEvents = async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(30, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;
    const userId = req.params.id;

    // Check if the target user is blocked — hide their events
    const targetUser = await User.findById(userId).select('isBlocked').lean();
    if (targetUser?.isBlocked) {
      return res.json({ success: true, data: { events: [], pagination: { currentPage: 1, totalPages: 0, totalItems: 0, hasMore: false } } });
    }

    const eventQuery = { createdBy: userId, isBlocked: { $ne: true } };

    const total = await Event.countDocuments(eventQuery);
    const events = await Event.find(eventQuery)
      .populate('createdBy', 'fullName email avatar profilePicture')
      .populate('college', 'name abbreviation')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Check which events the current user has registered for
    if (events.length > 0) {
      const eventIds = events.map(e => e._id);
      const userRegs = await Registration.find({
        event: { $in: eventIds },
        student: req.user._id,
      }).select('event').lean();
      const regEventIds = new Set(userRegs.map(r => r.event.toString()));
      events.forEach(e => { e.isRegistered = regEventIds.has(e._id.toString()); e._type = 'event'; });
    }

    const totalPages = Math.ceil(total / limitNum);
    res.json({
      success: true,
      data: {
        events,
        pagination: { currentPage: pageNum, totalPages, totalItems: total, hasMore: pageNum < totalPages },
      },
    });
  } catch (error) {
    console.error('Get user events error:', error);
    res.status(500).json({ error: 'Failed to fetch user events' });
  }
};
