import Report from '../models/Report.js';
import User from '../models/User.js';
import Post from '../models/Post.js';
import Event from '../models/Event.js';

// ==================== USER-FACING ====================

// POST /api/reports — Submit a new report
export const createReport = async (req, res) => {
  try {
    const { reportType, reportedUser, reportedContentId, category, description } = req.body;

    if (!reportType || !reportedUser || !category || !description) {
      return res.status(400).json({ error: 'reportType, reportedUser, category, and description are required' });
    }

    if (description.length < 10) {
      return res.status(400).json({ error: 'Description must be at least 10 characters' });
    }

    // Can't report yourself
    if (reportedUser === req.user._id.toString()) {
      return res.status(400).json({ error: 'You cannot report yourself' });
    }

    // Verify reported user exists
    const targetUser = await User.findById(reportedUser);
    if (!targetUser) {
      return res.status(404).json({ error: 'Reported user not found' });
    }

    // Prevent duplicate reports (same reporter + same target + same category within 24h)
    const recentDuplicate = await Report.findOne({
      reportedBy: req.user._id,
      reportedUser,
      category,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });

    if (recentDuplicate) {
      return res.status(429).json({ error: 'You have already submitted a similar report recently. Please wait before reporting again.' });
    }

    const report = await Report.create({
      reportedBy: req.user._id,
      reportType,
      reportedUser,
      reportedContentId: reportedContentId || null,
      category,
      description,
    });

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully. Our team will review it shortly.',
      data: { reportId: report._id },
    });
  } catch (err) {
    console.error('Create report error:', err);
    res.status(500).json({ error: 'Failed to submit report' });
  }
};

// GET /api/reports/my — Get current user's submitted reports
export const getMyReports = async (req, res) => {
  try {
    const reports = await Report.find({ reportedBy: req.user._id })
      .populate('reportedUser', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ success: true, data: reports });
  } catch (err) {
    console.error('Get my reports error:', err);
    res.status(500).json({ error: 'Failed to fetch your reports' });
  }
};

// ==================== ADMIN-FACING ====================

// GET /api/admin/reports — List all reports with filters
export const getReports = async (req, res) => {
  try {
    const { status, category, reportType, page = 1 } = req.query;
    const limit = 20;
    const filter = {};

    if (status && status !== 'all') filter.status = status;
    if (category && category !== 'all') filter.category = category;
    if (reportType && reportType !== 'all') filter.reportType = reportType;

    const [reports, total] = await Promise.all([
      Report.find(filter)
        .populate('reportedBy', 'fullName email studentId')
        .populate('reportedUser', 'fullName email studentId college branch isActive')
        .populate('reviewedBy', 'fullName')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Report.countDocuments(filter),
    ]);

    // Populate college name for reported users
    await User.populate(reports, {
      path: 'reportedUser.college',
      select: 'name abbreviation',
    });

    res.json({
      success: true,
      data: {
        reports,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: total,
        },
      },
    });
  } catch (err) {
    console.error('Get reports error:', err);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
};

// GET /api/admin/reports/stats — Report statistics
export const getReportStats = async (req, res) => {
  try {
    const [statusCounts, categoryCounts, totalReports, recentReports] = await Promise.all([
      Report.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Report.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Report.countDocuments(),
      Report.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }),
    ]);

    const byStatus = {};
    statusCounts.forEach(s => { byStatus[s._id] = s.count; });

    res.json({
      success: true,
      data: {
        total: totalReports,
        pending: byStatus.pending || 0,
        reviewing: byStatus.reviewing || 0,
        resolved: byStatus.resolved || 0,
        dismissed: byStatus.dismissed || 0,
        recentWeek: recentReports,
        byCategory: categoryCounts,
      },
    });
  } catch (err) {
    console.error('Get report stats error:', err);
    res.status(500).json({ error: 'Failed to fetch report stats' });
  }
};

// GET /api/admin/reports/:id — Single report detail
export const getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('reportedBy', 'fullName email studentId phone college branch currentYear')
      .populate('reportedUser', 'fullName email studentId phone college branch currentYear isActive role createdAt')
      .populate('reviewedBy', 'fullName email');

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Populate college names
    await User.populate(report, [
      { path: 'reportedBy.college', select: 'name abbreviation' },
      { path: 'reportedUser.college', select: 'name abbreviation' },
    ]);

    res.json({ success: true, data: report });
  } catch (err) {
    console.error('Get report by ID error:', err);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
};

// PUT /api/admin/reports/:id/review — Mark as reviewing + add notes
export const reviewReport = async (req, res) => {
  try {
    const { adminNotes } = req.body;

    const report = await Report.findByIdAndUpdate(
      req.params.id,
      {
        status: 'reviewing',
        adminNotes: adminNotes || '',
        reviewedBy: req.user._id,
      },
      { new: true }
    );

    if (!report) return res.status(404).json({ error: 'Report not found' });

    res.json({ success: true, message: 'Report marked as under review', data: report });
  } catch (err) {
    console.error('Review report error:', err);
    res.status(500).json({ error: 'Failed to update report' });
  }
};

// PUT /api/admin/reports/:id/resolve — Resolve with action
export const resolveReport = async (req, res) => {
  try {
    const { actionTaken, adminNotes } = req.body;

    if (!actionTaken) {
      return res.status(400).json({ error: 'actionTaken is required' });
    }

    const report = await Report.findByIdAndUpdate(
      req.params.id,
      {
        status: 'resolved',
        actionTaken,
        adminNotes: adminNotes || '',
        reviewedBy: req.user._id,
        reviewedAt: new Date(),
      },
      { new: true }
    );

    if (!report) return res.status(404).json({ error: 'Report not found' });

    // If action is to deactivate the user, do it
    if (actionTaken === 'user_deactivated' || actionTaken === 'user_banned') {
      await User.findByIdAndUpdate(report.reportedUser, { isActive: false });
    }

    // If action is to block the user
    if (actionTaken === 'user_blocked') {
      await User.findByIdAndUpdate(report.reportedUser, { isBlocked: true });
    }

    // If action is to block the reported content
    if (actionTaken === 'content_blocked' && report.reportedContentId) {
      if (report.reportType === 'post') {
        await Post.findByIdAndUpdate(report.reportedContentId, { isBlocked: true });
      } else if (report.reportType === 'event') {
        await Event.findByIdAndUpdate(report.reportedContentId, { isBlocked: true });
      }
    }

    res.json({ success: true, message: 'Report resolved', data: report });
  } catch (err) {
    console.error('Resolve report error:', err);
    res.status(500).json({ error: 'Failed to resolve report' });
  }
};

// PUT /api/admin/reports/:id/dismiss — Dismiss report
export const dismissReport = async (req, res) => {
  try {
    const { adminNotes } = req.body;

    const report = await Report.findByIdAndUpdate(
      req.params.id,
      {
        status: 'dismissed',
        actionTaken: 'no_action_needed',
        adminNotes: adminNotes || '',
        reviewedBy: req.user._id,
        reviewedAt: new Date(),
      },
      { new: true }
    );

    if (!report) return res.status(404).json({ error: 'Report not found' });

    res.json({ success: true, message: 'Report dismissed', data: report });
  } catch (err) {
    console.error('Dismiss report error:', err);
    res.status(500).json({ error: 'Failed to dismiss report' });
  }
};
