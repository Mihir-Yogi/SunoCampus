import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineXMark,
  HiOutlineUsers,
  HiOutlineTrash,
  HiOutlineMapPin,
  HiOutlineCalendarDays,
  HiOutlineClock,
  HiOutlineGlobeAlt,
  HiOutlineComputerDesktop,
  HiOutlineBuildingOffice2,
  HiOutlineEye,
} from 'react-icons/hi2';
import EventFormModal from './EventFormModal';

const MODE_ICONS = {
  Online: HiOutlineComputerDesktop,
  Offline: HiOutlineMapPin,
  Hybrid: HiOutlineGlobeAlt,
};

const CATEGORY_COLORS = {
  Technical: 'bg-blue-100 text-blue-700',
  Cultural: 'bg-purple-100 text-purple-700',
  Sports: 'bg-green-100 text-green-700',
  Workshop: 'bg-amber-100 text-amber-700',
};

const STATUS_STYLES = {
  open: 'bg-green-100 text-green-700',
  full: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-600',
};

export default function MyEventsTab({ showToast }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [viewOnlyModal, setViewOnlyModal] = useState(false);
  const [cancelEventId, setCancelEventId] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [deleteEventId, setDeleteEventId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterCategory) params.category = filterCategory;

      const res = await api.get('/contributor/events', { params });
      if (res.data.success) {
        setEvents(res.data.data);
      }
    } catch (error) {
      showToast('error', 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterCategory]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleCreateEvent = () => {
    setEditingEvent(null);
    setViewOnlyModal(false);
    setShowModal(true);
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setViewOnlyModal(false);
    setShowModal(true);
  };

  const handleViewEvent = (event) => {
    setEditingEvent(event);
    setViewOnlyModal(true);
    setShowModal(true);
  };

  const handleModalClose = (refresh) => {
    setShowModal(false);
    setEditingEvent(null);
    setViewOnlyModal(false);
    if (refresh) fetchEvents();
  };

  const handleCancelEvent = async () => {
    if (!cancelEventId) return;
    try {
      setCancelling(true);
      const res = await api.put(`/contributor/events/${cancelEventId}/cancel`);
      if (res.data.success) {
        showToast('success', res.data.message);
        fetchEvents();
      }
    } catch (error) {
      showToast('error', error.response?.data?.message || 'Failed to cancel event');
    } finally {
      setCancelling(false);
      setCancelEventId(null);
    }
  };

  const handleDeleteEvent = async () => {
    if (!deleteEventId) return;
    try {
      setDeleting(true);
      const res = await api.delete(`/contributor/events/${deleteEventId}`);
      if (res.data.success) {
        showToast('success', res.data.message);
        fetchEvents();
      }
    } catch (error) {
      showToast('error', error.response?.data?.message || 'Failed to delete event');
    } finally {
      setDeleting(false);
      setDeleteEventId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">My Events</h1>
        <button
          onClick={handleCreateEvent}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          <HiOutlinePlus className="w-5 h-5" />
          Create Event
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="full">Full</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Categories</option>
          <option value="Technical">Technical</option>
          <option value="Cultural">Cultural</option>
          <option value="Sports">Sports</option>
          <option value="Workshop">Workshop</option>
        </select>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <HiOutlineCalendarDays className="w-16 h-16 text-gray-300 mx-auto" />
          <p className="text-gray-500 mt-3 text-lg">No events yet</p>
          <p className="text-gray-400 text-sm mt-1">Create your first event to get started</p>
          <button
            onClick={handleCreateEvent}
            className="mt-4 inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            <HiOutlinePlus className="w-4 h-4" />
            Create Event
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {events.map((event) => {
            const pct = event.totalSeats > 0
              ? Math.round((event.registeredCount / event.totalSeats) * 100)
              : 0;
            const ModeIcon = MODE_ICONS[event.mode] || HiOutlineGlobeAlt;

            return (
              <div key={event._id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                {/* Banner */}
                {event.bannerImage ? (
                  <img src={event.bannerImage} alt={event.title} className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-32 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                    <HiOutlineCalendarDays className="w-12 h-12 text-blue-300" />
                  </div>
                )}

                <div className="p-4">
                  {/* Title */}
                  <h3 className="font-semibold text-gray-900 text-lg leading-tight truncate">{event.title}</h3>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[event.category] || 'bg-gray-100 text-gray-600'}`}>
                      {event.category}
                    </span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 inline-flex items-center gap-1">
                      <ModeIcon className="w-3.5 h-3.5" />
                      {event.mode}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[event.status]}`}>
                      {event.status.toUpperCase()}
                    </span>
                    {event.scope === 'global' && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">Global</span>
                    )}
                  </div>

                  {/* Date & Location */}
                  <div className="mt-3 space-y-1 text-sm text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <HiOutlineCalendarDays className="w-4 h-4 flex-shrink-0" />
                      <span>{new Date(event.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      <HiOutlineClock className="w-4 h-4 ml-2 flex-shrink-0" />
                      <span>{event.eventTime}</span>
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-1.5">
                        <HiOutlineMapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Seat progress */}
                  <div className="mt-3">
                    {event.totalSeats != null && event.totalSeats > 0 ? (
                      <>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              event.status === 'cancelled' ? 'bg-gray-400'
                                : pct >= 100 ? 'bg-red-500'
                                : pct >= 80 ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {event.registeredCount}/{event.totalSeats} seats —{' '}
                          <span className={event.availableSeats > 0 ? 'text-emerald-600 font-medium' : 'text-red-600 font-medium'}>
                            {event.availableSeats > 0 ? `${event.availableSeats} left` : 'FULL'}
                          </span>
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-gray-500 mt-1">
                        {event.registeredCount} registered —{' '}
                        <span className="text-blue-600 font-medium">Unlimited seats</span>
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
                    {event.status !== 'cancelled' ? (
                      <>
                        <button
                          onClick={() => handleEditEvent(event)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <HiOutlinePencil className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => setCancelEventId(event._id)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          <HiOutlineXMark className="w-4 h-4" />
                          Cancel
                        </button>
                        <button
                          onClick={() => setDeleteEventId(event._id)}
                          className="inline-flex items-center justify-center p-2 text-sm font-medium text-gray-400 bg-gray-50 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors"
                          title="Delete event"
                        >
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleViewEvent(event)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <HiOutlineEye className="w-4 h-4" />
                          View
                        </button>
                        <button
                          onClick={() => setDeleteEventId(event._id)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          <HiOutlineTrash className="w-4 h-4" />
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Event Modal */}
      {showModal && (
        <EventFormModal
          event={editingEvent}
          onClose={handleModalClose}
          showToast={showToast}
          viewOnly={viewOnlyModal}
        />
      )}

      {/* Cancel Event Confirmation */}
      {cancelEventId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900">Cancel Event?</h3>
            <p className="text-sm text-gray-600 mt-2">
              This will notify all registered students via email and clear all registrations. This action cannot be undone.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setCancelEventId(null)}
                disabled={cancelling}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Keep Event
              </button>
              <button
                onClick={handleCancelEvent}
                disabled={cancelling}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {cancelling ? 'Cancelling...' : 'Yes, Cancel Event'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Event Confirmation */}
      {deleteEventId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <HiOutlineTrash className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Delete Event?</h3>
            </div>
            <p className="text-sm text-gray-600">
              This will permanently delete the event, its banner image, and all registration data. This action cannot be undone.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setDeleteEventId(null)}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Keep It
              </button>
              <button
                onClick={handleDeleteEvent}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
