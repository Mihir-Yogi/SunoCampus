import { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  HiOutlineCalendarDays,
  HiOutlinePencilSquare,
  HiOutlineUsers,
  HiOutlineHeart,
} from 'react-icons/hi2';

export default function OverviewTab({ showToast, onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const res = await api.get('/contributor/overview');
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (error) {
        showToast('error', 'Failed to load overview');
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const statCards = [
    { label: 'Total Events', value: data.stats.totalEvents, icon: HiOutlineCalendarDays, color: 'blue', bg: 'bg-blue-50', text: 'text-blue-600' },
    { label: 'Posts Published', value: data.stats.totalPosts, icon: HiOutlinePencilSquare, color: 'purple', bg: 'bg-purple-50', text: 'text-purple-600' },
    { label: 'Total Registrations', value: data.stats.totalRegistrations, icon: HiOutlineUsers, color: 'emerald', bg: 'bg-emerald-50', text: 'text-emerald-600' },
    { label: 'Total Post Likes', value: data.stats.totalPostLikes, icon: HiOutlineHeart, color: 'rose', bg: 'bg-rose-50', text: 'text-rose-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {data.contributorName?.split(' ')[0]}! 👋
        </h1>
        <p className="text-gray-500 mt-1">{data.collegeName} — Contributor Dashboard</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">{card.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{card.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${card.text}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two columns: Events at a glance + Recent posts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Events at a Glance */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Events at a Glance</h2>
            <button
              onClick={() => onNavigate('events')}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              View All →
            </button>
          </div>
          {data.eventsAtGlance.length === 0 ? (
            <p className="text-gray-400 text-sm py-6 text-center">No events created yet</p>
          ) : (
            <div className="space-y-3">
              {data.eventsAtGlance.map((event) => {
                const pct = event.totalSeats > 0
                  ? Math.round((event.registeredCount / event.totalSeats) * 100)
                  : 0;
                const barColor = event.status === 'full' ? 'bg-red-500'
                  : event.status === 'cancelled' ? 'bg-gray-400'
                  : pct >= 80 ? 'bg-amber-500'
                  : 'bg-emerald-500';

                return (
                  <div key={event._id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-1.5">
                      <h3 className="text-sm font-semibold text-gray-800 truncate pr-2">{event.title}</h3>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap
                        ${event.status === 'open' ? 'bg-green-100 text-green-700'
                          : event.status === 'full' ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-600'}`}>
                        {event.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                      <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{event.category}</span>
                      <span>{new Date(event.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    </div>
                    {/* Seat progress bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className={`h-2 rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {event.registeredCount}/{event.totalSeats} seats —{' '}
                      <span className={event.availableSeats > 0 ? 'text-emerald-600 font-medium' : 'text-red-600 font-medium'}>
                        {event.availableSeats > 0 ? `${event.availableSeats} left` : 'FULL'}
                      </span>
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Posts */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Posts</h2>
            <button
              onClick={() => onNavigate('posts')}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              View All →
            </button>
          </div>
          {data.recentPosts.length === 0 ? (
            <p className="text-gray-400 text-sm py-6 text-center">No posts published yet</p>
          ) : (
            <div className="space-y-3">
              {data.recentPosts.map((post) => (
                <div key={post._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-gray-800 truncate">{post.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(post.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {post.hasImage && <span className="ml-2 text-blue-500">📷</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-3 text-xs text-gray-500 flex-shrink-0">
                    <span className="flex items-center gap-1">
                      <HiOutlineHeart className="w-3.5 h-3.5 text-rose-400" />
                      {post.likesCount}
                    </span>
                    <span className="flex items-center gap-1">
                      💬 {post.commentsCount}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
