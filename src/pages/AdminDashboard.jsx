import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import Toast from '../components/Toast';
import {
  HiOutlineChartBar,
  HiOutlineUsers,
  HiOutlineCheckBadge,
  HiOutlineBuildingOffice2,
  HiOutlineMagnifyingGlass,
  HiOutlineFlag,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineStar,
  HiOutlineClock,
  HiOutlineEye,
  HiOutlineTrash,
  HiOutlineExclamationTriangle,
  HiOutlineXMark,
  HiOutlineCheck,
  HiOutlineMapPin,
  HiOutlinePencilSquare,
  HiOutlineArrowDownTray,
  HiOutlinePlusCircle,
  HiOutlineNoSymbol,
  HiOutlineHandRaised,
  HiOutlineDocumentMagnifyingGlass,
  HiOutlineAcademicCap,
} from 'react-icons/hi2';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ==================== SIDEBAR ====================
const sidebarItems = [
  { key: 'overview', label: 'Overview', icon: <HiOutlineChartBar size={20} /> },
  { key: 'users', label: 'Users', icon: <HiOutlineUsers size={20} /> },
  { key: 'contributors', label: 'Contributors', icon: <HiOutlineCheckBadge size={20} /> },
  { key: 'colleges', label: 'Colleges', icon: <HiOutlineBuildingOffice2 size={20} /> },
  { key: 'enrollments', label: 'Enrollments', icon: <HiOutlineMagnifyingGlass size={20} /> },
  { key: 'reports', label: 'Reports', icon: <HiOutlineFlag size={20} /> },
];

// ==================== STAT CARD ====================
const StatCard = ({ label, value, color = 'blue', icon }) => (
  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className={`text-3xl font-bold text-${color}-600 mt-1`}>{value}</p>
      </div>
      <div className={`text-${color}-400`}>{icon}</div>
    </div>
  </div>
);

// ==================== MAIN COMPONENT ====================
const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [toasts, setToasts] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data states
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState({ users: [], pagination: {} });
  const [contributors, setContributors] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [reports, setReports] = useState({ reports: [], pagination: {} });
  const [reportStats, setReportStats] = useState(null);
  const [loading, setLoading] = useState(false);

  // Filter states
  const [userFilters, setUserFilters] = useState({ search: '', role: '', status: '', page: 1 });
  const [contributorFilter, setContributorFilter] = useState('pending');
  const [enrollmentSearch, setEnrollmentSearch] = useState('');
  const [reportFilters, setReportFilters] = useState({ status: 'pending', category: 'all', page: 1 });

  // Modal states
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedContributor, setSelectedContributor] = useState(null);
  const [collegeModal, setCollegeModal] = useState({ open: false, editing: null });
  const [collegeForm, setCollegeForm] = useState({ name: '', emailDomain: '', location: '', website: '', abbreviation: '' });
  const [rejectModal, setRejectModal] = useState({ open: false, userId: null });
  const [rejectReason, setRejectReason] = useState('');
  const [rejectAllowReapply, setRejectAllowReapply] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [resolveModal, setResolveModal] = useState({ open: false, reportId: null });
  const [resolveForm, setResolveForm] = useState({ actionTaken: '', adminNotes: '' });

  const addToast = (type, message) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  // ==================== DATA FETCHING ====================

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data.data);
    } catch (err) {
      addToast('error', 'Failed to fetch stats');
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (userFilters.search) params.append('search', userFilters.search);
      if (userFilters.role) params.append('role', userFilters.role);
      if (userFilters.status) params.append('status', userFilters.status);
      params.append('page', userFilters.page);
      const res = await api.get(`/admin/users?${params}`);
      setUsers(res.data.data);
    } catch (err) {
      addToast('error', 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [userFilters]);

  const fetchContributors = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/contributors?status=${contributorFilter}`);
      setContributors(res.data.data);
    } catch (err) {
      addToast('error', 'Failed to fetch contributors');
    } finally {
      setLoading(false);
    }
  }, [contributorFilter]);

  const fetchColleges = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/colleges');
      setColleges(res.data.data);
    } catch (err) {
      addToast('error', 'Failed to fetch colleges');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEnrollments = useCallback(async () => {
    try {
      setLoading(true);
      const params = enrollmentSearch ? `?search=${enrollmentSearch}` : '';
      const res = await api.get(`/admin/enrollments${params}`);
      setEnrollments(res.data.data);
    } catch (err) {
      addToast('error', 'Failed to fetch enrollments');
    } finally {
      setLoading(false);
    }
  }, [enrollmentSearch]);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (reportFilters.status && reportFilters.status !== 'all') params.append('status', reportFilters.status);
      if (reportFilters.category && reportFilters.category !== 'all') params.append('category', reportFilters.category);
      params.append('page', reportFilters.page);
      const [reportsRes, statsRes] = await Promise.all([
        api.get(`/admin/reports?${params}`),
        api.get('/admin/reports/stats'),
      ]);
      setReports(reportsRes.data.data);
      setReportStats(statsRes.data.data);
    } catch (err) {
      addToast('error', 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  }, [reportFilters]);

  // Fetch data when tab changes
  useEffect(() => {
    switch (activeTab) {
      case 'overview': fetchStats(); break;
      case 'users': fetchUsers(); break;
      case 'contributors': fetchContributors(); break;
      case 'colleges': fetchColleges(); break;
      case 'enrollments': fetchEnrollments(); break;
      case 'reports': fetchReports(); break;
    }
  }, [activeTab, fetchStats, fetchUsers, fetchContributors, fetchColleges, fetchEnrollments, fetchReports]);

  // ==================== ACTION HANDLERS ====================

  const handleChangeRole = async (userId, role) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role });
      addToast('success', `Role changed to ${role}`);
      fetchUsers();
      if (activeTab === 'overview') fetchStats();
    } catch (err) {
      addToast('error', err.response?.data?.error || 'Failed to change role');
    }
  };

  const handleToggleStatus = async (userId, isActive) => {
    try {
      await api.put(`/admin/users/${userId}/status`, { isActive });
      addToast('success', `User ${isActive ? 'activated' : 'deactivated'}`);
      fetchUsers();
    } catch (err) {
      addToast('error', err.response?.data?.error || 'Failed to update status');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This cannot be undone.')) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      addToast('success', 'User deleted');
      fetchUsers();
      if (activeTab === 'overview') fetchStats();
    } catch (err) {
      addToast('error', err.response?.data?.error || 'Failed to delete user');
    }
  };

  const handleApproveContributor = async (userId) => {
    try {
      await api.put(`/admin/contributors/${userId}/approve`);
      addToast('success', 'Contributor approved');
      setSelectedContributor(null);
      fetchContributors();
      if (activeTab === 'overview') fetchStats();
    } catch (err) {
      addToast('error', err.response?.data?.error || 'Failed to approve');
    }
  };

  const handleRejectContributor = async () => {
    try {
      await api.put(`/admin/contributors/${rejectModal.userId}/reject`, { reason: rejectReason, allowReapply: rejectAllowReapply });
      addToast('success', 'Application rejected');
      setRejectModal({ open: false, userId: null });
      setRejectReason('');
      setRejectAllowReapply(true);
      setSelectedContributor(null);
      fetchContributors();
    } catch (err) {
      addToast('error', err.response?.data?.error || 'Failed to reject');
    }
  };

  const handleRevokeContributor = async (userId) => {
    if (!window.confirm('Revoke contributor role? This user will become a regular student.')) return;
    try {
      await api.put(`/admin/contributors/${userId}/revoke`);
      addToast('success', 'Contributor role revoked');
      fetchContributors();
      fetchUsers();
    } catch (err) {
      addToast('error', err.response?.data?.error || 'Failed to revoke');
    }
  };

  const handleExpireContributor = async (userId) => {
    if (!window.confirm('Expire this contributor? Their role will revert to student and posts/events will be removed upon confirmation.')) return;
    try {
      await api.put(`/admin/contributors/${userId}/expire`);
      addToast('success', 'Contributor expired successfully');
      fetchContributors();
      fetchUsers();
      if (activeTab === 'overview') fetchStats();
    } catch (err) {
      addToast('error', err.response?.data?.error || 'Failed to expire contributor');
    }
  };

  const handleSaveCollege = async () => {
    try {
      if (collegeModal.editing) {
        await api.put(`/admin/colleges/${collegeModal.editing}`, collegeForm);
        addToast('success', 'College updated');
      } else {
        await api.post('/admin/colleges', collegeForm);
        addToast('success', 'College added');
      }
      setCollegeModal({ open: false, editing: null });
      setCollegeForm({ name: '', emailDomain: '', location: '', website: '', abbreviation: '' });
      fetchColleges();
    } catch (err) {
      addToast('error', err.response?.data?.error || 'Failed to save college');
    }
  };

  const handleDeleteCollege = async (id) => {
    if (!window.confirm('Delete this college? This only works if no students are linked.')) return;
    try {
      await api.delete(`/admin/colleges/${id}`);
      addToast('success', 'College deleted');
      fetchColleges();
    } catch (err) {
      addToast('error', err.response?.data?.error || 'Failed to delete college');
    }
  };

  const openEditCollege = (college) => {
    setCollegeForm({
      name: college.name,
      emailDomain: college.emailDomain,
      location: college.location || '',
      website: college.website || '',
      abbreviation: college.abbreviation || '',
    });
    setCollegeModal({ open: true, editing: college._id });
  };

  // ==================== REPORT ACTION HANDLERS ====================

  const handleReviewReport = async (reportId) => {
    try {
      await api.put(`/admin/reports/${reportId}/review`);
      addToast('success', 'Report marked as under review');
      fetchReports();
    } catch (err) {
      addToast('error', err.response?.data?.error || 'Failed to update report');
    }
  };

  const handleResolveReport = async () => {
    try {
      await api.put(`/admin/reports/${resolveModal.reportId}/resolve`, resolveForm);
      addToast('success', 'Report resolved');
      setResolveModal({ open: false, reportId: null });
      setResolveForm({ actionTaken: '', adminNotes: '' });
      setSelectedReport(null);
      fetchReports();
    } catch (err) {
      addToast('error', err.response?.data?.error || 'Failed to resolve report');
    }
  };

  const handleDismissReport = async (reportId) => {
    if (!window.confirm('Dismiss this report? No action will be taken.')) return;
    try {
      await api.put(`/admin/reports/${reportId}/dismiss`);
      addToast('success', 'Report dismissed');
      setSelectedReport(null);
      fetchReports();
    } catch (err) {
      addToast('error', err.response?.data?.error || 'Failed to dismiss report');
    }
  };

  // ==================== RENDER SECTIONS ====================

  const renderOverview = () => {
    if (!stats) return <div className="text-center py-12 text-gray-500">Loading stats...</div>;
    const { overview, charts } = stats;

    return (
      <div className="space-y-8">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>

        {/* Primary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard label="Total Users" value={overview.totalUsers} color="blue" icon={<HiOutlineUsers size={32} />} />
          <StatCard label="Active Users" value={overview.activeUsers} color="green" icon={<HiOutlineCheckCircle size={32} />} />
          <StatCard label="Contributors" value={overview.totalContributors} color="purple" icon={<HiOutlineStar size={32} />} />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard label="Total Colleges" value={overview.totalColleges || charts.usersByCollege.length} color="indigo" icon={<HiOutlineAcademicCap size={32} />} />
          <StatCard label="Pending Applications" value={overview.pendingApplications} color="amber" icon={<HiOutlineClock size={32} />} />
          <StatCard label="Deactivated Users" value={overview.deactivatedUsers} color="red" icon={<HiOutlineXCircle size={32} />} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Users by College */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Users by College</h3>
            {charts.usersByCollege.length === 0 ? (
              <p className="text-gray-500 text-sm">No data yet</p>
            ) : (
              <div className="space-y-3">
                {charts.usersByCollege.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 truncate flex-1">{item.name}</span>
                    <div className="flex items-center gap-3 ml-4">
                      <div className="w-32 bg-gray-100 rounded-full h-2.5">
                        <div
                          className="bg-blue-500 h-2.5 rounded-full"
                          style={{ width: `${Math.min((item.count / (charts.usersByCollege[0]?.count || 1)) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-900 w-8 text-right">{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Users by Branch */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Users by Branch</h3>
            {charts.usersByBranch.length === 0 ? (
              <p className="text-gray-500 text-sm">No data yet</p>
            ) : (
              <div className="space-y-3">
                {charts.usersByBranch.map((item, i) => {
                  const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-cyan-500', 'bg-pink-500', 'bg-red-500'];
                  return (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 truncate flex-1">{item._id || 'Unknown'}</span>
                      <div className="flex items-center gap-3 ml-4">
                        <div className="w-32 bg-gray-100 rounded-full h-2.5">
                          <div
                            className={`${colors[i % colors.length]} h-2.5 rounded-full`}
                            style={{ width: `${Math.min((item.count / (charts.usersByBranch[0]?.count || 1)) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-900 w-8 text-right">{item.count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setActiveTab('contributors')} className="px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors text-sm font-medium inline-flex items-center gap-1.5">
              <HiOutlineClock size={16} /> Review Applications ({overview.pendingApplications})
            </button>
            <button onClick={() => setActiveTab('users')} className="px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium inline-flex items-center gap-1.5">
              <HiOutlineUsers size={16} /> Manage Users
            </button>
            <button onClick={() => { setActiveTab('colleges'); setCollegeModal({ open: true, editing: null }); }} className="px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium inline-flex items-center gap-1.5">
              <HiOutlinePlusCircle size={16} /> Add College
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderUsers = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
        <span className="text-sm text-gray-500">{users.pagination.count || 0} total users</span>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <input
          type="text"
          placeholder="Search name, email, enrollment..."
          value={userFilters.search}
          onChange={(e) => setUserFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
          className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white"
        />
        <select
          value={userFilters.role}
          onChange={(e) => setUserFilters(prev => ({ ...prev, role: e.target.value, page: 1 }))}
          className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 text-sm focus:outline-none focus:border-blue-500 bg-white"
        >
          <option value="">All Roles</option>
          <option value="student">Student</option>
          <option value="contributor">Contributor</option>
          <option value="admin">Admin</option>
        </select>
        <select
          value={userFilters.status}
          onChange={(e) => setUserFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
          className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 text-sm focus:outline-none focus:border-blue-500 bg-white"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Deactivated</option>
        </select>
        <button
          onClick={() => setUserFilters({ search: '', role: '', status: '', page: 1 })}
          className="px-4 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Clear Filters
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase hidden md:table-cell">College</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase hidden lg:table-cell">Enrollment</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase hidden sm:table-cell">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
              ) : users.users.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No users found</td></tr>
              ) : (
                users.users.map(user => (
                  <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{user.fullName}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-sm text-gray-700">{user.college?.abbreviation || user.college?.name || '—'}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm text-gray-600 font-mono">{user.studentId || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={user.role}
                        onChange={(e) => handleChangeRole(user._id, e.target.value)}
                        className={`text-xs font-semibold px-2 py-1 rounded-lg border-0 cursor-pointer ${
                          user.role === 'admin' ? 'bg-red-100 text-red-700' :
                          user.role === 'contributor' ? 'bg-purple-100 text-purple-700' :
                          'bg-blue-100 text-blue-700'
                        }`}
                      >
                        <option value="student">Student</option>
                        <option value="contributor">Contributor</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <button
                        onClick={() => handleToggleStatus(user._id, !user.isActive)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          user.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'
                        } transition-colors`}
                      >
                        {user.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <HiOutlineEye size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user._id)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete User"
                        >
                          <HiOutlineTrash size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {users.pagination.total > 1 && (
          <div className="px-4 py-3 bg-gray-50 border-t flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Page {users.pagination.current} of {users.pagination.total}
            </span>
            <div className="flex gap-2">
              <button
                disabled={users.pagination.current <= 1}
                onClick={() => setUserFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                disabled={users.pagination.current >= users.pagination.total}
                onClick={() => setUserFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedUser(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">User Details</h3>
              <button onClick={() => setSelectedUser(null)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">✕</button>
            </div>
            <div className="space-y-3">
              {[
                ['Name', selectedUser.fullName],
                ['Email', selectedUser.email],
                ['Phone', selectedUser.phone],
                ['Gender', selectedUser.gender],
                ['DOB', selectedUser.dateOfBirth ? new Date(selectedUser.dateOfBirth).toLocaleDateString() : '—'],
                ['College', selectedUser.college?.name || '—'],
                ['Enrollment', selectedUser.studentId],
                ['Branch', selectedUser.branch],
                ['Year', selectedUser.currentYear ? `${selectedUser.currentYear}${['st','nd','rd','th'][selectedUser.currentYear-1]} Year` : '—'],
                ['Graduation', selectedUser.graduationYear || '—'],
                ['Role', selectedUser.role],
                ['Status', selectedUser.isActive ? 'Active' : 'Deactivated'],
                ['Joined', new Date(selectedUser.createdAt).toLocaleDateString()],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">{label}</span>
                  <span className="text-sm font-medium text-gray-900">{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderContributors = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Contributor Verification</h2>
        <div className="flex gap-2">
          {['pending', 'approved', 'rejected', 'expired', 'all'].map(status => (
            <button
              key={status}
              onClick={() => setContributorFilter(status)}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                contributorFilter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading applications...</div>
      ) : contributors.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-200 text-center">
          <p className="text-gray-500 text-lg">No {contributorFilter} applications</p>
        </div>
      ) : (
        <div className="space-y-4">
          {contributors.map(app => (
            <div key={app._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* College Warning */}
              {app.collegeHasContributor && (
                <div className="px-5 py-3 bg-amber-50 border-b border-amber-200">
                  <p className="text-sm text-amber-800 font-medium">
                    <HiOutlineExclamationTriangle size={16} className="inline mr-1 flex-shrink-0" /> {app.college?.name} already has an active contributor: {app.existingContributor?.fullName} ({app.existingContributor?.studentId})
                  </p>
                </div>
              )}

              <div className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{app.fullName}</h3>
                    <p className="text-sm text-gray-500">{app.email}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {app.college?.name || '—'} • {app.branch} • {app.studentId}
                      {app.graduationYear && <span className="text-gray-400"> • Grad: {app.graduationYear}</span>}
                    </p>
                    {app.isLastYear && app.contributorStatus === 'approved' && (
                      <p className="text-xs text-amber-600 font-semibold mt-1 flex items-center gap-1">
                        <HiOutlineExclamationTriangle size={14} className="inline" /> Last year — eligible for expiration
                      </p>
                    )}
                    {app.contributorRequestedAt && (
                      <p className="text-xs text-gray-400 mt-1">
                        Applied: {new Date(app.contributorRequestedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                      app.contributorStatus === 'pending' ? 'bg-amber-100 text-amber-700' :
                      app.contributorStatus === 'approved' ? 'bg-green-100 text-green-700' :
                      app.contributorStatus === 'expired' ? 'bg-slate-100 text-slate-600' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {app.contributorStatus}
                    </span>

                    {app.contributorStatus === 'pending' && (
                      <button
                        onClick={() => setSelectedContributor(app)}
                        className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        Review
                      </button>
                    )}

                    {app.contributorStatus === 'approved' && (
                      <>
                        <button
                          onClick={() => handleExpireContributor(app._id)}
                          className="px-3 py-1.5 text-sm bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors font-medium"
                        >
                          Expire
                        </button>
                        <button
                          onClick={() => handleRevokeContributor(app._id)}
                          className="px-3 py-1.5 text-sm bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors font-medium"
                        >
                          Revoke
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {app.contributorRejectionReason && app.contributorStatus === 'rejected' && (
                  <div className="mt-3 p-3 bg-red-50 rounded-lg">
                    <p className="text-sm text-red-700"><strong>Rejection Reason:</strong> {app.contributorRejectionReason}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Contributor Review Modal — Split Screen */}
      {selectedContributor && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedContributor(null)}>
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Review Application</h3>
              <button onClick={() => setSelectedContributor(null)} className="p-1 hover:bg-gray-200 rounded-lg transition-colors text-lg">✕</button>
            </div>

            {/* College Warning */}
            {selectedContributor.collegeHasContributor && (
              <div className="px-6 py-3 bg-amber-50 border-b border-amber-200">
                <p className="text-sm text-amber-800 font-medium">
                  <HiOutlineExclamationTriangle size={16} className="inline mr-1 flex-shrink-0" /> {selectedContributor.college?.name} already has a contributor: {selectedContributor.existingContributor?.fullName}
                </p>
              </div>
            )}

            {/* Split View */}
            <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-gray-200 overflow-y-auto max-h-[calc(90vh-140px)]">
              {/* Left: Student Info */}
              <div className="flex-1 p-6">
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Student Information</h4>
                <div className="space-y-3">
                  {[
                    ['Name', selectedContributor.fullName],
                    ['Email', selectedContributor.email],
                    ['Phone', selectedContributor.phone],
                    ['College', selectedContributor.college?.name || '—'],
                    ['Enrollment', selectedContributor.studentId],
                    ['Branch', selectedContributor.branch],
                    ['Year', selectedContributor.currentYear ? `${selectedContributor.currentYear}${['st','nd','rd','th'][selectedContributor.currentYear-1]} Year` : '—'],
                    ['Joined', new Date(selectedContributor.createdAt).toLocaleDateString()],
                  ].map(([label, val]) => (
                    <div key={label} className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-500">{label}</span>
                      <span className="text-sm font-medium text-gray-900">{val}</span>
                    </div>
                  ))}
                </div>

                {selectedContributor.contributorReason && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-600 font-semibold uppercase mb-1">Reason for Applying</p>
                    <p className="text-sm text-blue-900">{selectedContributor.contributorReason}</p>
                  </div>
                )}
              </div>

              {/* Right: Uploaded Document */}
              <div className="flex-1 p-6">
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Uploaded Document</h4>
                {selectedContributor.contributorDocument ? (
                  <div className="space-y-3">
                    <p className="text-xs text-gray-500">
                      File: {selectedContributor.contributorDocumentName || 'Document'}
                    </p>
                    {selectedContributor.contributorDocument.match(/\.(jpg|jpeg|png)$/i) ? (
                      <img
                        src={`${API_BASE}${selectedContributor.contributorDocument}`}
                        alt="Contributor Document"
                        className="w-full rounded-lg border border-gray-200 shadow-sm"
                      />
                    ) : (
                      <iframe
                        src={`${API_BASE}${selectedContributor.contributorDocument}`}
                        className="w-full h-96 rounded-lg border border-gray-200"
                        title="Document Preview"
                      />
                    )}
                    <a
                      href={`${API_BASE}${selectedContributor.contributorDocument}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      <HiOutlineArrowDownTray size={16} /> Download / Open Full Size
                    </a>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <p className="text-gray-400">No document uploaded</p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setSelectedContributor(null)}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => { setRejectModal({ open: true, userId: selectedContributor._id }); }}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium inline-flex items-center gap-1.5"
              >
                <HiOutlineXMark size={16} /> Reject
              </button>
              <button
                onClick={() => handleApproveContributor(selectedContributor._id)}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium inline-flex items-center gap-1.5"
              >
                <HiOutlineCheck size={16} /> Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={() => { setRejectModal({ open: false, userId: null }); setRejectAllowReapply(true); }}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Rejection Reason</h3>
            <div className="space-y-3 mb-4">
              <button
                onClick={() => setRejectReason('Your college already has an active contributor.')}
                className={`w-full text-left px-4 py-2.5 text-sm rounded-lg border transition-colors ${
                  rejectReason === 'Your college already has an active contributor.'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Your college already has an active contributor.
              </button>
              <button
                onClick={() => setRejectReason('The uploaded document could not be verified.')}
                className={`w-full text-left px-4 py-2.5 text-sm rounded-lg border transition-colors ${
                  rejectReason === 'The uploaded document could not be verified.'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                The uploaded document could not be verified.
              </button>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Or enter a custom reason..."
                rows={3}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 resize-none"
              />
            </div>

            {/* Allow Re-application Toggle */}
            <div className="mb-5 p-3 rounded-lg bg-gray-50 border border-gray-200">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-sm font-medium text-gray-800">Allow re-application</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {rejectAllowReapply
                      ? 'Student can apply again for contributor role'
                      : 'Student will be permanently blocked from applying'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setRejectAllowReapply(!rejectAllowReapply)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    rejectAllowReapply ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      rejectAllowReapply ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </label>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setRejectModal({ open: false, userId: null }); setRejectReason(''); setRejectAllowReapply(true); }}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectContributor}
                disabled={!rejectReason.trim()}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderColleges = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">College Management</h2>
        <button
          onClick={() => { setCollegeForm({ name: '', emailDomain: '', location: '', website: '', abbreviation: '' }); setCollegeModal({ open: true, editing: null }); }}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          + Add College
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading colleges...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {colleges.map(college => (
            <div key={college._id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{college.name}</h3>
                    {college.abbreviation && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{college.abbreviation}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">@{college.emailDomain}</p>
                  {college.location && <p className="text-sm text-gray-500 flex items-center gap-1"><HiOutlineMapPin size={14} /> {college.location}</p>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEditCollege(college)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit"><HiOutlinePencilSquare size={18} /></button>
                  <button onClick={() => handleDeleteCollege(college._id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><HiOutlineTrash size={18} /></button>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-500">Students:</span>
                  <span className="text-sm font-bold text-blue-600">{college.studentCount}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-500">Contributors:</span>
                  <span className="text-sm font-bold text-purple-600">{college.contributorCount}</span>
                </div>
                {college.hasContributor && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Has Contributor</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit College Modal */}
      {collegeModal.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setCollegeModal({ open: false, editing: null })}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {collegeModal.editing ? 'Edit College' : 'Add New College'}
            </h3>
            <div className="space-y-4">
              {[
                { label: 'College Name *', key: 'name', placeholder: 'e.g., Guru Nanak University' },
                { label: 'Email Domain *', key: 'emailDomain', placeholder: 'e.g., gnu.ac.in' },
                { label: 'Location', key: 'location', placeholder: 'e.g., Hyderabad, India' },
                { label: 'Website', key: 'website', placeholder: 'e.g., https://gnu.ac.in' },
                { label: 'Abbreviation', key: 'abbreviation', placeholder: 'e.g., GNU' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input
                    type="text"
                    value={collegeForm[key]}
                    onChange={(e) => setCollegeForm(prev => ({ ...prev, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setCollegeModal({ open: false, editing: null })}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCollege}
                disabled={!collegeForm.name || !collegeForm.emailDomain}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {collegeModal.editing ? 'Update' : 'Add College'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderEnrollments = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Enrollment Monitor</h2>

      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Search by enrollment number..."
          value={enrollmentSearch}
          onChange={(e) => setEnrollmentSearch(e.target.value)}
          className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white"
        />
        <button
          onClick={fetchEnrollments}
          className="px-5 py-2.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Search
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Enrollment</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase hidden md:table-cell">College</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase hidden lg:table-cell">Branch</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase hidden sm:table-cell">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
              ) : enrollments.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No enrollments found</td></tr>
              ) : (
                enrollments.map(user => (
                  <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono text-gray-900">{user.studentId}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-sm text-gray-700">{user.college?.abbreviation || user.college?.name || '—'}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm text-gray-600">{user.branch}</span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        user.role === 'contributor' ? 'bg-purple-100 text-purple-700' :
                        user.role === 'admin' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>{user.role}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>{user.isActive ? 'Active' : 'Inactive'}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const CATEGORY_LABELS = {
    spam: 'Spam',
    harassment: 'Harassment',
    inappropriate_content: 'Inappropriate Content',
    broken_link: 'Broken Link',
    misinformation: 'Misinformation',
    impersonation: 'Impersonation',
    hate_speech: 'Hate Speech',
    privacy_violation: 'Privacy Violation',
    other: 'Other',
  };

  const ACTION_LABELS = {
    none: 'None',
    warning_issued: 'Warning Issued',
    content_removed: 'Content Removed',
    user_deactivated: 'User Deactivated',
    user_banned: 'User Banned',
    no_action_needed: 'No Action Needed',
  };

  const STATUS_STYLES = {
    pending: 'bg-amber-100 text-amber-700',
    reviewing: 'bg-blue-100 text-blue-700',
    resolved: 'bg-green-100 text-green-700',
    dismissed: 'bg-gray-100 text-gray-600',
  };

  const renderReports = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Reports & Moderation</h2>
        <span className="text-sm text-gray-500">{reports.pagination?.count || 0} total reports</span>
      </div>

      {/* Stats Cards */}
      {reportStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Pending" value={reportStats.pending} color="amber" icon={<HiOutlineExclamationTriangle size={28} />} />
          <StatCard label="Reviewing" value={reportStats.reviewing} color="blue" icon={<HiOutlineDocumentMagnifyingGlass size={28} />} />
          <StatCard label="Resolved" value={reportStats.resolved} color="green" icon={<HiOutlineCheckCircle size={28} />} />
          <StatCard label="This Week" value={reportStats.recentWeek} color="indigo" icon={<HiOutlineFlag size={28} />} />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={reportFilters.status}
          onChange={(e) => setReportFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
          className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 text-sm focus:outline-none focus:border-blue-500 bg-white"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="reviewing">Reviewing</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>
        <select
          value={reportFilters.category}
          onChange={(e) => setReportFilters(prev => ({ ...prev, category: e.target.value, page: 1 }))}
          className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 text-sm focus:outline-none focus:border-blue-500 bg-white"
        >
          <option value="all">All Categories</option>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <button
          onClick={() => setReportFilters({ status: 'pending', category: 'all', page: 1 })}
          className="px-4 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading reports...</div>
      ) : reports.reports?.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-200 text-center">
          <HiOutlineFlag size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 text-lg">No {reportFilters.status !== 'all' ? reportFilters.status : ''} reports found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.reports.map(report => (
            <div key={report._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  {/* Report Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${STATUS_STYLES[report.status]}`}>
                        {report.status}
                      </span>
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                        {CATEGORY_LABELS[report.category] || report.category}
                      </span>
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-600 capitalize">
                        {report.reportType}
                      </span>
                    </div>

                    <p className="text-sm text-gray-800 line-clamp-2 mb-2">{report.description}</p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span>Reported by: <strong className="text-gray-700">{report.reportedBy?.fullName || 'Unknown'}</strong></span>
                      <span>Against: <strong className="text-gray-700">{report.reportedUser?.fullName || 'Unknown'}</strong></span>
                      <span>{new Date(report.createdAt).toLocaleDateString()} at {new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    {report.actionTaken && report.actionTaken !== 'none' && (
                      <p className="text-xs text-green-700 mt-1.5">Action: {ACTION_LABELS[report.actionTaken]}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => setSelectedReport(report)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <HiOutlineEye size={18} />
                    </button>
                    {report.status === 'pending' && (
                      <button
                        onClick={() => handleReviewReport(report._id)}
                        className="px-3 py-1.5 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                      >
                        Review
                      </button>
                    )}
                    {(report.status === 'pending' || report.status === 'reviewing') && (
                      <>
                        <button
                          onClick={() => { setResolveModal({ open: true, reportId: report._id }); setResolveForm({ actionTaken: '', adminNotes: '' }); }}
                          className="px-3 py-1.5 text-xs bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors font-medium"
                        >
                          Resolve
                        </button>
                        <button
                          onClick={() => handleDismissReport(report._id)}
                          className="px-3 py-1.5 text-xs bg-gray-50 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                        >
                          Dismiss
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {reports.pagination?.total > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Page {reports.pagination.current} of {reports.pagination.total}</span>
          <div className="flex gap-2">
            <button
              disabled={reports.pagination.current <= 1}
              onClick={() => setReportFilters(prev => ({ ...prev, page: prev.page - 1 }))}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              disabled={reports.pagination.current >= reports.pagination.total}
              onClick={() => setReportFilters(prev => ({ ...prev, page: prev.page + 1 }))}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedReport(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Report Details</h3>
              <button onClick={() => setSelectedReport(null)} className="p-1 hover:bg-gray-200 rounded-lg transition-colors">
                <HiOutlineXMark size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(85vh-140px)] space-y-5">
              {/* Status & Meta */}
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${STATUS_STYLES[selectedReport.status]}`}>
                  {selectedReport.status}
                </span>
                <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                  {CATEGORY_LABELS[selectedReport.category]}
                </span>
                <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-600 capitalize">
                  {selectedReport.reportType}
                </span>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Description</h4>
                <p className="text-sm text-gray-800 bg-gray-50 rounded-lg p-4 border border-gray-100">{selectedReport.description}</p>
              </div>

              {/* Reporter & Reported User — side by side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-100">
                  <h4 className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-3">Reported By</h4>
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium text-gray-900">{selectedReport.reportedBy?.fullName}</p>
                    <p className="text-xs text-gray-500">{selectedReport.reportedBy?.email}</p>
                    {selectedReport.reportedBy?.studentId && (
                      <p className="text-xs text-gray-500 font-mono">{selectedReport.reportedBy.studentId}</p>
                    )}
                  </div>
                </div>

                <div className="bg-red-50/50 rounded-lg p-4 border border-red-100">
                  <h4 className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-3">Reported User</h4>
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium text-gray-900">{selectedReport.reportedUser?.fullName}</p>
                    <p className="text-xs text-gray-500">{selectedReport.reportedUser?.email}</p>
                    {selectedReport.reportedUser?.studentId && (
                      <p className="text-xs text-gray-500 font-mono">{selectedReport.reportedUser.studentId}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        selectedReport.reportedUser?.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {selectedReport.reportedUser?.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium capitalize">
                        {selectedReport.reportedUser?.role}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Admin Notes / Action Taken (if already resolved) */}
              {selectedReport.actionTaken && selectedReport.actionTaken !== 'none' && (
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h4 className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-2">Resolution</h4>
                  <p className="text-sm text-green-800 font-medium">{ACTION_LABELS[selectedReport.actionTaken]}</p>
                  {selectedReport.adminNotes && (
                    <p className="text-sm text-green-700 mt-1">{selectedReport.adminNotes}</p>
                  )}
                  {selectedReport.reviewedBy && (
                    <p className="text-xs text-green-600 mt-2">Reviewed by: {selectedReport.reviewedBy.fullName} on {new Date(selectedReport.reviewedAt).toLocaleDateString()}</p>
                  )}
                </div>
              )}

              {/* Timestamp */}
              <p className="text-xs text-gray-400">
                Filed on {new Date(selectedReport.createdAt).toLocaleDateString()} at {new Date(selectedReport.createdAt).toLocaleTimeString()}
              </p>
            </div>

            {/* Action Footer */}
            {(selectedReport.status === 'pending' || selectedReport.status === 'reviewing') && (
              <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
                <button
                  onClick={() => handleDismissReport(selectedReport._id)}
                  className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Dismiss
                </button>
                {selectedReport.status === 'pending' && (
                  <button
                    onClick={() => { handleReviewReport(selectedReport._id); setSelectedReport(prev => ({ ...prev, status: 'reviewing' })); }}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium inline-flex items-center gap-1.5"
                  >
                    <HiOutlineDocumentMagnifyingGlass size={16} /> Mark as Reviewing
                  </button>
                )}
                <button
                  onClick={() => { setResolveModal({ open: true, reportId: selectedReport._id }); setResolveForm({ actionTaken: '', adminNotes: '' }); }}
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium inline-flex items-center gap-1.5"
                >
                  <HiOutlineCheck size={16} /> Resolve
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Resolve Modal */}
      {resolveModal.open && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={() => setResolveModal({ open: false, reportId: null })}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Resolve Report</h3>

            <div className="space-y-3 mb-4">
              <label className="block text-sm font-medium text-gray-700">Action Taken</label>
              {[
                { value: 'warning_issued', label: 'Warning Issued', desc: 'Send a warning to the reported user', icon: <HiOutlineExclamationTriangle size={16} /> },
                { value: 'content_removed', label: 'Content Removed', desc: 'Offending content has been removed', icon: <HiOutlineTrash size={16} /> },
                { value: 'user_deactivated', label: 'User Deactivated', desc: 'Deactivate the reported user account', icon: <HiOutlineNoSymbol size={16} /> },
                { value: 'user_banned', label: 'User Banned', desc: 'Permanently ban the reported user', icon: <HiOutlineHandRaised size={16} /> },
                { value: 'no_action_needed', label: 'No Action Needed', desc: 'Report is valid but no action required', icon: <HiOutlineCheckCircle size={16} /> },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setResolveForm(prev => ({ ...prev, actionTaken: opt.value }))}
                  className={`w-full text-left px-4 py-3 text-sm rounded-lg border transition-colors flex items-center gap-3 ${
                    resolveForm.actionTaken === opt.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="flex-shrink-0">{opt.icon}</span>
                  <div>
                    <p className="font-medium">{opt.label}</p>
                    <p className="text-xs text-gray-500">{opt.desc}</p>
                  </div>
                </button>
              ))}

              <label className="block text-sm font-medium text-gray-700 mt-4">Admin Notes (optional)</label>
              <textarea
                value={resolveForm.adminNotes}
                onChange={(e) => setResolveForm(prev => ({ ...prev, adminNotes: e.target.value }))}
                placeholder="Add notes about the resolution..."
                rows={3}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setResolveModal({ open: false, reportId: null }); setResolveForm({ actionTaken: '', adminNotes: '' }); }}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResolveReport}
                disabled={!resolveForm.actionTaken}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Resolution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ==================== MAIN RENDER ====================

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverview();
      case 'users': return renderUsers();
      case 'contributors': return renderContributors();
      case 'colleges': return renderColleges();
      case 'enrollments': return renderEnrollments();
      case 'reports': return renderReports();
      default: return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">Admin Dashboard</h1>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          fixed lg:sticky top-0 lg:top-16 left-0 z-40 h-screen lg:h-[calc(100vh-4rem)]
          w-64 bg-white border-r border-gray-200 transform transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          {/* Sidebar overlay for mobile */}
          {sidebarOpen && (
            <div className="fixed inset-0 bg-black/30 lg:hidden z-[-1]" onClick={() => setSidebarOpen(false)} />
          )}

          <div className="p-4">
            <h2 className="text-lg font-bold text-gray-900 mb-1 hidden lg:block">Admin Panel</h2>
            <p className="text-xs text-gray-500 mb-6 hidden lg:block">Manage your platform</p>

            <nav className="space-y-1">
              {sidebarItems.map(item => (
                <button
                  key={item.key}
                  onClick={() => { setActiveTab(item.key); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === item.key
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {renderContent()}
        </main>
      </div>

      {/* Toasts */}
      <div className="fixed top-6 right-6 space-y-3 z-50">
        {toasts.map(toast => (
          <Toast key={toast.id} type={toast.type} message={toast.message} />
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
