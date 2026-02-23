import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Toast } from '../components/Toast';
import api from '../services/api';

const Profile = ({ onLogout, onRoleSync }) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('academic');
  const [editMode, setEditMode] = useState(false);
  const [toast, setToast] = useState(null);

  // Academic Details form
  const [academicForm, setAcademicForm] = useState({
    collegeName: '',
    degreeProgram: '',
    graduationYear: '',
    studentId: '',
    academicInterests: '',
  });

  // Account Settings form
  const [accountForm, setAccountForm] = useState({
    fullName: '',
    phone: '',
    gender: '',
    dateOfBirth: '',
    location: '',
    bio: '',
  });

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [applyingContributor, setApplyingContributor] = useState(false);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [contributorReason, setContributorReason] = useState('');
  const [contributorDoc, setContributorDoc] = useState(null);
  const [collegeHasContributor, setCollegeHasContributor] = useState(false);
  const [collegeContributorName, setCollegeContributorName] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
  };

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/profile');
      const data = res.data.data;
      setProfile(data);

      // Sync role to localStorage if it changed (e.g. contributor approved)
      try {
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (data.role && storedUser.role !== data.role) {
          storedUser.role = data.role;
          localStorage.setItem('user', JSON.stringify(storedUser));
          // Notify App to update navbar/routes
          if (onRoleSync) onRoleSync();
        }
      } catch { /* ignore */ }

      // Check if college already has an active contributor
      try {
        const ccRes = await api.get('/profile/college-contributor');
        setCollegeHasContributor(ccRes.data.data.hasContributor);
        setCollegeContributorName(ccRes.data.data.contributorName);
      } catch {
        // Non-critical, default to false
      }

      setAcademicForm({
        collegeName: data.college?.name || data.collegeName || '',
        degreeProgram: data.degreeProgram || '',
        graduationYear: data.graduationYear || '',
        studentId: data.studentId || '',
        academicInterests: data.academicInterests || '',
      });

      setAccountForm({
        fullName: data.fullName || '',
        phone: data.phone || '',
        gender: data.gender || '',
        dateOfBirth: data.dateOfBirth ? data.dateOfBirth.split('T')[0] : '',
        location: data.location || '',
        bio: data.bio || '',
      });
    } catch (err) {
      console.error('Fetch profile error:', err);
      if (err.response?.status === 401) {
        navigate('/login');
      } else {
        showToast('error', 'Failed to load profile');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, onRoleSync]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSaveAcademic = async () => {
    try {
      setSaving(true);
      await api.put('/profile', {
        degreeProgram: academicForm.degreeProgram,
        graduationYear: academicForm.graduationYear,
        studentId: academicForm.studentId,
        academicInterests: academicForm.academicInterests,
      });
      showToast('success', 'Academic details saved successfully');
      await fetchProfile();
      setEditMode(false);
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAccount = async () => {
    try {
      setSaving(true);
      await api.put('/profile', {
        fullName: accountForm.fullName,
        phone: accountForm.phone,
        gender: accountForm.gender,
        dateOfBirth: accountForm.dateOfBirth,
        location: accountForm.location,
        bio: accountForm.bio,
      });
      showToast('success', 'Account settings saved successfully');

      // Update localStorage user data
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      userData.fullName = accountForm.fullName;
      localStorage.setItem('user', JSON.stringify(userData));

      await fetchProfile();
      setEditMode(false);
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      showToast('error', 'New passwords do not match');
      return;
    }
    try {
      setChangingPassword(true);
      await api.put('/profile/password', passwordForm);
      showToast('success', 'Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleApplyContributor = async () => {
    if (!contributorDoc) {
      showToast('error', 'Please upload a verification document');
      return;
    }
    if (!contributorReason || contributorReason.trim().length < 10) {
      showToast('error', 'Please provide a reason (at least 10 characters)');
      return;
    }
    try {
      setApplyingContributor(true);
      const formData = new FormData();
      formData.append('document', contributorDoc);
      formData.append('reason', contributorReason.trim());
      await api.post('/profile/apply-contributor', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showToast('success', 'Contributor application submitted!');
      setShowApplyForm(false);
      setContributorReason('');
      setContributorDoc(null);
      await fetchProfile();
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Failed to submit application');
    } finally {
      setApplyingContributor(false);
    }
  };

  // Build initials from full name
  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Compute display year label
  const getYearLabel = () => {
    if (!profile) return '';
    if (profile.currentYear) return `Year ${profile.currentYear}`;
    if (profile.graduationYear) {
      const now = new Date().getFullYear();
      const diff = profile.graduationYear - now;
      if (diff > 0 && diff <= 6) return `Year ${5 - diff > 0 ? 5 - diff : 1}`;
    }
    return '';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-700 rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-500 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Could not load profile.</p>
          <button onClick={() => navigate('/login')} className="mt-4 text-blue-600 hover:underline">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const collegeName = profile.college?.name || profile.collegeName || 'Unknown College';
  const collegeLocation = profile.college?.location || profile.location || '';

  return (
    <div className="min-h-screen bg-gray-50">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* ───── Header Banner ───── */}
      <div className="bg-gradient-to-r from-[#1e3a5f] to-[#3b6ea5] h-44 relative" />

      {/* ───── Avatar + Name row ───── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-20 relative z-10">
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4">
          {/* Avatar */}
          <div className="w-28 h-28 rounded-full border-4 border-white bg-white shadow-lg flex items-center justify-center overflow-hidden flex-shrink-0">
            {profile.avatar ? (
              <img src={profile.avatar} alt={profile.fullName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#0a1628] to-[#1a2d4d] flex items-center justify-center">
                <span className="text-white text-3xl font-bold">{getInitials(profile.fullName)}</span>
              </div>
            )}
          </div>

          {/* Name & subtitle */}
          <div className="flex-1 text-center sm:text-left mb-2">
            <h1 className="text-2xl font-bold text-gray-900">{profile.fullName}</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {profile.branch && <span>{profile.branch}</span>}
              {profile.branch && getYearLabel() && ', '}
              {getYearLabel()}
            </p>
          </div>

          {/* Edit Profile & Logout buttons */}
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => setEditMode(!editMode)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 shadow-sm ${
                editMode
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  : 'bg-[#0f1f3d] text-white hover:bg-[#1a2d4d]'
              }`}
            >
              {editMode ? 'Cancel Editing' : 'Edit Profile'}
            </button>
            <button
              onClick={() => {
                if (onLogout) onLogout();
                navigate('/');
              }}
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-all duration-200 shadow-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* ───── Main Grid ───── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-8 pb-16 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── LEFT SIDEBAR ── */}
        <div className="space-y-6">
          {/* About Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">About</h2>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start gap-3">
                <svg className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-2 0a2 2 0 01-2 2H7a2 2 0 01-2-2m0 0H3" />
                </svg>
                <span>{collegeName}</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="break-all">{profile.email}</span>
              </li>
              {profile.phone && (
                <li className="flex items-start gap-3">
                  <svg className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>{profile.phone}</span>
                </li>
              )}
              {collegeLocation && (
                <li className="flex items-start gap-3">
                  <svg className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{collegeLocation}</span>
                </li>
              )}
            </ul>

            {/* Roles */}
            <div className="mt-5 pt-4 border-t border-gray-100">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Roles</h3>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-200 capitalize">
                  {profile.role}
                </span>
                {profile.isVerified && (
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-50 text-green-700 border border-green-200">
                    Verified
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Last-Year Warning for Active Contributors */}
          {profile.role === 'contributor' && profile.graduationYear && profile.graduationYear <= new Date().getFullYear() && (
            <div className="bg-amber-50 rounded-xl shadow-sm border border-amber-200 p-5">
              <div className="flex items-center gap-2 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
                <h3 className="font-semibold text-amber-800">Last Year Notice</h3>
              </div>
              <p className="text-sm text-amber-700">
                This is your final year as a contributor. Your contributor role will expire after graduation.
                Thank you for your service to the college!
              </p>
            </div>
          )}

          {/* Become a Contributor Card — hidden if expired or college already has one */}
          {profile.role === 'student' && !profile.contributorExpired && !collegeHasContributor && profile.contributorStatus !== 'expired' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-amber-500 text-lg">💡</span>
                <h3 className="font-semibold text-gray-900">Become a Contributor</h3>
              </div>
              <p className="text-sm text-gray-600 mb-1">
                Represent your college by managing official posts and events.
              </p>
              <p className="text-xs text-gray-400 mb-4">
                Only one active contributor is allowed per college. As a contributor, you get elevated privileges to
                post on behalf of your institution.
              </p>

              {profile.contributorStatus === 'none' && !showApplyForm && (
                <button
                  onClick={() => setShowApplyForm(true)}
                  className="w-full py-2.5 rounded-lg text-sm font-semibold border-2 border-amber-400 text-amber-700 hover:bg-amber-50 transition-colors"
                >
                  Apply for Role
                </button>
              )}

              {(profile.contributorStatus === 'none' || (profile.contributorStatus === 'rejected' && profile.contributorCanReapply)) && showApplyForm && (
                <div className="space-y-3">
                  {/* Document Upload */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Verification Document <span className="text-red-500">*</span></label>
                    <p className="text-xs text-gray-400 mb-2">Upload your college ID card, bonafide certificate, or any official document (JPG, PNG, PDF — max 5MB)</p>
                    <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-amber-400 hover:bg-amber-50/30 transition-colors">
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={(e) => setContributorDoc(e.target.files[0] || null)}
                        className="hidden"
                      />
                      {contributorDoc ? (
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                          </svg>
                          <span className="truncate max-w-[200px]">{contributorDoc.name}</span>
                          <button type="button" onClick={(e) => { e.preventDefault(); setContributorDoc(null); }} className="ml-1 text-gray-400 hover:text-red-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-gray-400">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                          </svg>
                          <span className="text-xs">Click to upload document</span>
                        </div>
                      )}
                    </label>
                  </div>

                  {/* Reason */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Why do you want to be a contributor? <span className="text-red-500">*</span></label>
                    <textarea
                      value={contributorReason}
                      onChange={(e) => setContributorReason(e.target.value)}
                      placeholder="Describe why you'd like to represent your college..."
                      rows={3}
                      maxLength={500}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none resize-none transition-colors"
                    />
                    <p className="text-xs text-gray-400 mt-1 text-right">{contributorReason.length} / 500</p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={handleApplyContributor}
                      disabled={applyingContributor}
                      className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-50"
                    >
                      {applyingContributor ? 'Submitting...' : 'Submit Application'}
                    </button>
                    <button
                      onClick={() => { setShowApplyForm(false); setContributorDoc(null); setContributorReason(''); }}
                      className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {profile.contributorStatus === 'pending' && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                    <span className="text-sm font-semibold text-amber-800">Request Pending</span>
                  </div>
                  <p className="text-xs text-amber-700">Your contributor request is in the pending phase. An admin will review your application and document shortly.</p>
                </div>
              )}

              {profile.contributorStatus === 'rejected' && !showApplyForm && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                    <span className="text-sm font-semibold text-red-700">Application Not Approved</span>
                  </div>
                  <p className="text-xs text-red-600 mb-2">
                    {profile.contributorRejectionReason || 'Unfortunately, your contributor application was not approved by the admin.'}
                  </p>
                  {profile.contributorCanReapply ? (
                    <button
                      onClick={() => setShowApplyForm(true)}
                      className="w-full py-2 rounded-lg text-sm font-semibold border-2 border-amber-400 text-amber-700 hover:bg-amber-50 transition-colors"
                    >
                      Re-apply for Contributor
                    </button>
                  ) : (
                    <p className="text-xs text-red-500 font-medium mt-1">You are not eligible to re-apply for the contributor role.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── RIGHT CONTENT ── */}
        <div className="lg:col-span-2">
          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="flex border-b border-gray-100">
              <button
                onClick={() => setActiveTab('academic')}
                className={`flex-1 sm:flex-none px-6 py-3.5 text-sm font-medium transition-colors relative ${
                  activeTab === 'academic'
                    ? 'text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Academic Details
                {activeTab === 'academic' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-700 rounded-t" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex-1 sm:flex-none px-6 py-3.5 text-sm font-medium transition-colors relative ${
                  activeTab === 'settings'
                    ? 'text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Account Settings
                {activeTab === 'settings' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-700 rounded-t" />
                )}
              </button>
            </div>

            <div className="p-6">
              {/* ── Academic Details Tab ── */}
              {activeTab === 'academic' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* University/College — read only */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">University/College</label>
                      <input
                        type="text"
                        value={academicForm.collegeName}
                        disabled
                        className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-600 text-sm"
                      />
                    </div>

                    {/* Degree Program */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Degree Program</label>
                      <input
                        type="text"
                        value={academicForm.degreeProgram}
                        onChange={(e) => setAcademicForm({ ...academicForm, degreeProgram: e.target.value })}
                        disabled={!editMode}
                        placeholder="e.g. B.S. Computer Science"
                        className={`w-full px-3.5 py-2.5 rounded-lg border text-sm transition-colors ${
                          editMode
                            ? 'border-gray-300 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none'
                            : 'border-gray-200 bg-gray-50 text-gray-600'
                        }`}
                      />
                    </div>

                    {/* Graduation Year */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Graduation Year</label>
                      <input
                        type="number"
                        value={academicForm.graduationYear}
                        onChange={(e) => setAcademicForm({ ...academicForm, graduationYear: e.target.value })}
                        disabled={!editMode}
                        placeholder="2027"
                        min={2020}
                        max={2035}
                        className={`w-full px-3.5 py-2.5 rounded-lg border text-sm transition-colors ${
                          editMode
                            ? 'border-gray-300 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none'
                            : 'border-gray-200 bg-gray-50 text-gray-600'
                        }`}
                      />
                    </div>

                    {/* Student ID */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Student ID (Optional)</label>
                      <input
                        type="text"
                        value={academicForm.studentId}
                        onChange={(e) => setAcademicForm({ ...academicForm, studentId: e.target.value })}
                        disabled={!editMode}
                        placeholder="Enter ID"
                        className={`w-full px-3.5 py-2.5 rounded-lg border text-sm transition-colors ${
                          editMode
                            ? 'border-gray-300 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none'
                            : 'border-gray-200 bg-gray-50 text-gray-600'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Bio / Academic Interests */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio / Academic Interests</label>
                    <textarea
                      rows={3}
                      value={academicForm.academicInterests}
                      onChange={(e) => setAcademicForm({ ...academicForm, academicInterests: e.target.value })}
                      disabled={!editMode}
                      placeholder="Passionate about artificial intelligence and sustainable tech solutions..."
                      maxLength={500}
                      className={`w-full px-3.5 py-2.5 rounded-lg border text-sm resize-none transition-colors ${
                        editMode
                          ? 'border-gray-300 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none'
                          : 'border-gray-200 bg-gray-50 text-gray-600'
                      }`}
                    />
                    {editMode && (
                      <p className="text-xs text-gray-400 mt-1 text-right">
                        {academicForm.academicInterests.length}/500
                      </p>
                    )}
                  </div>

                  {/* Save Button */}
                  {editMode && (
                    <div className="flex justify-end">
                      <button
                        onClick={handleSaveAcademic}
                        disabled={saving}
                        className="px-6 py-2.5 bg-[#0f1f3d] text-white text-sm font-semibold rounded-lg hover:bg-[#1a2d4d] transition-colors disabled:opacity-50 shadow-sm"
                      >
                        {saving ? (
                          <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Saving...
                          </span>
                        ) : (
                          'Save Changes'
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ── Account Settings Tab ── */}
              {activeTab === 'settings' && (
                <div className="space-y-8">
                  {/* Personal Information Section */}
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-4">Personal Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                        <input
                          type="text"
                          value={accountForm.fullName}
                          onChange={(e) => setAccountForm({ ...accountForm, fullName: e.target.value })}
                          disabled={!editMode}
                          className={`w-full px-3.5 py-2.5 rounded-lg border text-sm transition-colors ${
                            editMode
                              ? 'border-gray-300 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none'
                              : 'border-gray-200 bg-gray-50 text-gray-600'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                        <input
                          type="email"
                          value={profile.email}
                          disabled
                          className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 text-sm cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                        <input
                          type="text"
                          value={accountForm.phone}
                          onChange={(e) => setAccountForm({ ...accountForm, phone: e.target.value })}
                          disabled={!editMode}
                          className={`w-full px-3.5 py-2.5 rounded-lg border text-sm transition-colors ${
                            editMode
                              ? 'border-gray-300 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none'
                              : 'border-gray-200 bg-gray-50 text-gray-600'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Gender</label>
                        <select
                          value={accountForm.gender}
                          onChange={(e) => setAccountForm({ ...accountForm, gender: e.target.value })}
                          disabled={!editMode}
                          className={`w-full px-3.5 py-2.5 rounded-lg border text-sm transition-colors ${
                            editMode
                              ? 'border-gray-300 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none'
                              : 'border-gray-200 bg-gray-50 text-gray-600'
                          }`}
                        >
                          <option value="">Select</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Date of Birth</label>
                        <input
                          type="date"
                          value={accountForm.dateOfBirth}
                          onChange={(e) => setAccountForm({ ...accountForm, dateOfBirth: e.target.value })}
                          disabled={!editMode}
                          className={`w-full px-3.5 py-2.5 rounded-lg border text-sm transition-colors ${
                            editMode
                              ? 'border-gray-300 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none'
                              : 'border-gray-200 bg-gray-50 text-gray-600'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Location</label>
                        <input
                          type="text"
                          value={accountForm.location}
                          onChange={(e) => setAccountForm({ ...accountForm, location: e.target.value })}
                          disabled={!editMode}
                          placeholder="City, Country"
                          className={`w-full px-3.5 py-2.5 rounded-lg border text-sm transition-colors ${
                            editMode
                              ? 'border-gray-300 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none'
                              : 'border-gray-200 bg-gray-50 text-gray-600'
                          }`}
                        />
                      </div>
                    </div>

                    {editMode && (
                      <div className="flex justify-end mt-5">
                        <button
                          onClick={handleSaveAccount}
                          disabled={saving}
                          className="px-6 py-2.5 bg-[#0f1f3d] text-white text-sm font-semibold rounded-lg hover:bg-[#1a2d4d] transition-colors disabled:opacity-50 shadow-sm"
                        >
                          {saving ? (
                            <span className="flex items-center gap-2">
                              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Saving...
                            </span>
                          ) : (
                            'Save Changes'
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Divider */}
                  <hr className="border-gray-200" />

                  {/* Change Password Section */}
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-4">Change Password</h3>
                    <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Password</label>
                        <input
                          type="password"
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                          required
                          className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 bg-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                        <input
                          type="password"
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                          required
                          minLength={8}
                          className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 bg-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
                        <input
                          type="password"
                          value={passwordForm.confirmNewPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirmNewPassword: e.target.value })}
                          required
                          minLength={8}
                          className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 bg-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={changingPassword}
                        className="px-6 py-2.5 bg-[#0f1f3d] text-white text-sm font-semibold rounded-lg hover:bg-[#1a2d4d] transition-colors disabled:opacity-50 shadow-sm"
                      >
                        {changingPassword ? 'Updating...' : 'Update Password'}
                      </button>
                    </form>
                  </div>

                  {/* Divider */}
                  <hr className="border-gray-200" />

                  {/* Danger Zone */}
                  <div>
                    <h3 className="text-base font-semibold text-red-600 mb-2">Danger Zone</h3>
                    <p className="text-sm text-gray-500 mb-3">
                      Deactivating your account will make it inaccessible. This action requires your password.
                    </p>
                    <button
                      onClick={async () => {
                        const pwd = prompt('Enter your password to confirm account deactivation:');
                        if (!pwd) return;
                        try {
                          await api.delete('/profile', { data: { password: pwd } });
                          showToast('success', 'Account deactivated');
                          localStorage.removeItem('token');
                          localStorage.removeItem('user');
                          setTimeout(() => (window.location.href = '/'), 1500);
                        } catch (err) {
                          showToast('error', err.response?.data?.error || 'Failed to deactivate account');
                        }
                      }}
                      className="px-5 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Deactivate Account
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
