import { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  HiOutlineCalendarDays,
  HiOutlineUsers,
  HiOutlineHeart,
  HiOutlineTrophy,
} from 'react-icons/hi2';

export default function AnalyticsTab({ showToast }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/contributor/analytics');
        if (res.data.success) setData(res.data.data);
      } catch {
        showToast('error', 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const summaryCards = [
    { label: 'Total Events', value: data.summary.totalEvents, icon: HiOutlineCalendarDays, bg: 'bg-blue-50', text: 'text-blue-600' },
    { label: 'Total Registrations', value: data.summary.totalRegistrations, icon: HiOutlineUsers, bg: 'bg-emerald-50', text: 'text-emerald-600' },
    { label: 'Total Post Likes', value: data.summary.totalPostLikes, icon: HiOutlineHeart, bg: 'bg-rose-50', text: 'text-rose-600' },
    { label: 'Full Events', value: data.summary.fullEventsCount, icon: HiOutlineTrophy, bg: 'bg-amber-50', text: 'text-amber-600' },
  ];

  // Find max for bar chart scaling
  const maxSeats = Math.max(...(data.registrationsPerEvent.map(e => e.totalSeats) || [1]), 1);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => {
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

      {/* Registrations per Event — Bar Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Registrations per Event</h2>
        {data.registrationsPerEvent.length === 0 ? (
          <p className="text-gray-400 text-sm py-6 text-center">No events to show</p>
        ) : (
          <div className="space-y-3">
            {data.registrationsPerEvent.map((event) => {
              const pct = event.totalSeats > 0 ? (event.registeredCount / event.totalSeats) * 100 : 0;
              const widthPct = (event.totalSeats / maxSeats) * 100;
              const barColor = pct >= 100 ? 'bg-red-500'
                : pct >= 80 ? 'bg-amber-500'
                : pct >= 50 ? 'bg-blue-500'
                : 'bg-emerald-500';

              return (
                <div key={event._id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 truncate pr-2">{event.title}</span>
                    <span className="text-sm text-gray-500 whitespace-nowrap">
                      {event.registeredCount}/{event.totalSeats}
                    </span>
                  </div>
                  <div className="relative">
                    {/* Background bar (total seats proportional) */}
                    <div
                      className="bg-gray-100 rounded-full h-6 overflow-hidden"
                      style={{ width: `${widthPct}%`, minWidth: '60px' }}
                    >
                      {/* Fill bar (registered/total) */}
                      <div
                        className={`h-full rounded-full ${barColor} transition-all duration-500 flex items-center justify-end pr-2`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      >
                        {pct >= 20 && (
                          <span className="text-xs text-white font-semibold">{event.percentage}%</span>
                        )}
                      </div>
                    </div>
                    {pct < 20 && (
                      <span className="text-xs text-gray-500 font-semibold ml-2">{event.percentage}%</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Category Breakdown */}
      {data.categoryBreakdown && Object.keys(data.categoryBreakdown).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Events by Category</h2>
          <div className="flex flex-wrap gap-3">
            {Object.entries(data.categoryBreakdown).map(([cat, count]) => {
              const colors = {
                Technical: 'bg-blue-100 text-blue-700 border-blue-200',
                Cultural: 'bg-purple-100 text-purple-700 border-purple-200',
                Sports: 'bg-green-100 text-green-700 border-green-200',
                Workshop: 'bg-amber-100 text-amber-700 border-amber-200',
              };
              return (
                <div key={cat} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border ${colors[cat] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                  <span className="text-sm font-medium">{cat}</span>
                  <span className="text-lg font-bold">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Post Engagement Table */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Post Engagement</h2>
        {data.postEngagement.length === 0 ? (
          <p className="text-gray-400 text-sm py-6 text-center">No posts to show</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3 pr-4">Post Title</th>
                  <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3 px-4">Likes</th>
                  <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3 px-4">Comments</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3 pl-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.postEngagement.map((post) => (
                  <tr key={post._id} className="hover:bg-gray-50">
                    <td className="py-3 pr-4">
                      <span className="text-sm font-medium text-gray-800">{post.title}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-sm text-rose-600 font-medium">
                        <HiOutlineHeart className="w-4 h-4" />
                        {post.likesCount}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-sm text-blue-600 font-medium">💬 {post.commentsCount}</span>
                    </td>
                    <td className="py-3 pl-4 text-right">
                      <span className="text-xs text-gray-500">
                        {new Date(post.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
