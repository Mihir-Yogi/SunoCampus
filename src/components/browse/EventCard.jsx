import { useState, useEffect, useRef } from 'react';
import {
  HiOutlineCalendarDays,
  HiOutlineClock,
  HiOutlineMapPin,
  HiOutlineComputerDesktop,
  HiOutlineUserGroup,
  HiOutlineExclamationTriangle,
  HiOutlineCheckCircle,
  HiOutlineEllipsisVertical,
  HiOutlineFlag,
} from 'react-icons/hi2';

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

const MODE_ICONS = {
  Online: <HiOutlineComputerDesktop size={14} />,
  Offline: <HiOutlineMapPin size={14} />,
  Hybrid: <HiOutlineComputerDesktop size={14} />,
};

const EventCard = ({ event, onRegister, onOpenEvent, onAuthorClick, onReport, index = 0 }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [justRegistered, setJustRegistered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const progressRef = useRef(null);
  const menuRef = useRef(null);
  const [progressAnimated, setProgressAnimated] = useState(false);

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    const handleClick = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showMenu]);

  const isPast = new Date(event.eventDate) < new Date();
  const deadlinePassed = event.registrationDeadline
    ? new Date(event.registrationDeadline) < new Date()
    : false;
  const availableSeats = event.totalSeats != null && event.totalSeats > 0 ? event.totalSeats - event.registeredCount : null;
  const seatsLow = availableSeats !== null && availableSeats > 0 && availableSeats <= Math.ceil(event.totalSeats * 0.2);

  const canRegister =
    !event.isRegistered &&
    event.status === 'open' &&
    !isPast &&
    !deadlinePassed &&
    (availableSeats === null || availableSeats > 0);

  // Animate progress bar on scroll into view
  useEffect(() => {
    if (!progressRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setProgressAnimated(true);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(progressRef.current);
    return () => observer.disconnect();
  }, []);

  const handleRegister = async (e) => {
    e.stopPropagation();
    if (isRegistering || !canRegister) return;
    setIsRegistering(true);
    try {
      await onRegister(event);
      setJustRegistered(true);
    } finally {
      setIsRegistering(false);
    }
  };

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  // Time display helper
  const getTimeDisplay = () => {
    if (isPast) return null;
    const diff = new Date(event.eventDate) - new Date();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days <= 7) return `In ${days} days`;
    return null;
  };

  // Deadline display
  const getDeadlineDisplay = () => {
    if (!event.registrationDeadline || deadlinePassed || isPast) return null;
    const diff = new Date(event.registrationDeadline) - new Date();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 24) return `Closes in ${hours}h`;
    const days = Math.floor(hours / 24);
    if (days <= 3) return `Closes in ${days}d`;
    return null;
  };

  const timeDisplay = getTimeDisplay();
  const deadlineDisplay = getDeadlineDisplay();

  // Author initials
  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  // Status badge
  const getStatusBadge = () => {
    if (isPast) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Past</span>;
    if (event.status === 'full') return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">Full</span>;
    if (event.status === 'cancelled') return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">Cancelled</span>;
    return (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-600 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-live-pulse" />
        Open
      </span>
    );
  };

  // Seats progress
  const seatsPercentage = event.totalSeats && event.totalSeats > 0
    ? Math.min(100, Math.round((event.registeredCount / event.totalSeats) * 100))
    : 0;

  return (
    <div
      onClick={() => onOpenEvent(event._id)}
      className="bg-white rounded-xl border border-gray-200 hover:border-blue-200 transition-all duration-300 cursor-pointer overflow-hidden group animate-card-enter card-glow-border relative hover:-translate-y-1 hover:shadow-[0_8px_30px_-12px_rgba(59,130,246,0.15)]"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Banner */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-gradient-to-br from-blue-100 via-blue-50 to-indigo-100">
        {event.bannerImage ? (
          <>
            {!imageLoaded && <div className="absolute inset-0 skeleton-shimmer" />}
            <img
              src={event.bannerImage}
              alt={event.title}
              onLoad={() => setImageLoaded(true)}
              className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${imageLoaded ? 'animate-image-reveal' : 'opacity-0'}`}
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <HiOutlineCalendarDays size={40} className="text-blue-300 group-hover:scale-110 transition-transform duration-300" />
          </div>
        )}

        {/* Overlay badges */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border backdrop-blur-sm ${CATEGORY_COLORS[event.category] || CATEGORY_COLORS.Other}`}>
            {event.category}
          </span>
        </div>
        <div className="absolute top-2 right-2 flex items-center gap-1.5">
          {getStatusBadge()}
        </div>

        {/* Time urgency badge */}
        {timeDisplay && !isPast && (
          <div className="absolute bottom-2 left-2">
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-md ${timeDisplay === 'Today' || timeDisplay === 'Tomorrow' ? 'bg-amber-500/90 text-white' : 'bg-black/60 text-white'}`}>
              {timeDisplay}
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        {/* Title */}
        <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-700 transition-colors">
          {event.title}
        </h3>

        {/* Meta: date, time, mode */}
        <div className="space-y-1.5 mb-3">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <HiOutlineCalendarDays size={14} className="text-blue-500 flex-shrink-0" />
            <span>{formatDate(event.eventDate)}</span>
            <span className="text-gray-300">·</span>
            <HiOutlineClock size={14} className="text-blue-500 flex-shrink-0" />
            <span>{event.eventTime}</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            {MODE_ICONS[event.mode]}
            <span>{event.mode}</span>
            {event.mode !== 'Online' && event.location && (
              <>
                <span className="text-gray-300">·</span>
                <span className="truncate">{event.location}</span>
              </>
            )}
          </div>
        </div>

        {/* Seats Progress */}
        {event.totalSeats != null && event.totalSeats > 0 && (
          <div className="mb-3" ref={progressRef}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-500 flex items-center gap-1">
                <HiOutlineUserGroup size={14} />
                <span className="tabular-nums">{event.registeredCount}</span> / {event.totalSeats} seats
              </span>
              {seatsLow && !isPast && event.status === 'open' && (
                <span className="text-amber-600 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-live-pulse" />
                  {availableSeats} left!
                </span>
              )}
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${
                  seatsPercentage >= 100 ? 'bg-red-500' : seatsPercentage >= 80 ? 'bg-amber-500' : 'bg-blue-500'
                }`}
                style={{ width: progressAnimated ? `${seatsPercentage}%` : '0%' }}
              />
            </div>
          </div>
        )}

        {/* Deadline warning */}
        {deadlineDisplay && (
          <div className="flex items-center gap-1.5 text-[11px] text-amber-600 font-medium mb-2 bg-amber-50 px-2 py-1 rounded-lg">
            <HiOutlineExclamationTriangle size={12} />
            Registration {deadlineDisplay.toLowerCase()}
          </div>
        )}

        {/* Author + College */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div
            className="flex items-center gap-2 min-w-0 cursor-pointer group/author"
            onClick={(e) => {
              e.stopPropagation();
              if (event.createdBy?._id && onAuthorClick) onAuthorClick(event.createdBy._id);
            }}
          >
            {event.createdBy?.avatar || event.createdBy?.profilePicture ? (
              <img
                src={event.createdBy.avatar || event.createdBy.profilePicture}
                alt={event.createdBy.fullName}
                className="w-6 h-6 rounded-full object-cover flex-shrink-0 ring-1 ring-white group-hover/author:ring-blue-300 transition-all"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 ring-1 ring-white group-hover/author:ring-blue-300 transition-all">
                {getInitials(event.createdBy?.fullName)}
              </div>
            )}
            <span className="text-xs text-gray-500 truncate group-hover/author:text-blue-600 transition-colors">
              {event.createdBy?.fullName || 'Unknown'}
            </span>
            {event.scope === 'global' && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded flex-shrink-0">
                Global
              </span>
            )}

            {/* More menu */}
            <div className="relative flex-shrink-0" ref={menuRef}>
              <button
                onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors opacity-0 group-hover:opacity-100"
              >
                <HiOutlineEllipsisVertical size={16} />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-gray-200 py-1.5 z-20 animate-fadeIn">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      if (onReport) onReport({ type: 'event', userId: event.createdBy?._id, contentId: event._id, title: event.title });
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <HiOutlineFlag size={15} /> Report Event
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Register Button */}
          {!isPast && event.status !== 'cancelled' && (
            <div onClick={(e) => e.stopPropagation()}>
              {event.isRegistered || justRegistered ? (
                <span className="text-xs font-semibold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg animate-badge-pop flex items-center gap-1">
                  <HiOutlineCheckCircle size={14} />
                  Registered
                </span>
              ) : canRegister ? (
                <button
                  onClick={handleRegister}
                  disabled={isRegistering}
                  className="relative text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded-lg transition-all duration-200 disabled:opacity-50 hover:shadow-lg active:scale-95 overflow-hidden"
                >
                  <span className={isRegistering ? 'opacity-0' : ''}>Register</span>
                  {isRegistering && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </span>
                  )}
                </button>
              ) : (
                <span className="text-xs font-medium text-gray-400 px-3 py-1">
                  {deadlinePassed ? 'Deadline passed' : 'Unavailable'}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventCard;
