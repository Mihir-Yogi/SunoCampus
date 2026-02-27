import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  HiOutlineCalendarDays,
  HiOutlineMapPin,
  HiOutlineClock,
  HiOutlineUserGroup,
  HiOutlineXMark,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineTicket,
  HiOutlineArrowLeft,
  HiOutlineFunnel,
} from 'react-icons/hi2';
import api from '../services/api';

const MyRegistrations = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, upcoming, past
  const [cancellingId, setCancellingId] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const fetchRegistrations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/browse/my-registrations');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load registrations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  const handleCancel = async (registrationId) => {
    if (!window.confirm('Are you sure you want to cancel this registration?')) return;

    try {
      setCancellingId(registrationId);
      const res = await api.delete(`/browse/registrations/${registrationId}`);
      if (res.data.success) {
        showToast('Registration cancelled successfully');
        fetchRegistrations();
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to cancel registration', 'error');
    } finally {
      setCancellingId(null);
    }
  };

  const filteredRegs = data?.registrations?.filter(r => {
    if (filter === 'upcoming') return !r.event.isPast;
    if (filter === 'past') return r.event.isPast;
    return true;
  }) || [];

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/browse" className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-500">
            <HiOutlineArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">My Registrations</h1>
            <p className="text-sm text-gray-500">Events you've registered for</p>
          </div>
        </div>

        {/* Stats */}
        {data && !loading && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{data.total}</p>
              <p className="text-xs text-gray-500 mt-1">Total</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{data.upcoming}</p>
              <p className="text-xs text-gray-500 mt-1">Upcoming</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-gray-400">{data.past}</p>
              <p className="text-xs text-gray-500 mt-1">Completed</p>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        {data && data.total > 0 && (
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-5">
            {[
              { key: 'all', label: 'All' },
              { key: 'upcoming', label: 'Upcoming' },
              { key: 'past', label: 'Past' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  filter === f.key
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-2/3 mb-3" />
                <div className="h-4 bg-gray-100 rounded w-1/3 mb-2" />
                <div className="h-4 bg-gray-100 rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            <HiOutlineExclamationTriangle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        ) : filteredRegs.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <HiOutlineTicket className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">
              {filter === 'all' ? 'No registrations yet' : `No ${filter} registrations`}
            </h3>
            <p className="text-sm text-gray-400 max-w-sm mx-auto">
              {filter === 'all'
                ? 'Browse events and register to see them here.'
                : `You don't have any ${filter} event registrations.`}
            </p>
            {filter === 'all' && (
              <Link
                to="/browse"
                className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Browse Events
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRegs.map(reg => (
              <div
                key={reg._id}
                className={`bg-white rounded-xl border overflow-hidden transition-all duration-200 hover:shadow-md ${
                  reg.event.isPast ? 'border-gray-200 opacity-80' : 'border-gray-200'
                }`}
              >
                {/* Banner */}
                {reg.event.bannerImage && (
                  <div className="h-32 w-full overflow-hidden">
                    <img
                      src={reg.event.bannerImage}
                      alt={reg.event.title}
                      className={`w-full h-full object-cover ${reg.event.isPast ? 'grayscale' : ''}`}
                    />
                  </div>
                )}

                <div className="p-5">
                  {/* Status badges */}
                  <div className="flex items-center gap-2 mb-2">
                    {reg.event.isPast ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
                        Completed
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                        Upcoming
                      </span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      reg.event.category === 'Workshop' ? 'bg-purple-100 text-purple-700' :
                      reg.event.category === 'Technical' ? 'bg-blue-100 text-blue-700' :
                      reg.event.category === 'Cultural' ? 'bg-pink-100 text-pink-700' :
                      reg.event.category === 'Competition' ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {reg.event.category}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      reg.event.mode === 'Online' ? 'bg-cyan-100 text-cyan-700' :
                      reg.event.mode === 'Offline' ? 'bg-amber-100 text-amber-700' :
                      'bg-indigo-100 text-indigo-700'
                    }`}>
                      {reg.event.mode}
                    </span>
                    {reg.attended && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium flex items-center gap-1">
                        <HiOutlineCheckCircle className="w-3 h-3" /> Attended
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{reg.event.title}</h3>

                  {/* Event details */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-gray-500 mb-3">
                    <span className="flex items-center gap-1.5">
                      <HiOutlineCalendarDays className="w-4 h-4 text-gray-400" />
                      {formatDate(reg.event.eventDate)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <HiOutlineClock className="w-4 h-4 text-gray-400" />
                      {formatTime(reg.event.eventTime)}
                    </span>
                    {reg.event.location && (
                      <span className="flex items-center gap-1.5">
                        <HiOutlineMapPin className="w-4 h-4 text-gray-400" />
                        {reg.event.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <HiOutlineUserGroup className="w-4 h-4 text-gray-400" />
                      {reg.event.registeredCount}{reg.event.totalSeats ? `/${reg.event.totalSeats}` : ''} registered
                    </span>
                  </div>

                  {/* Organizer */}
                  {reg.event.createdBy && (
                    <p className="text-xs text-gray-400 mb-3">
                      Organized by <span className="font-medium text-gray-600">{reg.event.createdBy.fullName}</span>
                      {reg.event.college && <> · {reg.event.college.name}</>}
                    </p>
                  )}

                  {/* Registration info + Cancel */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-400">
                      Registered {formatDate(reg.registeredAt)}
                    </p>
                    {!reg.event.isPast && reg.event.status !== 'cancelled' && (
                      <button
                        onClick={() => handleCancel(reg._id)}
                        disabled={cancellingId === reg._id}
                        className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        <HiOutlineXMark className="w-3.5 h-3.5" />
                        {cancellingId === reg._id ? 'Cancelling...' : 'Cancel Registration'}
                      </button>
                    )}
                    {reg.event.status === 'cancelled' && (
                      <span className="text-xs text-red-500 font-medium">Event Cancelled</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast.show && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-5 py-3 rounded-xl shadow-lg text-sm font-medium animate-toast-in ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default MyRegistrations;
