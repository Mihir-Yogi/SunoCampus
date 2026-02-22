import User from '../models/User.js';
import College from '../models/College.js';
import bcrypt from 'bcryptjs';
import { validatePasswordStrength } from '../utils/validators.js';

// GET /api/profile — fetch authenticated user's full profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -__v')
      .populate('college', 'name emailDomain location abbreviation website');

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({
      success: true,
      data: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        avatar: user.avatar || null,
        bio: user.bio || '',
        location: user.location || '',
        degreeProgram: user.degreeProgram || '',
        academicInterests: user.academicInterests || '',
        college: user.college,
        collegeName: user.collegeName || user.college?.name || '',
        studentId: user.studentId || '',
        branch: user.branch || '',
        graduationYear: user.graduationYear || null,
        currentYear: user.currentYear || null,
        role: user.role,
        contributorStatus: user.contributorStatus || 'none',
        contributorReason: user.contributorReason || '',
        contributorDocument: user.contributorDocument || null,
        contributorDocumentName: user.contributorDocumentName || null,
        contributorRejectionReason: user.contributorRejectionReason || null,
        contributorExpired: user.contributorExpired || false,
        contributorCanReapply: user.contributorCanReapply !== false,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, error: 'Server error fetching profile' });
  }
};

// PUT /api/profile — update profile (academic details & personal info)
export const updateProfile = async (req, res) => {
  try {
    // Whitelist of fields that can be updated
    const allowedFields = [
      'fullName',
      'phone',
      'bio',
      'location',
      'degreeProgram',
      'academicInterests',
      'studentId',
      'branch',
      'graduationYear',
      'currentYear',
      'gender',
      'dateOfBirth',
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, error: 'No valid fields to update' });
    }

    // Sanitize string inputs
    for (const key of Object.keys(updates)) {
      if (typeof updates[key] === 'string') {
        updates[key] = updates[key].trim();
      }
    }

    // Validation
    if (updates.fullName !== undefined && updates.fullName.trim().length < 2) {
      return res.status(400).json({ success: false, error: 'Full name must be at least 2 characters' });
    }

    if (updates.graduationYear !== undefined) {
      const year = Number(updates.graduationYear);
      if (isNaN(year) || year < 2020 || year > 2035) {
        return res.status(400).json({ success: false, error: 'Invalid graduation year' });
      }
      updates.graduationYear = year;
    }

    if (updates.bio !== undefined && updates.bio.length > 500) {
      return res.status(400).json({ success: false, error: 'Bio must be under 500 characters' });
    }

    if (updates.academicInterests !== undefined && updates.academicInterests.length > 500) {
      return res.status(400).json({ success: false, error: 'Academic interests must be under 500 characters' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .select('-password -__v')
      .populate('college', 'name emailDomain location abbreviation website');

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        avatar: user.avatar || null,
        bio: user.bio || '',
        location: user.location || '',
        degreeProgram: user.degreeProgram || '',
        academicInterests: user.academicInterests || '',
        college: user.college,
        collegeName: user.collegeName || user.college?.name || '',
        studentId: user.studentId || '',
        branch: user.branch || '',
        graduationYear: user.graduationYear || null,
        currentYear: user.currentYear || null,
        role: user.role,
        contributorStatus: user.contributorStatus || 'none',
        isVerified: user.isVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, error: 'Server error updating profile' });
  }
};

// PUT /api/profile/password — change password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({ success: false, error: 'All password fields are required' });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ success: false, error: 'New passwords do not match' });
    }

    if (!validatePasswordStrength(newPassword)) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters with uppercase, lowercase, number, and symbol',
      });
    }

    // Fetch user with password
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Current password is incorrect' });
    }

    // Hash new password & save
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, error: 'Server error changing password' });
  }
};

// POST /api/profile/apply-contributor — request contributor role
export const applyContributor = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.role === 'contributor') {
      return res.status(400).json({ success: false, error: 'You are already a contributor' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ success: false, error: 'Admins cannot apply for contributor role' });
    }

    if (user.contributorExpired) {
      return res.status(400).json({ success: false, error: 'Your contributor role has expired. You are no longer eligible to apply.' });
    }

    if (user.contributorStatus === 'rejected' && !user.contributorCanReapply) {
      return res.status(400).json({ success: false, error: 'Your previous application was rejected and re-application is not allowed.' });
    }

    if (user.contributorStatus === 'pending') {
      return res.status(400).json({ success: false, error: 'Your application is already pending review' });
    }

    // Check if the user's college already has an active contributor
    const existingContributor = await User.findOne({
      college: user.college,
      role: 'contributor',
      isActive: true,
      _id: { $ne: user._id },
    });

    if (existingContributor) {
      return res.status(400).json({ success: false, error: 'Your college already has an active contributor. You can apply once the position becomes available.' });
    }

    // Require document upload
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please upload a college document (ID card, bonafide certificate, etc.)' });
    }

    const { reason } = req.body;
    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({ success: false, error: 'Please provide a reason (at least 10 characters)' });
    }

    user.contributorStatus = 'pending';
    user.contributorRequestedAt = new Date();
    user.contributorReason = reason.trim();
    user.contributorDocument = `/uploads/documents/${req.file.filename}`;
    user.contributorDocumentName = req.file.originalname;
    user.contributorRejectionReason = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Contributor application submitted successfully',
      data: { contributorStatus: 'pending' },
    });
  } catch (error) {
    console.error('Apply contributor error:', error);
    res.status(500).json({ success: false, error: 'Server error submitting application' });
  }
};

// GET /api/profile/college-contributor — Check if user's college already has an active contributor
export const checkCollegeContributor = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const existingContributor = await User.findOne({
      college: user.college,
      role: 'contributor',
      isActive: true,
      _id: { $ne: user._id },
    }).select('fullName');

    res.json({
      success: true,
      data: {
        hasContributor: !!existingContributor,
        contributorName: existingContributor?.fullName || null,
      },
    });
  } catch (error) {
    console.error('Check college contributor error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// DELETE /api/profile — deactivate account
export const deactivateAccount = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, error: 'Password required to deactivate account' });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Incorrect password' });
    }

    user.isActive = false;
    await user.save();

    res.json({ success: true, message: 'Account deactivated successfully' });
  } catch (error) {
    console.error('Deactivate account error:', error);
    res.status(500).json({ success: false, error: 'Server error deactivating account' });
  }
};
