import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Toast } from '../components/Toast';
import OverviewTab from '../components/contributor/OverviewTab';
import MyEventsTab from '../components/contributor/MyEventsTab';
import MyPostsTab from '../components/contributor/MyPostsTab';
import RegistrationsTab from '../components/contributor/RegistrationsTab';
import AnalyticsTab from '../components/contributor/AnalyticsTab';
import {
  HiOutlineHome,
  HiOutlineCalendarDays,
  HiOutlinePencilSquare,
  HiOutlineUsers,
  HiOutlineChartBar,
  HiOutlineArrowRightOnRectangle,
  HiOutlineBars3,
  HiOutlineXMark,
} from 'react-icons/hi2';

const TABS = [
  { id: 'overview', label: 'Overview', icon: HiOutlineHome },
  { id: 'events', label: 'My Events', icon: HiOutlineCalendarDays },
  { id: 'posts', label: 'My Posts', icon: HiOutlinePencilSquare },
  { id: 'registrations', label: 'Registrations', icon: HiOutlineUsers },
  { id: 'analytics', label: 'Analytics', icon: HiOutlineChartBar },
];

export default function ContributorDashboard({ onLogout }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [user, setUser] = useState(null);
  const [fullEventsCount, setFullEventsCount] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, []);

  // Fetch full events count for badge on sidebar
  const fetchFullEventsCount = useCallback(async () => {
    try {
      const res = await api.get('/contributor/overview');
      if (res.data.success) {
        const fullCount = res.data.data.eventsAtGlance?.filter(e => e.status === 'full').length || 0;
        setFullEventsCount(fullCount);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchFullEventsCount();
  }, [fetchFullEventsCount, activeTab]);

  const showToast = (type, message) => {
    setToast({ type, message });
  };

  const handleLogout = () => {
    if (onLogout) onLogout();
    navigate('/');
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSidebarOpen(false);
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab showToast={showToast} onNavigate={setActiveTab} />;
      case 'events':
        return <MyEventsTab showToast={showToast} />;
      case 'posts':
        return <MyPostsTab showToast={showToast} />;
      case 'registrations':
        return <RegistrationsTab showToast={showToast} />;
      case 'analytics':
        return <AnalyticsTab showToast={showToast} />;
      default:
        return <OverviewTab showToast={showToast} onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Toast */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              SC
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900 leading-tight">Suno-Campus</h1>
              <p className="text-xs text-blue-600 font-medium">Contributor</p>
            </div>
          </div>
        </div>

        {/* User info */}
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-semibold text-sm">
              {user?.fullName?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.fullName || 'Contributor'}</p>
              <p className="text-xs text-gray-500 truncate">{user?.collegeName || ''}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-3 space-y-1 overflow-y-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                  ${isActive
                    ? 'bg-blue-50 text-blue-700 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                <span className="flex-1 text-left">{tab.label}</span>
                {tab.id === 'events' && fullEventsCount > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {fullEventsCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <HiOutlineArrowRightOnRectangle className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {/* Mobile header */}
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <HiOutlineBars3 className="w-6 h-6 text-gray-700" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900">
            {TABS.find(t => t.id === activeTab)?.label || 'Dashboard'}
          </h2>
        </div>

        {/* Tab content */}
        <div className="p-4 lg:p-6 max-w-7xl mx-auto">
          {renderTab()}
        </div>
      </main>
    </div>
  );
}
