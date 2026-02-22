import User from '../models/User.js';
import College from '../models/College.js';
import OTP from '../models/OTP.js';

// ==================== OVERVIEW / ANALYTICS ====================

// GET /api/admin/stats — Dashboard overview statistics
export const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      activeUsers,
      deactivatedUsers,
      newToday,
      newThisWeek,
      newThisMonth,
      totalContributors,
      pendingApplications,
      totalColleges,
      usersByCollege,
      usersByBranch,
      usersByYear,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: false }),
      User.countDocuments({ createdAt: { $gte: todayStart } }),
      User.countDocuments({ createdAt: { $gte: weekStart } }),
      User.countDocuments({ createdAt: { $gte: monthStart } }),
      User.countDocuments({ role: 'contributor' }),
      User.countDocuments({ contributorStatus: 'pending' }),
      College.countDocuments(),
      User.aggregate([
        { $group: { _id: '$college', count: { $sum: 1 } } },
        { $lookup: { from: 'colleges', localField: '_id', foreignField: '_id', as: 'collegeInfo' } },
        { $unwind: { path: '$collegeInfo', preserveNullAndEmptyArrays: true } },
        { $project: { name: { $ifNull: ['$collegeInfo.name', 'Unknown'] }, count: 1 } },
        { $sort: { count: -1 } },
      ]),
      User.aggregate([
        { $group: { _id: '$branch', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      User.aggregate([
        { $match: { currentYear: { $exists: true, $ne: null } } },
        { $group: { _id: '$currentYear', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          activeUsers,
          deactivatedUsers,
          newToday,
          newThisWeek,
          newThisMonth,
          totalContributors,
          pendingApplications,
          totalColleges,
        },
        charts: {
          usersByCollege,
          usersByBranch,
          usersByYear,
        },
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard stats' });
  }
};

// ==================== USER MANAGEMENT ====================

// GET /api/admin/users — List all users with filters
export const getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      college,
      branch,
      year,
      role,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const filter = {};

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
      ];
    }
    if (college) filter.college = college;
    if (branch) filter.branch = branch;
    if (year) filter.currentYear = Number(year);
    if (role) filter.role = role;
    if (status === 'active') filter.isActive = true;
    if (status === 'inactive') filter.isActive = false;

    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password -__v')
        .populate('college', 'name abbreviation')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          current: Number(page),
          total: Math.ceil(total / Number(limit)),
          count: total,
          perPage: Number(limit),
        },
      },
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
};

// GET /api/admin/users/:id — Get single user details
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -__v')
      .populate('college', 'name emailDomain location abbreviation website')
      .populate('contributorReviewedBy', 'fullName email');

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch user' });
  }
};

// PUT /api/admin/users/:id/role — Change user role
export const changeUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['student', 'contributor', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Invalid role' });
    }

    // Prevent admin from changing their own role
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, error: 'Cannot change your own role' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // If promoting to contributor, update contributorStatus
    if (role === 'contributor') {
      user.contributorStatus = 'approved';
      user.contributorReviewedAt = new Date();
      user.contributorReviewedBy = req.user._id;
    } else if (role === 'student' && user.role === 'contributor') {
      user.contributorStatus = 'none';
    }

    user.role = role;
    await user.save();

    res.json({
      success: true,
      message: `User role changed to ${role}`,
      data: { role: user.role },
    });
  } catch (error) {
    console.error('Change user role error:', error);
    res.status(500).json({ success: false, error: 'Failed to change user role' });
  }
};

// PUT /api/admin/users/:id/status — Activate/Deactivate user
export const toggleUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;

    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, error: 'Cannot deactivate your own account' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: !!isActive },
      { new: true }
    ).select('-password -__v');

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: { isActive: user.isActive },
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({ success: false, error: 'Failed to update user status' });
  }
};

// DELETE /api/admin/users/:id — Delete a user
export const deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, error: 'Cannot delete your own account' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ success: false, error: 'Cannot delete another admin' });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete user' });
  }
};

// ==================== CONTRIBUTOR VERIFICATION ====================

// GET /api/admin/contributors — Get all contributor applications
export const getContributorApplications = async (req, res) => {
  try {
    const { status = 'pending' } = req.query;

    const filter = {};
    if (status === 'all') {
      filter.contributorStatus = { $ne: 'none' };
    } else if (status === 'expired') {
      filter.contributorStatus = 'expired';
    } else {
      filter.contributorStatus = status;
    }

    const applications = await User.find(filter)
      .select('-password -__v')
      .populate('college', 'name abbreviation emailDomain location')
      .populate('contributorReviewedBy', 'fullName email')
      .sort({ contributorRequestedAt: -1 });

    const currentYear = new Date().getFullYear();

    // Enrich each application
    const enrichedApplications = await Promise.all(
      applications.map(async (app) => {
        const appObj = app.toObject();

        // Check if contributor is in their last/graduation year
        if (app.graduationYear) {
          appObj.isLastYear = app.graduationYear <= currentYear;
        }

        // For pending applications, check if college already has a contributor
        if (app.contributorStatus === 'pending' && app.college) {
          const existingContributor = await User.findOne({
            college: app.college._id || app.college,
            role: 'contributor',
            isActive: true,
            _id: { $ne: app._id },
          }).select('fullName email studentId');
          appObj.collegeHasContributor = !!existingContributor;
          appObj.existingContributor = existingContributor || null;
        }
        return appObj;
      })
    );

    res.json({ success: true, data: enrichedApplications });
  } catch (error) {
    console.error('Get contributor applications error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch applications' });
  }
};

// PUT /api/admin/contributors/:id/approve — Approve contributor
export const approveContributor = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.contributorStatus !== 'pending') {
      return res.status(400).json({ success: false, error: 'No pending application for this user' });
    }

    user.role = 'contributor';
    user.contributorStatus = 'approved';
    user.contributorReviewedAt = new Date();
    user.contributorReviewedBy = req.user._id;
    await user.save();

    res.json({
      success: true,
      message: `${user.fullName} has been approved as a contributor`,
    });
  } catch (error) {
    console.error('Approve contributor error:', error);
    res.status(500).json({ success: false, error: 'Failed to approve contributor' });
  }
};

// PUT /api/admin/contributors/:id/reject — Reject contributor
export const rejectContributor = async (req, res) => {
  try {
    const { reason, allowReapply } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.contributorStatus !== 'pending') {
      return res.status(400).json({ success: false, error: 'No pending application for this user' });
    }

    user.contributorStatus = 'rejected';
    user.contributorRejectionReason = reason || 'Application rejected by admin';
    user.contributorCanReapply = allowReapply !== false; // default true unless explicitly set false
    user.contributorReviewedAt = new Date();
    user.contributorReviewedBy = req.user._id;
    await user.save();

    res.json({
      success: true,
      message: `${user.fullName}'s application has been rejected`,
    });
  } catch (error) {
    console.error('Reject contributor error:', error);
    res.status(500).json({ success: false, error: 'Failed to reject contributor' });
  }
};

// PUT /api/admin/contributors/:id/revoke — Revoke contributor role
export const revokeContributor = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.role !== 'contributor') {
      return res.status(400).json({ success: false, error: 'User is not a contributor' });
    }

    user.role = 'student';
    user.contributorStatus = 'none';
    user.contributorReviewedAt = new Date();
    user.contributorReviewedBy = req.user._id;
    await user.save();

    res.json({
      success: true,
      message: `${user.fullName}'s contributor role has been revoked`,
    });
  } catch (error) {
    console.error('Revoke contributor error:', error);
    res.status(500).json({ success: false, error: 'Failed to revoke contributor' });
  }
};

// PUT /api/admin/contributors/:id/expire — Expire contributor (last year / graduated)
export const expireContributor = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.role !== 'contributor') {
      return res.status(400).json({ success: false, error: 'User is not a contributor' });
    }

    // Expire: revert to student, mark as expired (cannot re-apply)
    user.role = 'student';
    user.contributorStatus = 'expired';
    user.contributorExpired = true;
    user.contributorReviewedAt = new Date();
    user.contributorReviewedBy = req.user._id;
    await user.save();

    // TODO: When posts/events models exist, remove them here:
    // await Post.deleteMany({ author: user._id });
    // await Event.deleteMany({ organizer: user._id });

    res.json({
      success: true,
      message: `${user.fullName}'s contributor role has expired. Posts and events will be removed upon implementation.`,
    });
  } catch (error) {
    console.error('Expire contributor error:', error);
    res.status(500).json({ success: false, error: 'Failed to expire contributor' });
  }
};

// ==================== COLLEGE MANAGEMENT ====================

// POST /api/admin/colleges — Add new college
export const addCollege = async (req, res) => {
  try {
    const { name, emailDomain, location, website, abbreviation } = req.body;

    if (!name || !emailDomain) {
      return res.status(400).json({ success: false, error: 'College name and email domain are required' });
    }

    const existing = await College.findOne({
      $or: [{ name }, { emailDomain: emailDomain.toLowerCase() }],
    });
    if (existing) {
      return res.status(400).json({ success: false, error: 'College with this name or email domain already exists' });
    }

    const college = await College.create({
      name,
      emailDomain: emailDomain.toLowerCase(),
      location: location || '',
      website: website || '',
      abbreviation: abbreviation || '',
      addedBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'College added successfully',
      data: college,
    });
  } catch (error) {
    console.error('Add college error:', error);
    res.status(500).json({ success: false, error: 'Failed to add college' });
  }
};

// PUT /api/admin/colleges/:id — Update college
export const updateCollege = async (req, res) => {
  try {
    const { name, emailDomain, location, website, abbreviation } = req.body;

    const college = await College.findById(req.params.id);
    if (!college) {
      return res.status(404).json({ success: false, error: 'College not found' });
    }

    // Check for duplicates (excluding current)
    if (name || emailDomain) {
      const duplicate = await College.findOne({
        _id: { $ne: req.params.id },
        $or: [
          ...(name ? [{ name }] : []),
          ...(emailDomain ? [{ emailDomain: emailDomain.toLowerCase() }] : []),
        ],
      });
      if (duplicate) {
        return res.status(400).json({ success: false, error: 'Another college with this name or domain already exists' });
      }
    }

    if (name) college.name = name;
    if (emailDomain) college.emailDomain = emailDomain.toLowerCase();
    if (location !== undefined) college.location = location;
    if (website !== undefined) college.website = website;
    if (abbreviation !== undefined) college.abbreviation = abbreviation;
    college.updatedAt = new Date();

    await college.save();

    res.json({
      success: true,
      message: 'College updated successfully',
      data: college,
    });
  } catch (error) {
    console.error('Update college error:', error);
    res.status(500).json({ success: false, error: 'Failed to update college' });
  }
};

// DELETE /api/admin/colleges/:id — Delete college
export const deleteCollege = async (req, res) => {
  try {
    const college = await College.findById(req.params.id);
    if (!college) {
      return res.status(404).json({ success: false, error: 'College not found' });
    }

    // Check if students are linked to this college
    const linkedStudents = await User.countDocuments({ college: req.params.id });
    if (linkedStudents > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete: ${linkedStudents} student(s) are registered under this college`,
      });
    }

    await College.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'College deleted successfully' });
  } catch (error) {
    console.error('Delete college error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete college' });
  }
};

// GET /api/admin/colleges — Get all colleges with student counts
export const getCollegesWithStats = async (req, res) => {
  try {
    const colleges = await College.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'college',
          as: 'students',
        },
      },
      {
        $addFields: {
          studentCount: { $size: '$students' },
          contributorCount: {
            $size: {
              $filter: {
                input: '$students',
                cond: { $eq: ['$$this.role', 'contributor'] },
              },
            },
          },
          hasContributor: {
            $gt: [
              {
                $size: {
                  $filter: {
                    input: '$students',
                    cond: { $and: [{ $eq: ['$$this.role', 'contributor'] }, { $eq: ['$$this.isActive', true] }] },
                  },
                },
              },
              0,
            ],
          },
        },
      },
      {
        $project: {
          students: 0,
        },
      },
      { $sort: { name: 1 } },
    ]);

    res.json({ success: true, data: colleges });
  } catch (error) {
    console.error('Get colleges with stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch colleges' });
  }
};

// ==================== ENROLLMENT MONITOR ====================

// GET /api/admin/enrollments — Search enrollments
export const searchEnrollments = async (req, res) => {
  try {
    const { search = '', college } = req.query;

    const filter = {};
    if (search) {
      filter.studentId = { $regex: search, $options: 'i' };
    }
    if (college) {
      filter.college = college;
    }

    const users = await User.find(filter)
      .select('fullName email studentId college branch currentYear isActive role createdAt')
      .populate('college', 'name abbreviation')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Search enrollments error:', error);
    res.status(500).json({ success: false, error: 'Failed to search enrollments' });
  }
};

// ==================== REPORTS & LOGS ====================

// GET /api/admin/reports/registrations — Recent registrations
export const getRecentRegistrations = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));

    const registrations = await User.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const recentUsers = await User.find({ createdAt: { $gte: startDate } })
      .select('fullName email college branch createdAt role isActive')
      .populate('college', 'name abbreviation')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      data: {
        chart: registrations,
        recent: recentUsers,
      },
    });
  } catch (error) {
    console.error('Recent registrations error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch registration data' });
  }
};

// GET /api/admin/reports/otp-stats — OTP usage statistics
export const getOTPStats = async (req, res) => {
  try {
    const now = new Date();
    const activeOTPs = await OTP.countDocuments({ expiresAt: { $gt: now } });
    const expiredOTPs = await OTP.countDocuments({ expiresAt: { $lte: now } });
    const totalOTPs = await OTP.countDocuments();

    res.json({
      success: true,
      data: {
        active: activeOTPs,
        expired: expiredOTPs,
        total: totalOTPs,
      },
    });
  } catch (error) {
    console.error('OTP stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch OTP stats' });
  }
};
