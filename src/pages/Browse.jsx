import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  HiOutlineExclamationCircle, HiOutlineArrowUp, HiOutlineSparkles,
  HiOutlineBuildingLibrary, HiOutlineGlobeAlt, HiOutlineBookOpen,
  HiOutlineCalendarDays, HiOutlineUserCircle,
  HiOutlineSquares2X2, HiOutlineClipboardDocumentCheck, HiOutlineHeart,
  HiOutlineShieldCheck,
} from 'react-icons/hi2';
import api from '../services/api';
import FeedFilters from '../components/browse/FeedFilters';
import PostCard from '../components/browse/PostCard';
import EventCard from '../components/browse/EventCard';
import PostDetail from '../components/browse/PostDetail';
import SkeletonCard from '../components/browse/SkeletonCard';
import ReportModal from '../components/ReportModal';


const Browse = ({ onRoleSync }) => {
  // Read user from localStorage (AuthProvider not mounted globally)
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });

  // Re-read user from localStorage when it changes (e.g. role update)
  useEffect(() => {
    const handleStorage = () => {
      try {
        const updated = JSON.parse(localStorage.getItem('user'));
        setUser(updated);
      } catch { /* ignore */ }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Filter state
  const [scope, setScope] = useState(() => sessionStorage.getItem('browse_scope') || 'campus');
  const [type, setType] = useState('all');
  const [category, setCategory] = useState('all');
  const [eventStatus, setEventStatus] = useState('');
  const [sort, setSort] = useState('newest');
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Feed state
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [error, setError] = useState('');

  // Post detail modal
  const [selectedPostId, setSelectedPostId] = useState(null);

  // Navigate to author profile
  const navigate = useNavigate();
  const goToProfile = (userId) => navigate(`/user/${userId}`);

  // Event registration modal state
  const [registeringEvent, setRegisteringEvent] = useState(null);
  const [formResponses, setFormResponses] = useState({});
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState('');

  // Toast
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Report modal state
  const [reportModal, setReportModal] = useState({ open: false, reportType: '', reportedUserId: '', contentId: '', contentTitle: '' });

  const handleReport = ({ type, userId, contentId, title }) => {
    setReportModal({ open: true, reportType: type, reportedUserId: userId, contentId: contentId || '', contentTitle: title || '' });
  };

  // Infinite scroll sentinel
  const sentinelRef = useRef(null);

  // Scroll-to-top FAB
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isFilterSticky, setIsFilterSticky] = useState(false);
  const filterBarRef = useRef(null);

  // Persist scope
  useEffect(() => {
    sessionStorage.setItem('browse_scope', scope);
  }, [scope]);

  // Scroll listener for FAB + sticky filter
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
      if (filterBarRef.current) {
        const rect = filterBarRef.current.getBoundingClientRect();
        setIsFilterSticky(rect.top <= 64);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch feed
  const fetchFeed = useCallback(async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);
      setError('');

      const params = new URLSearchParams({
        scope,
        type,
        sort,
        page: pageNum,
        limit: 12,
      });
      if (category !== 'all') params.append('category', category);
      if (eventStatus) params.append('eventStatus', eventStatus);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await api.get(`/browse/feed?${params.toString()}`);
      const { feed: newFeed, pagination } = res.data.data;

      setFeed(prev => append ? [...prev, ...newFeed] : newFeed);
      setPage(pagination.currentPage);
      setHasMore(pagination.hasMore);
      setTotalItems(pagination.totalItems);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load feed');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [scope, type, category, eventStatus, sort, searchQuery]);

  // Fetch on filter change
  useEffect(() => {
    fetchFeed(1, false);
  }, [fetchFeed]);

  // Infinite scroll
  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loadingMore && !loading) {
          fetchFeed(page + 1, true);
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, page, fetchFeed]);

  // Search handler
  const handleSearch = () => {
    setSearchQuery(search);
  };

  // Like handler
  const handleLike = async (postId) => {
    // Optimistic update
    setFeed(prev => prev.map(item => {
      if (item._type === 'post' && item._id === postId) {
        return {
          ...item,
          isLiked: !item.isLiked,
          likesCount: item.isLiked ? item.likesCount - 1 : item.likesCount + 1,
        };
      }
      return item;
    }));

    try {
      const res = await api.post(`/browse/posts/${postId}/like`);
      // Update with server response
      setFeed(prev => prev.map(item => {
        if (item._type === 'post' && item._id === postId) {
          return {
            ...item,
            isLiked: res.data.data.isLiked,
            likesCount: res.data.data.likesCount,
          };
        }
        return item;
      }));
    } catch {
      // Rollback
      setFeed(prev => prev.map(item => {
        if (item._type === 'post' && item._id === postId) {
          return {
            ...item,
            isLiked: !item.isLiked,
            likesCount: item.isLiked ? item.likesCount - 1 : item.likesCount + 1,
          };
        }
        return item;
      }));
      showToast('Failed to update like', 'error');
    }
  };

  // Like update from PostDetail modal
  const handleLikeUpdate = (postId, isLiked, likesCount) => {
    setFeed(prev => prev.map(item => {
      if (item._type === 'post' && item._id === postId) {
        return { ...item, isLiked, likesCount };
      }
      return item;
    }));
  };

  // Comment count update from PostDetail modal
  const handleCommentCountUpdate = (postId, commentsCount) => {
    setFeed(prev => prev.map(item => {
      if (item._type === 'post' && item._id === postId) {
        return { ...item, commentsCount };
      }
      return item;
    }));
  };

  // Register handler — if event has custom fields, open modal; else direct register
  const handleRegister = async (event) => {
    if (event.customFormFields && event.customFormFields.length > 0) {
      setRegisteringEvent(event);
      setFormResponses({});
      setRegisterError('');
      setRegisterSuccess('');
    } else {
      await submitRegistration(event._id, {});
    }
  };

  // Submit registration
  const submitRegistration = async (eventId, responses) => {
    try {
      const res = await api.post(`/browse/events/${eventId}/register`, { formResponses: responses });

      // Update feed
      setFeed(prev => prev.map(item => {
        if (item._type === 'event' && item._id === eventId) {
          return {
            ...item,
            isRegistered: true,
            registeredCount: res.data.data.registeredCount,
            availableSeats: res.data.data.availableSeats,
            status: res.data.data.status,
          };
        }
        return item;
      }));

      setRegisteringEvent(null);
      showToast(res.data.message || 'Successfully registered!', 'success');
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed';
      if (registeringEvent) {
        setRegisterError(msg);
      } else {
        showToast(msg, 'error');
      }
    }
  };

  // Form submit for custom fields
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!registeringEvent) return;
    setRegisterError('');
    await submitRegistration(registeringEvent._id, formResponses);
  };

  // Toast helper
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  // Custom form field renderer
  const renderFormField = (field) => {
    const value = formResponses[field.fieldId] || '';
    const onChange = (val) => setFormResponses(prev => ({ ...prev, [field.fieldId]: val }));

    const commonClass = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none';

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'url':
        return (
          <input
            type={field.type === 'phone' ? 'tel' : field.type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || ''}
            required={field.required}
            className={commonClass}
          />
        );
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || ''}
            required={field.required}
            className={commonClass}
          />
        );
      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
            className={commonClass}
          />
        );
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || ''}
            required={field.required}
            rows={3}
            className={`${commonClass} resize-none`}
          />
        );
      case 'dropdown':
        return (
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
            className={commonClass}
          >
            <option value="">{field.placeholder || 'Select...'}</option>
            {(field.options || []).map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );
      case 'radio':
        return (
          <div className="space-y-1.5">
            {(field.options || []).map(opt => (
              <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name={field.fieldId}
                  value={opt}
                  checked={value === opt}
                  onChange={() => onChange(opt)}
                  required={field.required}
                  className="text-blue-600 focus:ring-blue-500"
                />
                {opt}
              </label>
            ))}
          </div>
        );
      case 'checkbox':
        return (
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => onChange(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            {field.placeholder || field.label}
          </label>
        );
      case 'multi-select':
        return (
          <div className="space-y-1.5">
            {(field.options || []).map(opt => (
              <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={Array.isArray(value) && value.includes(opt)}
                  onChange={(e) => {
                    const arr = Array.isArray(value) ? [...value] : [];
                    if (e.target.checked) arr.push(opt);
                    else arr.splice(arr.indexOf(opt), 1);
                    onChange(arr);
                  }}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                {opt}
              </label>
            ))}
          </div>
        );
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || ''}
            required={field.required}
            className={commonClass}
          />
        );
    }
  };

  // Counts for sidebar
  const postCount = feed.filter(i => i._type === 'post').length;
  const eventCount = feed.filter(i => i._type === 'event').length;
  const initials = user?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_280px] gap-6">

          {/* ═══ Left Sidebar ═══ */}
          <aside className="hidden lg:block">
            <div className="sticky top-20 space-y-4 animate-fadeIn">
              {/* Profile Mini Card */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="h-14 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 relative">
                  <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h40v40H0z\' fill=\'none\'/%3E%3Cpath d=\'M20 0L40 20 20 40 0 20z\' fill=\'%23fff\' opacity=\'.08\'/%3E%3C/svg%3E")' }} />
                </div>
                <div className="px-4 pb-4 -mt-7 relative">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 border-[3px] border-white shadow-md flex items-center justify-center text-white font-bold text-base">
                    {initials}
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm mt-2 truncate">{user?.fullName || 'User'}</h3>
                  <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 capitalize">
                    {user?.role === 'contributor' && <HiOutlineSquares2X2 size={12} className="text-blue-500" />}
                    {user?.role || 'student'}
                  </span>
                </div>
                {user?.role !== 'admin' && (
                <div className="border-t border-gray-100 px-4 py-2.5">
                  <Link to="/profile" className="flex items-center gap-2 text-xs text-gray-500 hover:text-blue-600 transition-colors font-medium">
                    <HiOutlineUserCircle size={15} />
                    View Profile
                  </Link>
                </div>
                )}
              </div>

              {/* Scope / Feed Switcher */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 pt-3 pb-1">Feed Scope</p>
                <div className="px-2 pb-2 space-y-0.5">
                  <button
                    onClick={() => setScope('campus')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      scope === 'campus'
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <HiOutlineBuildingLibrary size={18} className={scope === 'campus' ? 'text-blue-600' : 'text-gray-400'} />
                    Campus
                    {scope === 'campus' && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />}
                  </button>
                  <button
                    onClick={() => setScope('global')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      scope === 'global'
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <HiOutlineGlobeAlt size={18} className={scope === 'global' ? 'text-blue-600' : 'text-gray-400'} />
                    Global
                    {scope === 'global' && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />}
                  </button>
                </div>
              </div>

              {/* My Activity */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 pt-3 pb-1">My Activity</p>
                <div className="px-2 pb-2 space-y-0.5">
                  {user?.role !== 'admin' && (
                  <>
                  <Link
                    to="/profile"
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-all duration-200"
                  >
                    <HiOutlineHeart size={16} className="text-red-400" />
                    Liked Posts
                  </Link>
                  <Link
                    to="/profile"
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-all duration-200"
                  >
                    <HiOutlineClipboardDocumentCheck size={16} className="text-green-500" />
                    My Registrations
                  </Link>
                  </>
                  )}
                  {user?.role === 'contributor' && (
                    <Link
                      to="/contributor"
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-all duration-200"
                    >
                      <HiOutlineSquares2X2 size={16} className="text-blue-500" />
                      Contributor Dashboard
                    </Link>
                  )}
                  {user?.role === 'admin' && (
                    <Link
                      to="/admin"
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-all duration-200"
                    >
                      <HiOutlineShieldCheck size={16} className="text-purple-500" />
                      Admin Panel
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </aside>

          {/* ═══ Center Feed ═══ */}
          <main className="min-w-0">
            {/* Mobile-only scope toggle (hidden on lg where sidebar exists) */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-4 lg:hidden">
              <button
                onClick={() => setScope('campus')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  scope === 'campus'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                🏫 Campus
              </button>
              <button
                onClick={() => setScope('global')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  scope === 'global'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                🌍 Global
              </button>
            </div>

            {/* Filter Bar — sticky with glass effect */}
            <div ref={filterBarRef} className={`sticky top-16 z-30 -mx-4 sm:-mx-6 lg:mx-0 px-4 sm:px-6 lg:px-0 py-3 transition-all duration-300 ${isFilterSticky ? 'glass-bar shadow-sm border-b border-gray-200/50 lg:rounded-xl lg:border lg:px-4' : 'bg-transparent'}`}>
              <FeedFilters
                type={type}
                setType={setType}
                category={category}
                setCategory={setCategory}
                eventStatus={eventStatus}
                setEventStatus={setEventStatus}
                sort={sort}
                setSort={setSort}
                search={search}
                setSearch={setSearch}
                onSearch={handleSearch}
              />
            </div>

            {/* Results count */}
            {!loading && (
              <p className="text-xs text-gray-400 mt-3 mb-2">
                {totalItems} {totalItems === 1 ? 'result' : 'results'}
                {searchQuery && <> for "<span className="font-medium text-gray-600">{searchQuery}</span>"</>}
              </p>
            )}

            {/* Error */}
            {error && (
              <div className="mt-4 flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                <HiOutlineExclamationCircle size={18} />
                {error}
              </div>
            )}

            {/* Feed Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} index={i} type={i % 2 === 0 ? 'post' : 'event'} />
                ))}
              </div>
            ) : feed.length === 0 ? (
              <div className="mt-16 text-center animate-fadeIn">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center animate-gentle-float">
                  <HiOutlineSparkles size={36} className="text-gray-300" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-1">
                  {searchQuery ? 'No results found' : 'Nothing here yet'}
                </h3>
                <p className="text-sm text-gray-400 max-w-sm mx-auto">
                  {searchQuery
                    ? `No posts or events match "${searchQuery}". Try a different search.`
                    : scope === 'campus'
                      ? 'Be the first to create content for your campus!'
                      : 'No global posts or events available right now.'}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-3">
                  {feed.map((item, idx) => (
                    item._type === 'post' ? (
                      <PostCard
                        key={`post-${item._id}`}
                        post={item}
                        onLike={handleLike}
                        onOpenPost={setSelectedPostId}
                        onAuthorClick={goToProfile}
                        onReport={handleReport}
                        index={idx}
                      />
                    ) : (
                      <EventCard
                        key={`event-${item._id}`}
                        event={item}
                        onRegister={handleRegister}
                        onOpenEvent={() => {/* EventDetail modal — later */}}
                        onAuthorClick={goToProfile}
                        onReport={handleReport}
                        index={idx}
                      />
                    )
                  ))}
                </div>

                {/* Loading more indicator */}
                {loadingMore && (
                  <div className="flex justify-center mt-6">
                    <div className="w-7 h-7 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                  </div>
                )}

                {/* Infinite scroll sentinel */}
                {hasMore && <div ref={sentinelRef} className="h-1" />}

                {/* End of feed */}
                {!hasMore && feed.length > 0 && (
                  <div className="text-center mt-10 mb-6 animate-fadeIn">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-xs text-gray-400">
                      <span className="w-8 h-px bg-gray-300" />
                      You've reached the end
                      <span className="w-8 h-px bg-gray-300" />
                    </div>
                  </div>
                )}
              </>
            )}
          </main>

          {/* ═══ Right Sidebar ═══ */}
          <aside className="hidden lg:block">
            <div className="sticky top-20 space-y-4 animate-fadeIn" style={{ animationDelay: '100ms' }}>
              {/* Feed Summary */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Current Feed</h3>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Results</span>
                    <span className="text-sm font-semibold text-gray-900 tabular-nums">{totalItems}</span>
                  </div>
                  {!loading && postCount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 flex items-center gap-1.5"><HiOutlineBookOpen size={14} className="text-blue-500" /> Posts</span>
                      <span className="text-sm font-medium text-gray-700 tabular-nums">{postCount}</span>
                    </div>
                  )}
                  {!loading && eventCount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 flex items-center gap-1.5"><HiOutlineCalendarDays size={14} className="text-green-500" /> Events</span>
                      <span className="text-sm font-medium text-gray-700 tabular-nums">{eventCount}</span>
                    </div>
                  )}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-[11px] text-gray-400 flex items-center gap-1">
                    {scope === 'campus' ? <HiOutlineBuildingLibrary size={12} /> : <HiOutlineGlobeAlt size={12} />}
                    Viewing {scope === 'campus' ? 'campus' : 'global'} feed
                  </p>
                </div>
              </div>

              {/* Trending Categories */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Categories</h3>
                <div className="flex flex-wrap gap-1.5">
                  {['Workshop', 'Seminar', 'Technical', 'Cultural', 'Competition', 'Sports', 'Conference'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => { setCategory(cat); setType('events'); }}
                      className={`px-2.5 py-1 text-xs rounded-full border transition-all duration-200 ${
                        category === cat
                          ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Footer Links */}
              <div className="px-1">
                <p className="text-[10px] text-gray-300 text-center">SunoCampus © {new Date().getFullYear()}</p>
              </div>
            </div>
          </aside>

        </div>{/* end grid */}
      </div>

      {/* Post Detail Modal */}
      {selectedPostId && (
        <PostDetail
          postId={selectedPostId}
          onClose={() => setSelectedPostId(null)}
          onLikeUpdate={handleLikeUpdate}
          onCommentCountUpdate={handleCommentCountUpdate}
          onAuthorClick={(id) => { setSelectedPostId(null); goToProfile(id); }}
          onReport={({ type, userId, contentId, title }) => {
            setSelectedPostId(null);
            handleReport({ type, userId, contentId, title });
          }}
        />
      )}

      {/* Report Modal */}
      <ReportModal
        isOpen={reportModal.open}
        onClose={() => setReportModal({ open: false, reportType: '', reportedUserId: '', contentId: '', contentTitle: '' })}
        reportType={reportModal.reportType}
        reportedUserId={reportModal.reportedUserId}
        contentId={reportModal.contentId}
        contentTitle={reportModal.contentTitle}
      />

      {/* Event Registration Modal (custom fields) */}
      {registeringEvent && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-overlay-in"
          onClick={(e) => { if (e.target === e.currentTarget) setRegisteringEvent(null); }}
        >
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto animate-modal-in">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <div>
                <h3 className="font-bold text-gray-900">Register for Event</h3>
                <p className="text-xs text-gray-500 mt-0.5">{registeringEvent.title}</p>
              </div>
              <button
                onClick={() => setRegisteringEvent(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="px-6 py-4 space-y-4">
              {registeringEvent.customFormFields.map(field => (
                <div key={field.fieldId}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-0.5">*</span>}
                  </label>
                  {renderFormField(field)}
                </div>
              ))}

              {registerError && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{registerError}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRegisteringEvent(null)}
                  className="flex-1 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200 active:scale-[0.97]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all duration-200 hover:shadow-md active:scale-[0.97]"
                >
                  Submit Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast.show && (
        <div className={`fixed bottom-6 left-1/2 z-[60] px-5 py-3 rounded-xl shadow-lg text-sm font-medium animate-toast-in ${
          toast.type === 'success'
            ? 'bg-green-600 text-white'
            : 'bg-red-600 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Scroll-to-top FAB */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-50 w-11 h-11 bg-white border border-gray-200 rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-blue-600 hover:border-blue-200 hover:shadow-xl transition-all duration-300 animate-fab-in active:scale-90"
          aria-label="Scroll to top"
        >
          <HiOutlineArrowUp size={18} />
        </button>
      )}
    </div>
  );
};

export default Browse;
