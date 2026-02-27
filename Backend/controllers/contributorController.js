import Event from '../models/Event.js';
import Post from '../models/Post.js';
import Registration from '../models/Registration.js';
import Comment from '../models/Comment.js';
import Like from '../models/Like.js';
import User from '../models/User.js';
import { deleteCloudinaryImage } from '../config/cloudinary.js';
import { Parser } from 'json2csv';
import { sendEventRegistrationEmail, sendEventFullEmail, sendEventCancellationEmail } from '../utils/eventEmailService.js';

// ============================================================
// OVERVIEW
// ============================================================

/**
 * GET /api/contributor/overview
 * Dashboard overview stats + recent data
 */
export const getOverview = async (req, res) => {
  try {
    const userId = req.user._id;
    const collegeId = req.user.college;

    // Parallel queries for stats
    const [
      totalEvents,
      totalPosts,
      events,
      posts,
    ] = await Promise.all([
      Event.countDocuments({ createdBy: userId }),
      Post.countDocuments({ createdBy: userId }),
      Event.find({ createdBy: userId }).sort({ createdAt: -1 }).lean(),
      Post.find({ createdBy: userId }).sort({ createdAt: -1 }).lean(),
    ]);

    // Aggregate total registrations across all events
    const totalRegistrations = events.reduce((sum, e) => sum + (e.registeredCount || 0), 0);

    // Aggregate total post likes
    const totalPostLikes = posts.reduce((sum, p) => sum + (p.likesCount || 0), 0);

    // Mini event list (top 5, with seat progress)
    const eventsAtGlance = events.slice(0, 5).map(e => ({
      _id: e._id,
      title: e.title,
      category: e.category,
      status: e.status,
      eventDate: e.eventDate,
      totalSeats: e.totalSeats,
      registeredCount: e.registeredCount,
      availableSeats: e.totalSeats != null && e.totalSeats > 0 ? e.totalSeats - e.registeredCount : null,
    }));

    // Recent posts (top 5)
    const recentPosts = posts.slice(0, 5).map(p => ({
      _id: p._id,
      title: p.title,
      likesCount: p.likesCount,
      commentsCount: p.commentsCount,
      createdAt: p.createdAt,
      hasImage: !!p.image,
    }));

    res.json({
      success: true,
      data: {
        stats: {
          totalEvents,
          totalPosts,
          totalRegistrations,
          totalPostLikes,
        },
        eventsAtGlance,
        recentPosts,
        contributorName: req.user.fullName,
        collegeName: req.user.collegeName,
      },
    });
  } catch (error) {
    console.error('Overview error:', error);
    res.status(500).json({ success: false, message: 'Failed to load overview' });
  }
};

// ============================================================
// EVENTS CRUD
// ============================================================

/**
 * GET /api/contributor/events
 * List all events created by this contributor
 */
export const getMyEvents = async (req, res) => {
  try {
    const { status, category, sort = '-createdAt' } = req.query;
    const filter = { createdBy: req.user._id };

    if (status) filter.status = status;
    if (category) filter.category = category;

    const events = await Event.find(filter)
      .sort(sort)
      .populate('college', 'name abbreviation')
      .lean();

    // Add availableSeats virtual
    const eventsWithSeats = events.map(e => ({
      ...e,
      availableSeats: e.totalSeats != null && e.totalSeats > 0 ? e.totalSeats - e.registeredCount : null,
    }));

    res.json({ success: true, data: eventsWithSeats });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ success: false, message: 'Failed to load events' });
  }
};

/**
 * GET /api/contributor/events/:id
 * Get single event with full details
 */
export const getEventById = async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    }).populate('college', 'name abbreviation').lean();

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    res.json({
      success: true,
      data: {
        ...event,
        availableSeats: event.totalSeats != null && event.totalSeats > 0 ? event.totalSeats - event.registeredCount : null,
      },
    });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ success: false, message: 'Failed to load event' });
  }
};

/**
 * POST /api/contributor/events
 * Create a new event
 */
export const createEvent = async (req, res) => {
  try {
    const {
      title, description, category, mode,
      eventDate, eventTime, totalSeats,
      location, zoomLink, scope, customFormFields,
      registrationDeadline, defaultFormFields,
    } = req.body;

    // Validate required fields
    if (!title || !category || !mode || !eventDate || !eventTime) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: title, category, mode, eventDate, eventTime',
      });
    }

    // Validate mode-specific fields
    if ((mode === 'Offline' || mode === 'Hybrid') && !location) {
      return res.status(400).json({
        success: false,
        message: 'Location is required for Offline/Hybrid events',
      });
    }
    if ((mode === 'Online' || mode === 'Hybrid') && !zoomLink) {
      return res.status(400).json({
        success: false,
        message: 'Zoom/Meeting link is required for Online/Hybrid events',
      });
    }

    // Validate event date is in the future
    if (new Date(eventDate) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Event date must be in the future',
      });
    }

    // Parse custom form fields if provided as string
    let parsedCustomFields = [];
    if (customFormFields) {
      parsedCustomFields = typeof customFormFields === 'string'
        ? JSON.parse(customFormFields)
        : customFormFields;

      // Valid field types
      const validFieldTypes = [
        'text', 'number', 'dropdown', 'multi-select', 'checkbox',
        'radio', 'textarea', 'date', 'email', 'phone', 'url', 'file'
      ];

      // Validate custom fields structure
      for (const field of parsedCustomFields) {
        if (!field.fieldId || !field.label || !field.type) {
          return res.status(400).json({
            success: false,
            message: 'Each custom field must have fieldId, label, and type',
          });
        }
        // Validate field type is valid
        if (!validFieldTypes.includes(field.type)) {
          return res.status(400).json({
            success: false,
            message: `Field type "${field.type}" is not valid`,
          });
        }
        // Validate options for dropdown/radio/multi-select
        if (['dropdown', 'radio', 'multi-select'].includes(field.type)) {
          if (!field.options || field.options.length < 2) {
            return res.status(400).json({
              success: false,
              message: `Field "${field.label}" requires at least 2 options`,
            });
          }
        }
      }
    }

    const eventData = {
      title: title.trim(),
      description: description?.trim() || '',
      category,
      mode,
      eventDate: new Date(eventDate),
      eventTime: eventTime.trim(),
      totalSeats: totalSeats && parseInt(totalSeats) > 0 ? parseInt(totalSeats) : null,
      registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : null,
      location: location?.trim() || '',
      zoomLink: zoomLink?.trim() || '',
      scope: scope || 'campus',
      customFormFields: parsedCustomFields,
      defaultFormFields: defaultFormFields
        ? (typeof defaultFormFields === 'string' ? JSON.parse(defaultFormFields) : defaultFormFields)
        : [],
      createdBy: req.user._id,
      college: req.user.college,
    };

    // Handle banner image from Cloudinary upload
    if (req.file) {
      eventData.bannerImage = req.file.path;
      eventData.bannerImagePublicId = req.file.filename;
    }

    const event = await Event.create(eventData);

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: event,
    });
  } catch (error) {
    console.error('Create event error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: 'Failed to create event' });
  }
};

/**
 * PUT /api/contributor/events/:id
 * Update an event
 */
export const updateEvent = async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Cannot edit a cancelled event' });
    }

    const {
      title, description, category, mode,
      eventDate, eventTime, totalSeats,
      location, zoomLink, scope, customFormFields,
      registrationDeadline, defaultFormFields,
    } = req.body;

    // Cannot reduce total seats below current registrations
    if (totalSeats && parseInt(totalSeats) < event.registeredCount) {
      return res.status(400).json({
        success: false,
        message: `Cannot set seats below current registrations (${event.registeredCount})`,
      });
    }

    // Update fields
    if (title) event.title = title.trim();
    if (description !== undefined) event.description = description.trim();
    if (category) event.category = category;
    if (mode) event.mode = mode;
    if (eventDate) event.eventDate = new Date(eventDate);
    if (eventTime) event.eventTime = eventTime.trim();
    if (totalSeats && parseInt(totalSeats) > 0) {
      event.totalSeats = parseInt(totalSeats);
      // Re-evaluate status when seats change
      if (event.registeredCount >= event.totalSeats) {
        event.status = 'full';
      } else if (event.status === 'full') {
        event.status = 'open';
      }
    } else if (totalSeats !== undefined) {
      // Explicitly cleared or set to 0 — unlimited
      event.totalSeats = null;
      if (event.status === 'full') event.status = 'open';
    }
    if (registrationDeadline !== undefined) {
      event.registrationDeadline = registrationDeadline ? new Date(registrationDeadline) : null;
    }
    if (location !== undefined) event.location = location.trim();
    if (zoomLink !== undefined) event.zoomLink = zoomLink.trim();
    if (scope) event.scope = scope;

    // Update custom form fields
    if (customFormFields) {
      const parsed = typeof customFormFields === 'string'
        ? JSON.parse(customFormFields)
        : customFormFields;

      // Valid field types
      const validFieldTypes = [
        'text', 'number', 'dropdown', 'multi-select', 'checkbox',
        'radio', 'textarea', 'date', 'email', 'phone', 'url', 'file'
      ];

      // Validate custom fields
      for (const field of parsed) {
        if (!field.fieldId || !field.label || !field.type) {
          return res.status(400).json({
            success: false,
            message: 'Each custom field must have fieldId, label, and type',
          });
        }
        if (!validFieldTypes.includes(field.type)) {
          return res.status(400).json({
            success: false,
            message: `Field type "${field.type}" is not valid`,
          });
        }
        if (['dropdown', 'radio', 'multi-select'].includes(field.type)) {
          if (!field.options || field.options.length < 2) {
            return res.status(400).json({
              success: false,
              message: `Field "${field.label}" requires at least 2 options`,
            });
          }
        }
      }

      event.customFormFields = parsed;
    }

    // Update default registration form fields
    if (defaultFormFields !== undefined) {
      const parsed = typeof defaultFormFields === 'string'
        ? JSON.parse(defaultFormFields)
        : defaultFormFields;
      event.defaultFormFields = parsed || [];
    }

    // Handle banner image update
    if (req.file) {
      // Delete old banner if exists
      if (event.bannerImagePublicId) {
        await deleteCloudinaryImage(event.bannerImagePublicId);
      }
      event.bannerImage = req.file.path;
      event.bannerImagePublicId = req.file.filename;
    }

    await event.save();

    res.json({
      success: true,
      message: 'Event updated successfully',
      data: event,
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ success: false, message: 'Failed to update event' });
  }
};

/**
 * PUT /api/contributor/events/:id/cancel
 * Cancel an event — notifies all registered students
 */
export const cancelEvent = async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Event is already cancelled' });
    }

    // Get all registered students for email notification
    const registrations = await Registration.find({ event: event._id })
      .populate('student', 'fullName email');

    // Cancel the event
    event.status = 'cancelled';
    await event.save();

    // Send cancellation emails to all registered students
    const studentEmails = registrations
      .filter(r => r.student?.email)
      .map(r => ({
        email: r.student.email,
        name: r.student.fullName,
      }));

    if (studentEmails.length > 0) {
      // Fire and forget — don't block the response
      sendEventCancellationEmail(studentEmails, event).catch(err =>
        console.error('Cancellation email error:', err)
      );
    }

    // Clear all registrations
    await Registration.deleteMany({ event: event._id });

    // Reset registered count
    event.registeredCount = 0;
    await event.save();

    res.json({
      success: true,
      message: `Event cancelled. ${studentEmails.length} students will be notified.`,
      data: { notifiedCount: studentEmails.length },
    });
  } catch (error) {
    console.error('Cancel event error:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel event' });
  }
};

/**
 * DELETE /api/contributor/events/:id
 * Permanently delete an event and all its registrations
 */
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Delete banner from Cloudinary if exists
    if (event.bannerImagePublicId) {
      await deleteCloudinaryImage(event.bannerImagePublicId);
    }

    // Delete all registrations for this event
    await Registration.deleteMany({ event: event._id });

    // Delete the event
    await event.deleteOne();

    res.json({ success: true, message: 'Event deleted permanently' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete event' });
  }
};

// ============================================================
// POSTS CRUD
// ============================================================

/**
 * GET /api/contributor/posts
 * List all posts by this contributor
 */
export const getMyPosts = async (req, res) => {
  try {
    const { sort = '-createdAt' } = req.query;

    const posts = await Post.find({ createdBy: req.user._id })
      .sort(sort)
      .lean();

    res.json({ success: true, data: posts });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ success: false, message: 'Failed to load posts' });
  }
};

/**
 * POST /api/contributor/posts
 * Create a new post
 */
export const createPost = async (req, res) => {
  try {
    const { title, content, scope } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required',
      });
    }

    const postData = {
      title: title.trim(),
      content: content.trim(),
      scope: scope || 'campus',
      createdBy: req.user._id,
      college: req.user.college,
    };

    // Handle image from Cloudinary upload
    if (req.file) {
      postData.image = req.file.path;
      postData.imagePublicId = req.file.filename;
    }

    const post = await Post.create(postData);

    res.status(201).json({
      success: true,
      message: 'Post published successfully',
      data: post,
    });
  } catch (error) {
    console.error('Create post error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: 'Failed to create post' });
  }
};

/**
 * PUT /api/contributor/posts/:id
 * Update a post
 */
export const updatePost = async (req, res) => {
  try {
    const post = await Post.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const { title, content, scope } = req.body;

    if (title) post.title = title.trim();
    if (content) post.content = content.trim();
    if (scope) post.scope = scope;

    // Handle image update
    if (req.file) {
      if (post.imagePublicId) {
        await deleteCloudinaryImage(post.imagePublicId);
      }
      post.image = req.file.path;
      post.imagePublicId = req.file.filename;
    }

    await post.save();

    res.json({
      success: true,
      message: 'Post updated successfully',
      data: post,
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ success: false, message: 'Failed to update post' });
  }
};

/**
 * DELETE /api/contributor/posts/:id
 * Delete a post and all its comments/likes
 */
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Delete Cloudinary image
    if (post.imagePublicId) {
      await deleteCloudinaryImage(post.imagePublicId);
    }

    // Delete all comments and likes for this post
    await Promise.all([
      Comment.deleteMany({ post: post._id }),
      Like.deleteMany({ post: post._id }),
      post.deleteOne(),
    ]);

    res.json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete post' });
  }
};

// ============================================================
// REGISTRATIONS & ATTENDANCE
// ============================================================

/**
 * GET /api/contributor/events/:id/registrations
 * Get all registrations for a specific event
 */
export const getEventRegistrations = async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    }).lean();

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const { search, page = 1, limit = 50 } = req.query;
    const filter = { event: event._id };

    const registrations = await Registration.find(filter)
      .populate('student', 'fullName email collegeName college avatar')
      .populate({ path: 'student', populate: { path: 'college', select: 'name abbreviation' } })
      .sort({ registeredAt: -1 })
      .lean();

    // Apply search filter on populated data
    let filtered = registrations;
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = registrations.filter(r =>
        r.student?.fullName?.toLowerCase().includes(searchLower) ||
        r.student?.email?.toLowerCase().includes(searchLower)
      );
    }

    // Paginate
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const paginated = filtered.slice(startIndex, startIndex + parseInt(limit));

    res.json({
      success: true,
      data: {
        event: {
          _id: event._id,
          title: event.title,
          totalSeats: event.totalSeats,
          registeredCount: event.registeredCount,
          availableSeats: event.totalSeats != null && event.totalSeats > 0 ? event.totalSeats - event.registeredCount : null,
          customFormFields: event.customFormFields,
          defaultFormFields: event.defaultFormFields,
        },
        registrations: paginated,
        stats: {
          totalRegistered: registrations.length,
          seatsAvailable: event.totalSeats != null && event.totalSeats > 0 ? event.totalSeats - event.registeredCount : null,
        },
        pagination: {
          total: filtered.length,
          page: parseInt(page),
          pages: Math.ceil(filtered.length / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get registrations error:', error);
    res.status(500).json({ success: false, message: 'Failed to load registrations' });
  }
};

/**
 * GET /api/contributor/registrations
 * Get all registrations grouped by event (for Registrations tab)
 */
export const getAllRegistrations = async (req, res) => {
  try {
    const events = await Event.find({ createdBy: req.user._id })
      .sort({ eventDate: -1 })
      .lean();

    const eventsWithRegistrations = await Promise.all(
      events.map(async (event) => {
        const registrations = await Registration.find({ event: event._id })
          .populate('student', 'fullName email collegeName')
          .sort({ registeredAt: -1 })
          .limit(3) // First 3 for preview
          .lean();

        const totalRegistered = await Registration.countDocuments({ event: event._id });

        return {
          _id: event._id,
          title: event.title,
          category: event.category,
          eventDate: event.eventDate,
          totalSeats: event.totalSeats,
          registeredCount: event.registeredCount,
          availableSeats: event.totalSeats != null && event.totalSeats > 0 ? event.totalSeats - event.registeredCount : null,
          status: event.status,
          previewStudents: registrations.map(r => ({
            _id: r._id,
            studentName: r.student?.fullName,
            studentEmail: r.student?.email,
            collegeName: r.student?.collegeName,
            registeredAt: r.registeredAt,
          })),
          totalRegistered,
        };
      })
    );

    res.json({ success: true, data: eventsWithRegistrations });
  } catch (error) {
    console.error('Get all registrations error:', error);
    res.status(500).json({ success: false, message: 'Failed to load registrations' });
  }
};

/**
 * POST /api/contributor/events/:id/export-csv
 * Export registrations as CSV with selected fields
 */
export const exportRegistrationsCSV = async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    }).lean();

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // selectedFields from request body: array of field keys to include
    const { selectedFields } = req.body;

    if (!selectedFields || !Array.isArray(selectedFields) || selectedFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please select at least one field to export',
      });
    }

    const registrations = await Registration.find({ event: event._id })
      .populate('student', 'fullName email collegeName phone')
      .populate({ path: 'student', populate: { path: 'college', select: 'name' } })
      .sort({ registeredAt: 1 })
      .lean();

    // Build CSV rows based on selected fields
    const rows = registrations.map((r, index) => {
      const row = {};

      // Default fields
      if (selectedFields.includes('sno')) row['S.No'] = index + 1;
      if (selectedFields.includes('name')) row['Full Name'] = r.student?.fullName || '';
      if (selectedFields.includes('email')) row['Email'] = r.student?.email || '';
      if (selectedFields.includes('college')) row['College'] = r.student?.college?.name || r.student?.collegeName || '';
      if (selectedFields.includes('phone')) row['Phone'] = r.student?.phone || '';
      if (selectedFields.includes('registeredAt')) row['Registered On'] = r.registeredAt ? new Date(r.registeredAt).toLocaleDateString() : '';

      // Custom form fields
      if (r.formResponses) {
        const responses = r.formResponses instanceof Map
          ? Object.fromEntries(r.formResponses)
          : r.formResponses;

        for (const field of (event.customFormFields || [])) {
          if (selectedFields.includes(field.fieldId)) {
            const value = responses[field.fieldId];
            let displayValue = '';
            
            if (Array.isArray(value)) {
              // Multi-select or array type
              displayValue = value.join(', ');
            } else if (value && typeof value === 'object') {
              // File or object - just show [Uploaded]
              displayValue = '[Uploaded]';
            } else {
              // Primitive value
              displayValue = value || '';
            }
            
            row[field.label] = displayValue;
          }
        }
      }

      return row;
    });

    if (rows.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No registrations to export',
        data: { csv: '', count: 0 },
      });
    }

    const parser = new Parser({ fields: Object.keys(rows[0]) });
    const csv = parser.parse(rows);

    // Return CSV as downloadable response
    const filename = `${event.title.replace(/[^a-zA-Z0-9]/g, '_')}_registrations.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({ success: false, message: 'Failed to export CSV' });
  }
};

/**
 * GET /api/contributor/events/:id/export-fields
 * Get available fields for CSV export (default + custom)
 */
export const getExportFields = async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    }).lean();

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Default fields always available
    const defaultFields = [
      { fieldId: 'sno', label: 'S.No', type: 'default' },
      { fieldId: 'name', label: 'Full Name', type: 'default' },
      { fieldId: 'email', label: 'Email', type: 'default' },
      { fieldId: 'college', label: 'College', type: 'default' },
      { fieldId: 'phone', label: 'Phone', type: 'default' },
      { fieldId: 'registeredAt', label: 'Registered On', type: 'default' },
      { fieldId: 'attended', label: 'Attended', type: 'default' },
    ];

    // Custom fields from the event's form
    const customFields = (event.customFormFields || []).map(f => ({
      fieldId: f.fieldId,
      label: f.label,
      type: 'custom',
    }));

    res.json({
      success: true,
      data: {
        eventTitle: event.title,
        fields: [...defaultFields, ...customFields],
        totalRegistrations: event.registeredCount,
      },
    });
  } catch (error) {
    console.error('Get export fields error:', error);
    res.status(500).json({ success: false, message: 'Failed to load export fields' });
  }
};

// ============================================================
// ANALYTICS
// ============================================================

/**
 * GET /api/contributor/analytics
 * Full analytics for contributor dashboard
 */
export const getAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;

    const [events, posts] = await Promise.all([
      Event.find({ createdBy: userId }).sort({ createdAt: -1 }).lean(),
      Post.find({ createdBy: userId }).sort({ createdAt: -1 }).lean(),
    ]);

    // Summary cards
    const totalEvents = events.length;
    const totalRegistrations = events.reduce((sum, e) => sum + (e.registeredCount || 0), 0);
    const totalPostLikes = posts.reduce((sum, p) => sum + (p.likesCount || 0), 0);
    const fullEventsCount = events.filter(e => e.status === 'full').length;

    // Bar chart: registrations per event
    const registrationsPerEvent = events
      .filter(e => e.status !== 'cancelled')
      .map(e => ({
        _id: e._id,
        title: e.title,
        registeredCount: e.registeredCount,
        totalSeats: e.totalSeats,
        percentage: e.totalSeats != null && e.totalSeats > 0
          ? Math.round((e.registeredCount / e.totalSeats) * 100)
          : null,
      }));

    // Post engagement table
    const postEngagement = await Promise.all(
      posts.map(async (p) => {
        const commentsCount = await Comment.countDocuments({ post: p._id });
        return {
          _id: p._id,
          title: p.title,
          likesCount: p.likesCount,
          commentsCount,
          createdAt: p.createdAt,
        };
      })
    );

    // Events by category breakdown
    const categoryBreakdown = events.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        summary: {
          totalEvents,
          totalRegistrations,
          totalPostLikes,
          fullEventsCount,
        },
        registrationsPerEvent,
        postEngagement,
        categoryBreakdown,
      },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to load analytics' });
  }
};
