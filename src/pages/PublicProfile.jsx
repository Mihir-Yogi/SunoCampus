import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  HiOutlineArrowLeft,
  HiOutlineAcademicCap,
  HiOutlineBuildingLibrary,
  HiOutlineDocumentText,
  HiOutlineCalendarDays,
  HiOutlineSparkles,
  HiOutlineHeart,
  HiHeart,
  HiOutlineChatBubbleOvalLeft,
  HiOutlineClock,
  HiOutlineMapPin,
  HiOutlineComputerDesktop,
  HiOutlineUserGroup,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineFlag,
} from 'react-icons/hi2';
import api from '../services/api';
import PostDetail from '../components/browse/PostDetail';
import ReportModal from '../components/ReportModal';

const CATEGORY_COLORS = {
  Workshop: 'bg-orange-50 text-orange-700 border-orange-200',
  Seminar: 'bg-blue-50 text-blue-700 border-blue-200',
  Conference: 'bg-purple-50 text-purple-700 border-purple-200',
  Competition: 'bg-red-50 text-red-700 border-red-200',
  Cultural: 'bg-pink-50 text-pink-700 border-pink-200',
  Sports: 'bg-green-50 text-green-700 border-green-200',
  Technical: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  Other: 'bg-gray-50 text-gray-700 border-gray-200',
};

const PublicProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('posts');
  const [postsPage, setPostsPage] = useState(1);
  const [eventsPage, setEventsPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(false);
  const [hasMoreEvents, setHasMoreEvents] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [reportModal, setReportModal] = useState({ open: false, reportType: '', reportedUserId: '', contentId: '', contentTitle: '' });

  // Get current user to hide report for self
  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  })();

  // Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await api.get(`/browse/users/${id}`);
        setProfile(res.data.data);
      } catch (err) {
        console.error('Fetch public profile error:', err);
        setError('User not found');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProfile();
  }, [id]);

  // Fetch posts
  const fetchPosts = useCallback(async (page = 1, append = false) => {
    try {
      setPostsLoading(true);
      const res = await api.get(`/browse/users/${id}/posts?page=${page}&limit=12`);
      const { posts: newPosts, pagination } = res.data.data;
      setPosts(prev => append ? [...prev, ...newPosts] : newPosts);
      setPostsPage(pagination.currentPage);
      setHasMorePosts(pagination.hasMore);
    } catch {
      /* silent */
    } finally {
      setPostsLoading(false);
    }
  }, [id]);

  // Fetch events
  const fetchEvents = useCallback(async (page = 1, append = false) => {
    try {
      setEventsLoading(true);
      const res = await api.get(`/browse/users/${id}/events?page=${page}&limit=12`);
      const { events: newEvents, pagination } = res.data.data;
      setEvents(prev => append ? [...prev, ...newEvents] : newEvents);
      setEventsPage(pagination.currentPage);
      setHasMoreEvents(pagination.hasMore);
    } catch {
      /* silent */
    } finally {
      setEventsLoading(false);
    }
  }, [id]);

  // Load content when tab or profile loads
  useEffect(() => {
    if (!profile) return;
    if (activeTab === 'posts' && posts.length === 0) fetchPosts(1);
    if (activeTab === 'events' && events.length === 0) fetchEvents(1);
  }, [profile, activeTab, fetchPosts, fetchEvents]);

  // Helpers
  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  const formatEventDate = (date) =>
    new Date(date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

  const getRoleBadge = (role) => {
    if (role === 'contributor') return (
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1 rounded-full bg-blue-100 text-blue-700">
        <HiOutlineSparkles size={14} /> Contributor
      </span>
    );
    if (role === 'admin') return (
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1 rounded-full bg-purple-100 text-purple-700">
        Admin
      </span>
    );
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1 rounded-full bg-gray-100 text-gray-600">
        Student
      </span>
    );
  };

  // Like handler
  const handleLike = async (postId) => {
    try {
      const res = await api.post(`/browse/posts/${postId}/like`);
      setPosts(prev => prev.map(p =>
        p._id === postId
          ? { ...p, isLiked: res.data.data.liked, likesCount: res.data.data.likesCount }
          : p
      ));
    } catch { /* silent */ }
  };

  // Like update from PostDetail modal
  const handleLikeUpdate = (postId, isLiked, likesCount) => {
    setPosts(prev => prev.map(p =>
      p._id === postId ? { ...p, isLiked, likesCount } : p
    ));
  };

  // Comment count update from PostDetail modal
  const handleCommentCountUpdate = (postId, commentsCount) => {
    setPosts(prev => prev.map(p =>
      p._id === postId ? { ...p, commentsCount } : p
    ));
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-5xl mx-auto px-4 pt-24">
          <div className="animate-pulse">
            <div className="h-48 bg-gray-200 rounded-2xl mb-[-60px]" />
            <div className="flex flex-col items-center">
              <div className="w-28 h-28 rounded-full bg-gray-300 border-4 border-white" />
              <div className="h-6 bg-gray-200 rounded w-40 mt-4" />
              <div className="h-4 bg-gray-200 rounded w-24 mt-2" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-500 mb-4">{error || 'User not found'}</p>
          <button
            onClick={() => navigate('/browse')}
            className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2 mx-auto"
          >
            <HiOutlineArrowLeft size={18} /> Back to Browse
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Header */}
      <div className="relative">
        {/* Banner */}
        <div className="h-48 md:h-56 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2" />
            <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-blue-300 rounded-full blur-3xl translate-y-1/2" />
          </div>

          {/* Back button */}
          <button
            onClick={() => navigate('/browse')}
            className="absolute top-4 left-4 md:left-8 flex items-center gap-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm px-3 py-2 rounded-lg transition-all text-sm font-medium"
          >
            <HiOutlineArrowLeft size={16} />
            Back
          </button>
        </div>

        {/* Profile Card */}
        <div className="max-w-4xl mx-auto px-4 -mt-20 relative z-10">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-5">
              {/* Avatar */}
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.fullName}
                  className="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-white shadow-xl object-cover -mt-16 md:-mt-20"
                />
              ) : (
                <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 border-4 border-white shadow-xl flex items-center justify-center text-white text-4xl font-bold -mt-16 md:-mt-20">
                  {getInitials(profile.fullName)}
                </div>
              )}

              {/* Info */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{profile.fullName}</h1>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-2">
                  {getRoleBadge(profile.role)}
                  {profile.college && (
                    <span className="flex items-center gap-1.5 text-sm text-gray-500">
                      <HiOutlineBuildingLibrary size={16} className="text-blue-500" />
                      {profile.college.name}
                    </span>
                  )}
                </div>
                {profile.bio && (
                  <p className="text-gray-600 mt-3 text-sm leading-relaxed max-w-xl">
                    {profile.bio}
                  </p>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 md:gap-8">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{profile.postsCount}</p>
                  <p className="text-xs text-gray-500 font-medium">Posts</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{profile.eventsCount}</p>
                  <p className="text-xs text-gray-500 font-medium">Events</p>
                </div>
                {/* Report User Button — only shown to other users */}
                {currentUser && currentUser.id !== id && (
                  <button
                    onClick={() => setReportModal({
                      open: true,
                      reportType: 'user',
                      reportedUserId: id,
                      contentId: '',
                      contentTitle: profile.fullName,
                    })}
                    className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-red-500 px-3 py-2 rounded-lg border border-gray-200 hover:border-red-200 hover:bg-red-50 transition-all duration-200"
                  >
                    <HiOutlineFlag size={14} />
                    Report
                  </button>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="flex flex-wrap items-center gap-4 mt-5 pt-5 border-t border-gray-100">
              {(profile.branch || profile.degreeProgram) && (
                <span className="flex items-center gap-1.5 text-sm text-gray-600">
                  <HiOutlineAcademicCap size={16} className="text-blue-500" />
                  {profile.degreeProgram || profile.branch}
                  {profile.currentYear ? ` · Year ${profile.currentYear}` : ''}
                </span>
              )}
              {profile.academicInterests && (
                <span className="flex items-center gap-1.5 text-sm text-gray-600">
                  <HiOutlineDocumentText size={16} className="text-blue-500" />
                  {profile.academicInterests}
                </span>
              )}
              {profile.joinedAt && (
                <span className="flex items-center gap-1.5 text-sm text-gray-400">
                  <HiOutlineCalendarDays size={16} />
                  Joined {formatDate(profile.joinedAt)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="max-w-4xl mx-auto px-4 mt-6">
        {/* Tab Switcher */}
        <div className="flex items-center bg-white rounded-xl border border-gray-200 p-1 mb-6">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
              activeTab === 'posts'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            Posts ({profile.postsCount})
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
              activeTab === 'events'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            Events ({profile.eventsCount})
          </button>
        </div>

        {/* Posts Tab */}
        {activeTab === 'posts' && (
          <div>
            {postsLoading && posts.length === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-gray-200" />
                      <div className="flex-1">
                        <div className="h-3 bg-gray-200 rounded w-24" />
                        <div className="h-2 bg-gray-100 rounded w-16 mt-1.5" />
                      </div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-full mb-1" />
                    <div className="h-3 bg-gray-100 rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                <HiOutlineDocumentText size={40} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No posts yet</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {posts.map((post, idx) => (
                    <PostCardMini
                      key={post._id}
                      post={post}
                      onLike={handleLike}
                      onOpenPost={setSelectedPostId}
                      timeAgo={timeAgo}
                      getInitials={getInitials}
                      index={idx}
                    />
                  ))}
                </div>
                {hasMorePosts && (
                  <div className="flex justify-center mt-6">
                    <button
                      onClick={() => fetchPosts(postsPage + 1, true)}
                      disabled={postsLoading}
                      className="px-6 py-2.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {postsLoading ? 'Loading...' : 'Load More Posts'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div>
            {eventsLoading && events.length === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
                    <div className="h-32 bg-gray-200 rounded-lg mb-3" />
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                <HiOutlineCalendarDays size={40} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No events yet</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {events.map((event, idx) => (
                    <EventCardMini
                      key={event._id}
                      event={event}
                      formatEventDate={formatEventDate}
                      getInitials={getInitials}
                      index={idx}
                    />
                  ))}
                </div>
                {hasMoreEvents && (
                  <div className="flex justify-center mt-6">
                    <button
                      onClick={() => fetchEvents(eventsPage + 1, true)}
                      disabled={eventsLoading}
                      className="px-6 py-2.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {eventsLoading ? 'Loading...' : 'Load More Events'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Bottom spacing */}
        <div className="h-12" />
      </div>

      {/* Post Detail Modal */}
      {selectedPostId && (
        <PostDetail
          postId={selectedPostId}
          onClose={() => setSelectedPostId(null)}
          onLikeUpdate={handleLikeUpdate}
          onCommentCountUpdate={handleCommentCountUpdate}
          onReport={({ type, userId, contentId, title }) => {
            setSelectedPostId(null);
            setReportModal({ open: true, reportType: type, reportedUserId: userId, contentId, contentTitle: title });
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
    </div>
  );
};

// ─── Inline Post Card ────────────────────────────────────────
const PostCardMini = ({ post, onLike, onOpenPost, timeAgo, getInitials, index }) => {
  const [isLiking, setIsLiking] = useState(false);
  const [justLiked, setJustLiked] = useState(false);

  const handleLike = async (e) => {
    e.stopPropagation();
    if (isLiking) return;
    setIsLiking(true);
    setJustLiked(!post.isLiked);
    try { await onLike(post._id); } finally {
      setIsLiking(false);
      setTimeout(() => setJustLiked(false), 400);
    }
  };

  return (
    <div
      onClick={() => onOpenPost(post._id)}
      className="bg-white rounded-xl border border-gray-200 hover:border-blue-200 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden group hover:-translate-y-1"
    >
      {post.image && (
        <div className="aspect-video w-full overflow-hidden bg-gray-100">
          <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
          <span>{post.college?.abbreviation || post.college?.name || ''}</span>
          <span>·</span>
          <span>{timeAgo(post.createdAt)}</span>
          {post.scope === 'global' && (
            <span className="ml-1 text-[10px] font-medium px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded">Global</span>
          )}
        </div>
        <h3 className="text-base font-bold text-gray-900 mb-1.5 line-clamp-2 group-hover:text-blue-700 transition-colors">
          {post.title}
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed mb-3 line-clamp-2">
          {post.content?.length > 120 ? post.content.slice(0, 120) + '...' : post.content}
        </p>
        <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
          <button
            onClick={handleLike}
            disabled={isLiking}
            className={`flex items-center gap-1.5 text-sm transition-all duration-200 ${
              post.isLiked ? 'text-red-500 hover:text-red-600' : 'text-gray-400 hover:text-red-500'
            } ${isLiking ? 'opacity-50' : ''}`}
          >
            <span className={`inline-flex ${justLiked ? 'animate-heart-pop' : ''}`}>
              {post.isLiked ? <HiHeart size={18} /> : <HiOutlineHeart size={18} />}
            </span>
            <span className="font-medium tabular-nums">{post.likesCount || 0}</span>
          </button>
          <div className="flex items-center gap-1.5 text-sm text-gray-400">
            <HiOutlineChatBubbleOvalLeft size={18} />
            <span className="font-medium">{post.commentsCount || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Inline Event Card ───────────────────────────────────────
const EventCardMini = ({ event, formatEventDate, getInitials, index }) => {
  const isPast = new Date(event.eventDate) < new Date();
  const availableSeats = event.totalSeats != null && event.totalSeats > 0 ? event.totalSeats - event.registeredCount : null;
  const seatsPercentage = event.totalSeats && event.totalSeats > 0 ? Math.min(100, Math.round((event.registeredCount / event.totalSeats) * 100)) : 0;

  const getTimeDisplay = () => {
    if (isPast) return null;
    const diff = new Date(event.eventDate) - new Date();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days <= 7) return `In ${days} days`;
    return null;
  };

  const timeDisplay = getTimeDisplay();

  const getStatusBadge = () => {
    if (isPast) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Past</span>;
    if (event.status === 'full') return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">Full</span>;
    return (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-600 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
        Open
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:border-blue-200 transition-all duration-300 overflow-hidden group hover:-translate-y-1 hover:shadow-lg">
      {/* Banner */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-gradient-to-br from-blue-100 via-blue-50 to-indigo-100">
        {event.bannerImage ? (
          <img src={event.bannerImage} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <HiOutlineCalendarDays size={40} className="text-blue-300" />
          </div>
        )}
        <div className="absolute top-2 left-2 flex items-center gap-1.5">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border backdrop-blur-sm ${CATEGORY_COLORS[event.category] || CATEGORY_COLORS.Other}`}>
            {event.category}
          </span>
        </div>
        <div className="absolute top-2 right-2">{getStatusBadge()}</div>
        {timeDisplay && !isPast && (
          <div className="absolute bottom-2 left-2">
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-md ${
              timeDisplay === 'Today' || timeDisplay === 'Tomorrow' ? 'bg-amber-500/90 text-white' : 'bg-black/60 text-white'
            }`}>
              {timeDisplay}
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-700 transition-colors">
          {event.title}
        </h3>
        <div className="space-y-1.5 mb-3">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <HiOutlineCalendarDays size={14} className="text-blue-500 flex-shrink-0" />
            <span>{formatEventDate(event.eventDate)}</span>
            <span className="text-gray-300">·</span>
            <HiOutlineClock size={14} className="text-blue-500 flex-shrink-0" />
            <span>{event.eventTime}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {event.mode === 'Online' ? <HiOutlineComputerDesktop size={14} /> : <HiOutlineMapPin size={14} />}
            <span>{event.mode}</span>
            {event.mode !== 'Online' && event.location && (
              <><span className="text-gray-300">·</span><span className="truncate">{event.location}</span></>
            )}
          </div>
        </div>

        {/* Seats */}
        {event.totalSeats != null && event.totalSeats > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-500 flex items-center gap-1">
                <HiOutlineUserGroup size={14} />
                {event.registeredCount} / {event.totalSeats} seats
              </span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  seatsPercentage >= 100 ? 'bg-red-500' : seatsPercentage >= 80 ? 'bg-amber-500' : 'bg-blue-500'
                }`}
                style={{ width: `${seatsPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <span className="text-xs text-gray-400">
            {event.college?.abbreviation || event.college?.name}
          </span>
          {event.isRegistered && (
            <span className="text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-lg flex items-center gap-1">
              <HiOutlineCheckCircle size={14} />
              Registered
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicProfile;
