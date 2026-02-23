import { useState, useEffect, useRef } from 'react';
import {
  HiOutlineXMark,
  HiOutlineFlag,
  HiOutlineExclamationTriangle,
  HiOutlineCheckCircle,
  HiOutlineShieldExclamation,
} from 'react-icons/hi2';
import api from '../services/api';

const CATEGORIES = [
  { value: 'spam', label: 'Spam', description: 'Misleading or repetitive content' },
  { value: 'harassment', label: 'Harassment', description: 'Bullying or targeting a person' },
  { value: 'inappropriate_content', label: 'Inappropriate Content', description: 'Offensive or unsuitable material' },
  { value: 'hate_speech', label: 'Hate Speech', description: 'Discriminatory or hateful language' },
  { value: 'misinformation', label: 'Misinformation', description: 'False or misleading information' },
  { value: 'impersonation', label: 'Impersonation', description: 'Pretending to be someone else' },
  { value: 'privacy_violation', label: 'Privacy Violation', description: 'Sharing private information' },
  { value: 'broken_link', label: 'Broken Link / Issue', description: 'Non-functional or broken content' },
  { value: 'other', label: 'Other', description: 'Something else not listed above' },
];

const ReportModal = ({ isOpen, onClose, reportType, reportedUserId, contentId, contentTitle }) => {
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const overlayRef = useRef(null);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setCategory('');
      setDescription('');
      setError('');
      setSuccess(false);
      setSubmitting(false);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!category) {
      setError('Please select a reason for reporting.');
      return;
    }
    if (description.length < 10) {
      setError('Please provide more details (at least 10 characters).');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/reports', {
        reportType,
        reportedUser: reportedUserId,
        reportedContentId: contentId || undefined,
        category,
        description: description.trim(),
      });
      setSuccess(true);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to submit report. Please try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const getTypeLabel = () => {
    switch (reportType) {
      case 'user': return 'User';
      case 'post': return 'Post';
      case 'event': return 'Event';
      case 'comment': return 'Comment';
      default: return 'Content';
    }
  };

  // Success state
  if (success) {
    return (
      <div
        ref={overlayRef}
        onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
        className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 animate-overlay-in"
      >
        <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center animate-modal-in">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
            <HiOutlineCheckCircle size={32} className="text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Report Submitted</h3>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Thank you for helping keep SunoCampus safe. Our team will review your report and take appropriate action.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-all duration-200 active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 overflow-y-auto animate-overlay-in"
    >
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto my-4 animate-modal-in browse-scrollbar">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center">
              <HiOutlineFlag size={18} className="text-red-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Report {getTypeLabel()}</h3>
              {contentTitle && (
                <p className="text-xs text-gray-500 truncate max-w-[200px]">{contentTitle}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-all active:scale-90"
          >
            <HiOutlineXMark size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5">
          {/* Category Selection */}
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Why are you reporting this {getTypeLabel().toLowerCase()}?
            </label>
            <div className="space-y-2">
              {CATEGORIES.map((cat) => (
                <label
                  key={cat.value}
                  className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    category === cat.value
                      ? 'border-red-400 bg-red-50/50'
                      : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="reportCategory"
                    value={cat.value}
                    checked={category === cat.value}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-0.5 text-red-600 focus:ring-red-500"
                  />
                  <div>
                    <p className={`text-sm font-medium ${category === cat.value ? 'text-red-700' : 'text-gray-800'}`}>
                      {cat.label}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{cat.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Additional details <span className="text-gray-400 font-normal">(min. 10 characters)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please describe the issue in detail so our team can review it effectively..."
              rows={4}
              maxLength={1000}
              className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none resize-none placeholder-gray-400 transition-all duration-200"
            />
            <div className="flex justify-between mt-1.5">
              <p className={`text-xs ${description.length >= 10 ? 'text-green-600' : 'text-gray-400'}`}>
                {description.length >= 10 ? '✓ Minimum met' : `${10 - description.length} more characters needed`}
              </p>
              <p className="text-xs text-gray-400">{description.length}/1000</p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              <HiOutlineExclamationTriangle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Disclaimer */}
          <div className="mb-5 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <HiOutlineShieldExclamation size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed">
              False reports may result in action against your account. Please only report genuine violations.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-200 active:scale-[0.97]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !category || description.length < 10}
              className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-all duration-200 hover:shadow-md active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed relative"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting...
                </span>
              ) : (
                'Submit Report'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportModal;
