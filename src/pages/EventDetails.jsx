import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  HiOutlineCalendarDays,
  HiOutlineClock,
  HiOutlineMapPin,
  HiOutlineComputerDesktop,
  HiOutlineUserGroup,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineArrowLeft,
  HiOutlineShare,
  HiOutlineBookmark,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineFlag,
  HiOutlineGlobeAlt,
  HiOutlineBuildingLibrary,
  HiOutlineCheckBadge,
  HiOutlineTicket,
  HiOutlineInformationCircle,
  HiOutlineQuestionMarkCircle,
  HiOutlineListBullet,
  HiOutlineSparkles,
  HiOutlineLink,
} from 'react-icons/hi2';
import api from '../services/api';
import ReportModal from '../components/ReportModal';
import Toast from '../components/Toast';

// ─── Category badge colors (consistent with EventCard) ────────────────────────
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
  Online: <HiOutlineComputerDesktop size={16} />,
  Offline: <HiOutlineMapPin size={16} />,
  Hybrid: <HiOutlineComputerDesktop size={16} />,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
};

const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

const formatShortDate = (date) =>
  new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

// ─── Countdown Hook ──────────────────────────────────────────────────────────
const useCountdown = (targetDate) => {
  const calcTimeLeft = useCallback(() => {
    const diff = new Date(targetDate) - new Date();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
      expired: false,
    };
  }, [targetDate]);

  const [timeLeft, setTimeLeft] = useState(calcTimeLeft);

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(calcTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, [calcTimeLeft]);

  return timeLeft;
};

// ─── FAQ Accordion Item ──────────────────────────────────────────────────────
const FAQItem = ({ question, answer, isOpen, onToggle }) => (
  <div className="border border-gray-200 rounded-xl overflow-hidden transition-all duration-200">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-5 py-4 text-left group hover:bg-gray-50 transition-colors"
    >
      <span className="text-sm font-semibold text-gray-800 pr-4">{question}</span>
      <span className="text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0">
        {isOpen ? <HiOutlineChevronUp size={18} /> : <HiOutlineChevronDown size={18} />}
      </span>
    </button>
    <div
      className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
    >
      <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
        {answer}
      </div>
    </div>
  </div>
);

// ─── Countdown Block ──────────────────────────────────────────────────────────
const CountdownBlock = ({ label, value }) => (
  <div className="flex flex-col items-center">
    <span className="text-2xl font-bold text-gray-900 tabular-nums leading-none">{String(value).padStart(2, '0')}</span>
    <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mt-1">{label}</span>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // State
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [openFAQ, setOpenFAQ] = useState(null);

  // Registration
  const [isRegistering, setIsRegistering] = useState(false);
  const [showRegForm, setShowRegForm] = useState(false);
  const [formResponses, setFormResponses] = useState({});
  const [regError, setRegError] = useState('');

  // Report
  const [reportModal, setReportModal] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);

  // Progress bar
  const progressRef = useRef(null);
  const [progressAnimated, setProgressAnimated] = useState(false);

  // ─── Fetch event ──────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/browse/events/${id}`);
        setEvent(res.data.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load event');
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  // ─── Animate progress on scroll ──────────────────────────────────────────
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
  }, [event]);

  // ─── Derived values ──────────────────────────────────────────────────────
  const isPast = event ? new Date(event.eventDate) < new Date() : false;
  const deadlinePassed = event?.registrationDeadline ? new Date(event.registrationDeadline) < new Date() : false;
  const availableSeats = event?.totalSeats != null ? event.totalSeats - event.registeredCount : null;
  const seatsPercentage = event?.totalSeats ? Math.min(100, Math.round((event.registeredCount / event.totalSeats) * 100)) : 0;
  const seatsLow = availableSeats !== null && availableSeats > 0 && availableSeats <= Math.ceil((event?.totalSeats || 0) * 0.2);

  const canRegister = event && !event.isRegistered && event.status === 'open' && !isPast && !deadlinePassed && (availableSeats === null || availableSeats > 0);

  // Countdown target: registration deadline if exists and not passed, else event date
  const countdownTarget = event?.registrationDeadline && !deadlinePassed ? event.registrationDeadline : event?.eventDate;
  const countdown = useCountdown(countdownTarget || new Date());
  const countdownLabel = event?.registrationDeadline && !deadlinePassed ? 'Registration closes in' : 'Event starts in';

  // ─── Registration handler ────────────────────────────────────────────────
  const handleEnroll = async () => {
    if (!canRegister) return;

    // If event has custom form fields, show the form first
    if (event.customFormFields && event.customFormFields.length > 0 && !showRegForm) {
      setShowRegForm(true);
      setFormResponses({});
      setRegError('');
      return;
    }

    setIsRegistering(true);
    setRegError('');
    try {
      const res = await api.post(`/browse/events/${event._id}/register`, { formResponses });
      setEvent(prev => ({
        ...prev,
        isRegistered: true,
        registeredCount: res.data.data.registeredCount,
        availableSeats: res.data.data.availableSeats,
        status: res.data.data.status,
      }));
      setShowRegForm(false);
      setToast({ type: 'success', message: res.data.message || 'Successfully registered!' });
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed';
      if (showRegForm) {
        setRegError(msg);
      } else {
        setToast({ type: 'error', message: msg });
      }
    } finally {
      setIsRegistering(false);
    }
  };

  // ─── Share handler ────────────────────────────────────────────────────────
  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: event?.title, text: event?.description?.slice(0, 100), url });
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setToast({ type: 'success', message: 'Link copied to clipboard!' });
    }
  };

  // ─── Custom form field renderer ──────────────────────────────────────────
  const renderFormField = (field) => {
    const value = formResponses[field.fieldId] || '';
    const onChange = (val) => setFormResponses(prev => ({ ...prev, [field.fieldId]: val }));
    const commonClass = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200';

    switch (field.type) {
      case 'text': case 'email': case 'phone': case 'url':
        return <input type={field.type === 'phone' ? 'tel' : field.type} value={value} onChange={e => onChange(e.target.value)} placeholder={field.placeholder || ''} required={field.required} className={commonClass} />;
      case 'number':
        return <input type="number" value={value} onChange={e => onChange(e.target.value)} placeholder={field.placeholder || ''} required={field.required} className={commonClass} />;
      case 'date':
        return <input type="date" value={value} onChange={e => onChange(e.target.value)} required={field.required} className={commonClass} />;
      case 'textarea':
        return <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={field.placeholder || ''} required={field.required} rows={3} className={`${commonClass} resize-none`} />;
      case 'dropdown':
        return (
          <select value={value} onChange={e => onChange(e.target.value)} required={field.required} className={commonClass}>
            <option value="">{field.placeholder || 'Select...'}</option>
            {(field.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        );
      case 'radio':
        return (
          <div className="space-y-1.5">
            {(field.options || []).map(opt => (
              <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" name={field.fieldId} value={opt} checked={value === opt} onChange={() => onChange(opt)} required={field.required} className="text-blue-600 focus:ring-blue-500" />
                {opt}
              </label>
            ))}
          </div>
        );
      case 'checkbox':
        return (
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={!!value} onChange={e => onChange(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500" />
            {field.placeholder || field.label}
          </label>
        );
      case 'multi-select':
        return (
          <div className="space-y-1.5">
            {(field.options || []).map(opt => (
              <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={Array.isArray(value) && value.includes(opt)} onChange={e => { const arr = Array.isArray(value) ? [...value] : []; if (e.target.checked) arr.push(opt); else arr.splice(arr.indexOf(opt), 1); onChange(arr); }} className="rounded text-blue-600 focus:ring-blue-500" />
                {opt}
              </label>
            ))}
          </div>
        );
      default:
        return <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={field.placeholder || ''} required={field.required} className={commonClass} />;
    }
  };

  // ─── FAQ Data (generated from event) ──────────────────────────────────────
  const faqItems = [];
  if (event) {
    if (event.mode === 'Online' || event.mode === 'Hybrid') {
      faqItems.push({ q: 'How do I join the event online?', a: event.zoomLink ? 'A meeting link will be shared with registered participants before the event. Check your email for the link.' : 'The meeting link will be shared with registered participants before the event via email.' });
    }
    if (event.totalSeats) {
      faqItems.push({ q: 'What happens if seats are full?', a: 'Once all seats are filled, registration will be closed automatically. We recommend registering early to secure your spot.' });
    }
    if (event.registrationDeadline) {
      faqItems.push({ q: 'Can I register after the deadline?', a: `No, registration closes on ${formatShortDate(event.registrationDeadline)}. Make sure to register before the deadline.` });
    }
    faqItems.push({ q: 'Will I receive a confirmation?', a: 'Yes, you will receive a confirmation email once you successfully register for the event.' });
    faqItems.push({ q: 'Can I cancel my registration?', a: 'Currently, registration cancellation is not available. Please make sure before registering.' });
  }

  // ─── Rules & Guidelines ───────────────────────────────────────────────────
  const guidelines = [
    'Be on time for the event',
    event?.mode !== 'Online' && 'Carry your college ID card',
    'Follow the code of conduct',
    event?.mode === 'Online' && 'Ensure stable internet connection',
    event?.mode === 'Online' && 'Keep your camera on during the session',
    'Be respectful to speakers and other participants',
    event?.totalSeats && 'Registered seats are non-transferable',
    'Contact the organizer for any queries',
  ].filter(Boolean);

  // ─── Loading skeleton ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Back button skeleton */}
          <div className="w-32 h-8 skeleton-shimmer rounded-lg mb-6" />

          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_300px] gap-6">
            {/* Left */}
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="aspect-[16/10] skeleton-shimmer" />
                <div className="p-4 space-y-3">
                  <div className="h-4 w-3/4 skeleton-shimmer rounded" />
                  <div className="h-3 w-1/2 skeleton-shimmer rounded" />
                  <div className="h-3 w-2/3 skeleton-shimmer rounded" />
                  <div className="h-3 w-1/2 skeleton-shimmer rounded" />
                </div>
              </div>
              <div className="h-12 skeleton-shimmer rounded-lg" />
              <div className="flex gap-3">
                <div className="h-10 flex-1 skeleton-shimmer rounded-lg" />
                <div className="h-10 flex-1 skeleton-shimmer rounded-lg" />
              </div>
            </div>
            {/* Center */}
            <div className="space-y-4">
              <div className="h-8 w-3/4 skeleton-shimmer rounded" />
              <div className="h-4 w-full skeleton-shimmer rounded" />
              <div className="h-4 w-5/6 skeleton-shimmer rounded" />
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="space-y-2">
                  {[1,2,3,4].map(i => <div key={i} className="h-3 skeleton-shimmer rounded" style={{ width: `${100 - i * 10}%` }} />)}
                </div>
              </div>
            </div>
            {/* Right */}
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="h-16 skeleton-shimmer rounded mb-3" />
                <div className="h-3 w-1/2 skeleton-shimmer rounded" />
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="h-12 skeleton-shimmer rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Error state ──────────────────────────────────────────────────────────
  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center animate-fadeIn">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
            <HiOutlineExclamationTriangle size={36} className="text-red-400" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">Event not found</h2>
          <p className="text-sm text-gray-500 mb-6">{error || 'This event may have been removed or doesn\'t exist.'}</p>
          <button
            onClick={() => navigate('/browse')}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-700 to-blue-800 text-white text-sm font-semibold rounded-lg hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
          >
            Back to Browse
          </button>
        </div>
      </div>
    );
  }

  // ─── Status badge ─────────────────────────────────────────────────────────
  const getStatusBadge = () => {
    if (isPast) return <span className="text-xs font-bold px-3 py-1 rounded-full bg-gray-100 text-gray-500">Past Event</span>;
    if (event.status === 'full') return <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-50 text-red-600">Full</span>;
    if (event.status === 'cancelled') return <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-50 text-red-600">Cancelled</span>;
    return (
      <span className="text-xs font-bold px-3 py-1 rounded-full bg-green-50 text-green-600 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-live-pulse" />
        Open for Registration
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* ─── Back nav ──────────────────────────────────────────────── */}
        <button
          onClick={() => navigate(-1)}
          className="group inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 font-medium mb-5 transition-colors duration-200"
        >
          <HiOutlineArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          Back
        </button>

        {/* ═══════════════════════════════════════════════════════════════
            3-COLUMN LAYOUT
        ═══════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_300px] gap-6 animate-fadeIn">

          {/* ╔═══════════════════════════════════════════════════════════╗
              ║  LEFT SIDEBAR                                           ║
              ╚═══════════════════════════════════════════════════════════╝ */}
          <aside className="space-y-4 order-1 lg:order-1">
            <div className="lg:sticky lg:top-20 space-y-4">

              {/* ─── Banner Image Card ──────────────────────────────── */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-blue-100 via-blue-50 to-indigo-100">
                  {event.bannerImage ? (
                    <>
                      {!imageLoaded && <div className="absolute inset-0 skeleton-shimmer" />}
                      <img
                        src={event.bannerImage}
                        alt={event.title}
                        onLoad={() => setImageLoaded(true)}
                        className={`w-full h-full object-cover ${imageLoaded ? 'animate-image-reveal' : 'opacity-0'}`}
                      />
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <HiOutlineCalendarDays size={48} className="text-blue-300" />
                    </div>
                  )}
                  {/* Status overlay */}
                  <div className="absolute top-3 right-3">
                    {getStatusBadge()}
                  </div>
                </div>
              </div>

              {/* ─── Organizer Card ─────────────────────────────────── */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Organizer</p>
                <div
                  className="flex items-center gap-3 cursor-pointer group"
                  onClick={() => event.createdBy?._id && navigate(`/user/${event.createdBy._id}`)}
                >
                  {event.createdBy?.avatar || event.createdBy?.profilePicture ? (
                    <img
                      src={event.createdBy.avatar || event.createdBy.profilePicture}
                      alt={event.createdBy.fullName}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm group-hover:ring-blue-200 transition-all"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-sm font-bold ring-2 ring-white shadow-sm group-hover:ring-blue-200 transition-all">
                      {getInitials(event.createdBy?.fullName)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors truncate">
                        {event.createdBy?.fullName || 'Unknown'}
                      </span>
                      <HiOutlineCheckBadge size={16} className="text-blue-500 flex-shrink-0" />
                    </div>
                    <span className="text-xs text-gray-500">{event.college?.name || event.college?.abbreviation || 'College'}</span>
                  </div>
                </div>
              </div>

              {/* ─── Event Details Card ─────────────────────────────── */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Event Details</p>
                <div className="space-y-3">
                  {/* Category */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                      <HiOutlineTicket size={16} className="text-gray-500" />
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400 font-medium">Category</p>
                      <span className={`inline-flex text-xs font-semibold px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[event.category] || CATEGORY_COLORS.Other}`}>
                        {event.category}
                      </span>
                    </div>
                  </div>

                  {/* Visibility */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                      {event.scope === 'global' ? <HiOutlineGlobeAlt size={16} className="text-gray-500" /> : <HiOutlineBuildingLibrary size={16} className="text-gray-500" />}
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400 font-medium">Visibility</p>
                      <p className="text-sm text-gray-700 font-medium capitalize">{event.scope}</p>
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                      <HiOutlineCalendarDays size={16} className="text-gray-500" />
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400 font-medium">Date & Time</p>
                      <p className="text-sm text-gray-700 font-medium">{formatDate(event.eventDate)}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <HiOutlineClock size={12} /> {event.eventTime}
                      </p>
                    </div>
                  </div>

                  {/* Venue / Mode */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                      {MODE_ICONS[event.mode]}
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400 font-medium">Venue</p>
                      <p className="text-sm text-gray-700 font-medium">{event.mode}</p>
                      {event.mode !== 'Online' && event.location && (
                        <p className="text-xs text-gray-500 mt-0.5">{event.location}</p>
                      )}
                      {(event.mode === 'Online' || event.mode === 'Hybrid') && event.zoomLink && (
                        <a
                          href={event.zoomLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mt-0.5 font-medium"
                        >
                          <HiOutlineLink size={12} /> Meeting Link
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Registration Deadline */}
                  {event.registrationDeadline && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                        <HiOutlineExclamationTriangle size={16} className="text-gray-500" />
                      </div>
                      <div>
                        <p className="text-[11px] text-gray-400 font-medium">Registration Deadline</p>
                        <p className={`text-sm font-medium ${deadlinePassed ? 'text-red-500' : 'text-gray-700'}`}>
                          {formatShortDate(event.registrationDeadline)}
                        </p>
                        {deadlinePassed && <p className="text-[11px] text-red-400 font-medium">Deadline passed</p>}
                      </div>
                    </div>
                  )}

                  {/* Seats */}
                  {event.totalSeats != null && (
                    <div className="flex items-center gap-3" ref={progressRef}>
                      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                        <HiOutlineUserGroup size={16} className="text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-gray-400 font-medium">Seats Available</p>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-700 font-medium">
                            <span className="tabular-nums">{event.registeredCount}</span> / {event.totalSeats}
                          </p>
                          {seatsLow && !isPast && event.status === 'open' && (
                            <span className="text-[11px] text-amber-600 font-semibold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-live-pulse" />
                              {availableSeats} left
                            </span>
                          )}
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1.5">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ease-out ${seatsPercentage >= 100 ? 'bg-red-500' : seatsPercentage >= 80 ? 'bg-amber-500' : 'bg-blue-500'}`}
                            style={{ width: progressAnimated ? `${seatsPercentage}%` : '0%' }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ─── CTA Buttons ────────────────────────────────────── */}
              <div className="space-y-2.5">
                {/* Enroll Now / Registered */}
                {!isPast && event.status !== 'cancelled' && (
                  event.isRegistered ? (
                    <div className="flex items-center justify-center gap-2 w-full py-3 bg-green-50 border border-green-200 text-green-700 text-sm font-semibold rounded-lg animate-badge-pop">
                      <HiOutlineCheckCircle size={18} />
                      You're Registered
                    </div>
                  ) : canRegister ? (
                    <button
                      onClick={handleEnroll}
                      disabled={isRegistering}
                      className="w-full py-3 bg-gradient-to-r from-blue-700 to-blue-800 text-white text-sm font-semibold rounded-lg hover:from-blue-800 hover:to-blue-900 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 active:scale-[0.97] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isRegistering ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Registering...
                        </>
                      ) : (
                        <>
                          <HiOutlineTicket size={18} />
                          Enroll Now
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="w-full py-3 bg-gray-100 text-gray-400 text-sm font-medium rounded-lg text-center cursor-not-allowed">
                      {event.status === 'full' ? 'Event Full' : deadlinePassed ? 'Deadline Passed' : 'Unavailable'}
                    </div>
                  )
                )}
                {isPast && (
                  <div className="w-full py-3 bg-gray-100 text-gray-400 text-sm font-medium rounded-lg text-center">
                    Event has ended
                  </div>
                )}

                {/* Save & Share */}
                <div className="flex gap-2.5">
                  <button
                    onClick={() => setSaved(!saved)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg border transition-all duration-200 active:scale-[0.97] ${
                      saved
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    <HiOutlineBookmark size={16} className={saved ? 'fill-blue-600 text-blue-600' : ''} />
                    {saved ? 'Saved' : 'Save'}
                  </button>
                  <button
                    onClick={handleShare}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 active:scale-[0.97]"
                  >
                    <HiOutlineShare size={16} />
                    {copied ? 'Copied!' : 'Share'}
                  </button>
                </div>
              </div>

            </div>{/* end sticky wrapper */}
          </aside>

          {/* ╔═══════════════════════════════════════════════════════════╗
              ║  CENTER CONTENT                                         ║
              ╚═══════════════════════════════════════════════════════════╝ */}
          <main className="order-2 lg:order-2 min-w-0 space-y-5">

            {/* ─── Event Title ──────────────────────────────────────── */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${CATEGORY_COLORS[event.category] || CATEGORY_COLORS.Other}`}>
                  {event.category}
                </span>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${event.scope === 'global' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                  {event.scope === 'global' ? 'Global' : 'Campus'}
                </span>
                {getStatusBadge()}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                {event.title}
              </h1>

              {/* Quick meta */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                  <HiOutlineCalendarDays size={15} className="text-blue-500" />
                  {formatDate(event.eventDate)}
                </span>
                <span className="flex items-center gap-1.5">
                  <HiOutlineClock size={15} className="text-blue-500" />
                  {event.eventTime}
                </span>
                <span className="flex items-center gap-1.5">
                  {MODE_ICONS[event.mode]}
                  {event.mode}
                  {event.mode !== 'Online' && event.location && ` · ${event.location}`}
                </span>
              </div>
            </div>

            {/* ─── Short Description ───────────────────────────────── */}
            {event.description && (
              <p className="text-gray-600 leading-relaxed text-[15px]">
                {event.description.length > 200 ? event.description.slice(0, 200) + '...' : event.description}
              </p>
            )}

            {/* ─── Mobile-only: Banner Image ───────────────────────── */}
            <div className="lg:hidden">
              {event.bannerImage && (
                <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                  <img
                    src={event.bannerImage}
                    alt={event.title}
                    className="w-full object-cover max-h-64"
                  />
                </div>
              )}
            </div>

            {/* ─── Full Description Card ───────────────────────────── */}
            {event.description && event.description.length > 200 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-3">
                  <HiOutlineInformationCircle size={18} className="text-blue-600" />
                  <h2 className="text-base font-bold text-gray-900">About This Event</h2>
                </div>
                <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {event.description}
                </div>
              </div>
            )}

            {/* ─── If description is short, show it directly in a card */}
            {event.description && event.description.length <= 200 && event.description.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-3">
                  <HiOutlineInformationCircle size={18} className="text-blue-600" />
                  <h2 className="text-base font-bold text-gray-900">About This Event</h2>
                </div>
                <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {event.description}
                </div>
              </div>
            )}

            {/* ─── Mobile-only: Enrollment Stats ───────────────────── */}
            <div className="lg:hidden grid grid-cols-2 gap-3">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 text-center">
                <p className="text-2xl font-bold text-blue-700 tabular-nums">{event.registeredCount}</p>
                <p className="text-xs text-gray-500 mt-1">Students Enrolled</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 text-center">
                <p className={`text-2xl font-bold tabular-nums ${seatsLow ? 'text-amber-600' : availableSeats === 0 ? 'text-red-500' : 'text-gray-900'}`}>
                  {availableSeats !== null ? availableSeats : '∞'}
                </p>
                <p className="text-xs text-gray-500 mt-1">Seats Remaining</p>
              </div>
            </div>

            {/* ─── Mobile-only: Enroll CTA ─────────────────────────── */}
            <div className="lg:hidden">
              {!isPast && event.status !== 'cancelled' && (
                event.isRegistered ? (
                  <div className="flex items-center justify-center gap-2 w-full py-3 bg-green-50 border border-green-200 text-green-700 text-sm font-semibold rounded-lg">
                    <HiOutlineCheckCircle size={18} />
                    You're Registered
                  </div>
                ) : canRegister ? (
                  <button
                    onClick={handleEnroll}
                    disabled={isRegistering}
                    className="w-full py-3 bg-gradient-to-r from-blue-700 to-blue-800 text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all duration-300 active:scale-[0.97] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isRegistering ? (
                      <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Registering...</>
                    ) : (
                      <><HiOutlineTicket size={18} /> Enroll Now</>
                    )}
                  </button>
                ) : null
              )}
            </div>

            {/* ─── Rules & Guidelines ──────────────────────────────── */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <HiOutlineListBullet size={18} className="text-blue-600" />
                <h2 className="text-base font-bold text-gray-900">Rules & Guidelines</h2>
              </div>
              <ul className="space-y-2.5">
                {guidelines.map((rule, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                    <span className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold text-blue-600">{i + 1}</span>
                    </span>
                    {rule}
                  </li>
                ))}
              </ul>
            </div>

            {/* ─── Custom Registration Fields Preview ──────────────── */}
            {event.customFormFields && event.customFormFields.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-3">
                  <HiOutlineSparkles size={18} className="text-blue-600" />
                  <h2 className="text-base font-bold text-gray-900">Registration Requirements</h2>
                </div>
                <p className="text-sm text-gray-500 mb-3">You'll need to fill out the following when registering:</p>
                <div className="flex flex-wrap gap-2">
                  {event.customFormFields.map(field => (
                    <span
                      key={field.fieldId}
                      className="text-xs px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200 text-gray-600 flex items-center gap-1"
                    >
                      {field.label}
                      {field.required && <span className="text-red-400 text-[10px]">*</span>}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ─── FAQ Section ─────────────────────────────────────── */}
            {faqItems.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <HiOutlineQuestionMarkCircle size={18} className="text-blue-600" />
                  <h2 className="text-base font-bold text-gray-900">Frequently Asked Questions</h2>
                </div>
                <div className="space-y-2">
                  {faqItems.map((faq, i) => (
                    <FAQItem
                      key={i}
                      question={faq.q}
                      answer={faq.a}
                      isOpen={openFAQ === i}
                      onToggle={() => setOpenFAQ(openFAQ === i ? null : i)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ─── Report ──────────────────────────────────────────── */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setReportModal(true)}
                className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                <HiOutlineFlag size={14} />
                Report this event
              </button>
            </div>
          </main>

          {/* ╔═══════════════════════════════════════════════════════════╗
              ║  RIGHT SIDEBAR                                          ║
              ╚═══════════════════════════════════════════════════════════╝ */}
          <aside className="hidden lg:block order-3">
            <div className="sticky top-20 space-y-4">

              {/* ─── Enrollment Status Card ─────────────────────────── */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-4">Enrollment</p>
                <div className="text-center">
                  <p className="text-4xl font-bold text-blue-700 tabular-nums leading-none">{event.registeredCount}</p>
                  <p className="text-sm text-gray-500 mt-1.5">Students Enrolled</p>
                </div>

                {event.totalSeats != null && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-500">Capacity</span>
                      <span className="font-semibold text-gray-700 tabular-nums">{event.totalSeats}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ease-out ${seatsPercentage >= 100 ? 'bg-red-500' : seatsPercentage >= 80 ? 'bg-amber-500' : 'bg-blue-500'}`}
                        style={{ width: `${seatsPercentage}%` }}
                      />
                    </div>
                    <div className={`mt-2 text-center py-2 rounded-lg ${
                      availableSeats === 0 ? 'bg-red-50' : seatsLow ? 'bg-amber-50' : 'bg-blue-50'
                    }`}>
                      <span className={`text-lg font-bold tabular-nums ${
                        availableSeats === 0 ? 'text-red-600' : seatsLow ? 'text-amber-600' : 'text-blue-700'
                      }`}>
                        {availableSeats}
                      </span>
                      <p className={`text-[11px] font-medium ${
                        availableSeats === 0 ? 'text-red-500' : seatsLow ? 'text-amber-500' : 'text-blue-500'
                      }`}>
                        Seats Remaining
                      </p>
                    </div>
                  </div>
                )}

                {event.totalSeats == null && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="text-center py-2 rounded-lg bg-blue-50">
                      <span className="text-lg font-bold text-blue-700">∞</span>
                      <p className="text-[11px] font-medium text-blue-500">Unlimited Seats</p>
                    </div>
                  </div>
                )}
              </div>

              {/* ─── Countdown Timer Card ───────────────────────────── */}
              {!isPast && !countdown.expired && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-4">{countdownLabel}</p>
                  <div className="flex items-center justify-between px-2">
                    <CountdownBlock label="Days" value={countdown.days} />
                    <span className="text-xl font-light text-gray-300 -mt-4">:</span>
                    <CountdownBlock label="Hours" value={countdown.hours} />
                    <span className="text-xl font-light text-gray-300 -mt-4">:</span>
                    <CountdownBlock label="Mins" value={countdown.minutes} />
                    <span className="text-xl font-light text-gray-300 -mt-4">:</span>
                    <CountdownBlock label="Secs" value={countdown.seconds} />
                  </div>
                  {event.registrationDeadline && !deadlinePassed && (
                    <p className="text-[11px] text-amber-600 font-medium text-center mt-3 pt-3 border-t border-gray-100 flex items-center justify-center gap-1">
                      <HiOutlineExclamationTriangle size={12} />
                      Deadline: {formatShortDate(event.registrationDeadline)}
                    </p>
                  )}
                </div>
              )}

              {isPast && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 text-center">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Event Status</p>
                  <p className="text-sm text-gray-500">This event has already concluded.</p>
                </div>
              )}

              {/* ─── Quick Info ──────────────────────────────────────── */}
              <div className="px-1">
                <p className="text-[10px] text-gray-300 text-center">SunoCampus © {new Date().getFullYear()}</p>
              </div>

            </div>{/* end sticky wrapper */}
          </aside>

        </div>{/* end grid */}
      </div>

      {/* ═══ Registration Form Modal (for events with custom fields) ═══════════ */}
      {showRegForm && event.customFormFields && event.customFormFields.length > 0 && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-overlay-in"
          onClick={(e) => { if (e.target === e.currentTarget) setShowRegForm(false); }}
        >
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto animate-modal-in browse-scrollbar">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <div>
                <h3 className="font-bold text-gray-900">Register for Event</h3>
                <p className="text-xs text-gray-500 mt-0.5">{event.title}</p>
              </div>
              <button
                onClick={() => setShowRegForm(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleEnroll();
              }}
              className="px-6 py-4 space-y-4"
            >
              {event.customFormFields.map(field => (
                <div key={field.fieldId}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-0.5">*</span>}
                  </label>
                  {renderFormField(field)}
                </div>
              ))}

              {regError && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{regError}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRegForm(false)}
                  className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200 active:scale-[0.97]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRegistering}
                  className="flex-1 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-700 to-blue-800 rounded-lg hover:from-blue-800 hover:to-blue-900 transition-all duration-200 hover:shadow-md active:scale-[0.97] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isRegistering ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</>
                  ) : (
                    'Submit Registration'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ Report Modal ════════════════════════════════════════════════════════ */}
      <ReportModal
        isOpen={reportModal}
        onClose={() => setReportModal(false)}
        reportType="event"
        reportedUserId={event.createdBy?._id || ''}
        contentId={event._id}
        contentTitle={event.title}
      />

      {/* ═══ Toast ═══════════════════════════════════════════════════════════════ */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default EventDetails;
