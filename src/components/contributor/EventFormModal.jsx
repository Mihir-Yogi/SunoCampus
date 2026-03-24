import { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  HiOutlineXMark,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineChevronUp,
  HiOutlineChevronDown,
  HiOutlineEyeSlash,
  HiOutlineEye,
} from 'react-icons/hi2';

const CATEGORIES = ['Workshop', 'Seminar', 'Conference', 'Competition', 'Cultural', 'Sports', 'Technical', 'Other'];
const EVENT_TYPES = ['Online', 'Offline', 'Hybrid'];
const SCOPES = [
  { value: 'campus', label: 'Campus Only' },
  { value: 'global', label: 'Global (All Colleges)' },
];

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'url', label: 'URL' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'date', label: 'Date' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'multi-select', label: 'Multi-Select' },
  { value: 'radio', label: 'Radio Buttons' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'file', label: 'File Upload' },
];

const NEEDS_OPTIONS = ['dropdown', 'multi-select', 'radio'];

// Default registration fields that contributors can toggle on/off
// Name, Email & College are always collected (locked)
const DEFAULT_REG_FIELDS = [
  { key: 'phone', label: 'Phone Number' },
  { key: 'branch', label: 'Branch' },
  { key: 'currentYear', label: 'Current Year' },
  { key: 'studentId', label: 'Student ID' },
  { key: 'gender', label: 'Gender' },
  { key: 'dateOfBirth', label: 'Date of Birth' },
];

// Optional fields that contributors can toggle on/off
const OPTIONAL_FIELDS_CONFIG = [
  { key: 'description', label: 'Description' },
  { key: 'venue', label: 'Venue' },
  { key: 'registrationDeadline', label: 'Registration Deadline' },
  { key: 'maxParticipants', label: 'Max Participants' },
];

export default function EventFormModal({ event, onClose, showToast, viewOnly = false }) {
  const isEdit = !!event;

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Workshop',
    mode: 'Offline',
    eventDate: '',
    eventTime: '',
    registrationDeadline: '',
    totalSeats: '',
    location: '',
    zoomLink: '',
    scope: 'campus',
  });

  // Track which optional fields are enabled
  const [enabledOptionals, setEnabledOptionals] = useState({
    description: true,
    venue: true,
    registrationDeadline: false,
    maxParticipants: false,
  });

  const [customFields, setCustomFields] = useState([]);
  const [defaultRegFields, setDefaultRegFields] = useState([]);
  const [rules, setRules] = useState(['']);
  const [faqs, setFaqs] = useState([]);
  const [banner, setBanner] = useState(null);
  const [bannerPreview, setBannerPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // Pre-fill for editing
  useEffect(() => {
    if (event) {
      setForm({
        title: event.title || '',
        description: event.description || '',
        category: event.category || 'Workshop',
        mode: event.mode || 'Offline',
        eventDate: event.eventDate ? new Date(event.eventDate).toISOString().split('T')[0] : '',
        eventTime: event.eventTime || '',
        registrationDeadline: event.registrationDeadline ? new Date(event.registrationDeadline).toISOString().split('T')[0] : '',
        totalSeats: event.totalSeats?.toString() || '',
        location: event.location || '',
        zoomLink: event.zoomLink || '',
        scope: event.scope || 'campus',
      });
      setCustomFields(event.customFormFields || []);
      setDefaultRegFields(event.defaultFormFields || []);
      setRules(event.rules && event.rules.length > 0 ? event.rules : ['']);
      setFaqs(event.faqs && event.faqs.length > 0 ? event.faqs : []);
      if (event.bannerImage) setBannerPreview(event.bannerImage);
      // Enable optionals that have values
      setEnabledOptionals({
        description: true, // always on by default
        venue: !!(event.location),
        registrationDeadline: !!(event.registrationDeadline),
        maxParticipants: !!(event.totalSeats),
      });
    }
  }, [event]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const toggleOptional = (key) => {
    setEnabledOptionals(prev => {
      const next = { ...prev, [key]: !prev[key] };
      // Clear the field value when disabling
      if (!next[key]) {
        if (key === 'description') handleChange('description', '');
        if (key === 'venue') handleChange('location', '');
        if (key === 'registrationDeadline') handleChange('registrationDeadline', '');
        if (key === 'maxParticipants') handleChange('totalSeats', '');
      }
      return next;
    });
  };

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('error', 'Banner image must be under 5MB');
        return;
      }
      setBanner(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  // ── Custom Field Builder ──
  const addCustomField = () => {
    setCustomFields(prev => [
      ...prev,
      {
        fieldId: `field_${Date.now()}`,
        label: '',
        type: 'text',
        required: false,
        placeholder: '',
        options: [],
      },
    ]);
  };

  const updateCustomField = (index, key, value) => {
    setCustomFields(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: value };
      return updated;
    });
  };

  const removeCustomField = (index) => {
    setCustomFields(prev => prev.filter((_, i) => i !== index));
  };

  const moveField = (index, direction) => {
    setCustomFields(prev => {
      const updated = [...prev];
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= updated.length) return prev;
      [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
      return updated;
    });
  };

  const addOption = (fieldIndex) => {
    setCustomFields(prev => {
      const updated = [...prev];
      updated[fieldIndex] = {
        ...updated[fieldIndex],
        options: [...(updated[fieldIndex].options || []), ''],
      };
      return updated;
    });
  };

  const updateOption = (fieldIndex, optionIndex, value) => {
    setCustomFields(prev => {
      const updated = [...prev];
      const newOptions = [...updated[fieldIndex].options];
      newOptions[optionIndex] = value;
      updated[fieldIndex] = { ...updated[fieldIndex], options: newOptions };
      return updated;
    });
  };

  const removeOption = (fieldIndex, optionIndex) => {
    setCustomFields(prev => {
      const updated = [...prev];
      updated[fieldIndex] = {
        ...updated[fieldIndex],
        options: updated[fieldIndex].options.filter((_, i) => i !== optionIndex),
      };
      return updated;
    });
  };

  // ── Validation ──
  const validate = () => {
    const err = {};
    if (!form.title.trim()) err.title = 'Title is required';
    if (form.title.length > 200) err.title = 'Max 200 characters';
    if (!form.category) err.category = 'Category is required';
    if (!form.mode) err.mode = 'Event type is required';
    if (!form.eventDate) err.eventDate = 'Event date is required';
    if (!form.eventTime) err.eventTime = 'Event time is required';

    // Venue required for Offline/Hybrid (only if venue field is enabled)
    if (enabledOptionals.venue && (form.mode === 'Offline' || form.mode === 'Hybrid') && !form.location.trim()) {
      err.location = 'Venue is required for Offline/Hybrid events';
    }

    if ((form.mode === 'Online' || form.mode === 'Hybrid') && !form.zoomLink.trim()) {
      err.zoomLink = 'Meeting link is required for Online/Hybrid events';
    }

    if (enabledOptionals.description && form.description.length > 2000) {
      err.description = 'Max 2000 characters';
    }

    if (enabledOptionals.maxParticipants && form.totalSeats && parseInt(form.totalSeats) < 1) {
      err.totalSeats = 'Must be at least 1';
    }

    if (enabledOptionals.registrationDeadline && form.registrationDeadline && form.eventDate) {
      if (new Date(form.registrationDeadline) > new Date(form.eventDate)) {
        err.registrationDeadline = 'Deadline must be before event date';
      }
    }

    // Validate custom fields
    for (let i = 0; i < customFields.length; i++) {
      const f = customFields[i];
      if (!f.label.trim()) {
        err[`cf_${i}_label`] = 'Label required';
      }
      if (!f.type || !FIELD_TYPES.find(ft => ft.value === f.type)) {
        err[`cf_${i}_type`] = 'Valid field type required';
      }
      if (NEEDS_OPTIONS.includes(f.type) && (!f.options || f.options.filter(o => o.trim()).length < 2)) {
        err[`cf_${i}_options`] = 'At least 2 options required';
      }
    }

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  // ── Submit ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSaving(true);
      const formData = new FormData();

      // Always send required fields
      formData.append('title', form.title);
      formData.append('category', form.category);
      formData.append('mode', form.mode);
      formData.append('eventDate', form.eventDate);
      formData.append('eventTime', form.eventTime);
      formData.append('scope', form.scope);

      // Conditionally send optional fields
      if (enabledOptionals.description && form.description.trim()) {
        formData.append('description', form.description);
      }
      if (enabledOptionals.venue && form.location.trim()) {
        formData.append('location', form.location);
      }
      if (form.zoomLink.trim()) {
        formData.append('zoomLink', form.zoomLink);
      }
      if (enabledOptionals.registrationDeadline && form.registrationDeadline) {
        formData.append('registrationDeadline', form.registrationDeadline);
      }
      if (enabledOptionals.maxParticipants && form.totalSeats) {
        formData.append('totalSeats', form.totalSeats);
      }

      formData.append('customFormFields', JSON.stringify(customFields));
      formData.append('defaultFormFields', JSON.stringify(defaultRegFields));
      formData.append('rules', JSON.stringify(rules.filter(r => r.trim())));
      formData.append('faqs', JSON.stringify(faqs.filter(f => f.question?.trim() && f.answer?.trim())));
      if (banner) formData.append('banner', banner);

      let res;
      if (isEdit) {
        res = await api.put(`/contributor/events/${event._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        res = await api.post('/contributor/events', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      if (res.data.success) {
        showToast('success', res.data.message);
        onClose(true);
      }
    } catch (error) {
      showToast('error', error.response?.data?.message || 'Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  const charCount = (val, max) => (
    <span className={`text-xs ${val.length > max ? 'text-red-500' : 'text-gray-400'}`}>{val.length}/{max}</span>
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl w-full max-w-3xl my-8 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">{viewOnly ? 'View Event' : isEdit ? 'Edit Event' : 'Create Event'}</h2>
          <button onClick={() => onClose(false)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <HiOutlineXMark className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={`p-6 space-y-5 max-h-[75vh] overflow-y-auto ${viewOnly ? 'pointer-events-none opacity-80' : ''}`}>

          {/* ── Optional Fields Toggle ── */}
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Toggle optional fields</p>
            <div className="flex flex-wrap gap-2">
              {OPTIONAL_FIELDS_CONFIG.map(f => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => toggleOptional(f.key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
                    ${enabledOptionals[f.key]
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-gray-100 text-gray-400 border-gray-200 line-through'}`}
                >
                  {enabledOptionals[f.key] ? <HiOutlineEye className="w-3.5 h-3.5" /> : <HiOutlineEyeSlash className="w-3.5 h-3.5" />}
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title * */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-gray-700">Title <span className="text-red-500">*</span></label>
              {charCount(form.title, 200)}
            </div>
            <input
              type="text"
              maxLength={200}
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="e.g. Tech Fest 2026"
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.title ? 'border-red-400' : 'border-gray-200'}`}
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>

          {/* Description (toggleable) */}
          {enabledOptionals.description && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-gray-700">Description</label>
                {charCount(form.description, 2000)}
              </div>
              <textarea
                rows={4}
                maxLength={2000}
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Describe your event — what it's about, who should attend, what to expect..."
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 resize-none ${errors.description ? 'border-red-400' : 'border-gray-200'}`}
              />
              {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
            </div>
          )}

          {/* Category * + Event Type * row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category <span className="text-red-500">*</span></label>
              <select
                value={form.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Type <span className="text-red-500">*</span></label>
              <select
                value={form.mode}
                onChange={(e) => handleChange('mode', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                {EVENT_TYPES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* Venue (toggleable, conditional on mode) */}
          {enabledOptionals.venue && (form.mode === 'Offline' || form.mode === 'Hybrid') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Venue {(form.mode === 'Offline' || form.mode === 'Hybrid') && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder="e.g. Auditorium Block A, Room 201"
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 ${errors.location ? 'border-red-400' : 'border-gray-200'}`}
              />
              {errors.location && <p className="text-xs text-red-500 mt-1">{errors.location}</p>}
            </div>
          )}

          {/* Zoom/Meeting Link (conditional on mode) */}
          {(form.mode === 'Online' || form.mode === 'Hybrid') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Link <span className="text-red-500">*</span></label>
              <input
                type="url"
                value={form.zoomLink}
                onChange={(e) => handleChange('zoomLink', e.target.value)}
                placeholder="https://zoom.us/j/... or https://meet.google.com/..."
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 ${errors.zoomLink ? 'border-red-400' : 'border-gray-200'}`}
              />
              {errors.zoomLink && <p className="text-xs text-red-500 mt-1">{errors.zoomLink}</p>}
            </div>
          )}

          {/* Event Date * + Event Time * row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Date <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={form.eventDate}
                onChange={(e) => handleChange('eventDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 ${errors.eventDate ? 'border-red-400' : 'border-gray-200'}`}
              />
              {errors.eventDate && <p className="text-xs text-red-500 mt-1">{errors.eventDate}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Time <span className="text-red-500">*</span></label>
              <input
                type="time"
                value={form.eventTime}
                onChange={(e) => handleChange('eventTime', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 ${errors.eventTime ? 'border-red-400' : 'border-gray-200'}`}
              />
              {errors.eventTime && <p className="text-xs text-red-500 mt-1">{errors.eventTime}</p>}
            </div>
          </div>

          {/* Registration Deadline + Max Participants row (both toggleable) */}
          {(enabledOptionals.registrationDeadline || enabledOptionals.maxParticipants) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {enabledOptionals.registrationDeadline && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registration Deadline</label>
                  <input
                    type="date"
                    value={form.registrationDeadline}
                    onChange={(e) => handleChange('registrationDeadline', e.target.value)}
                    max={form.eventDate || undefined}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 ${errors.registrationDeadline ? 'border-red-400' : 'border-gray-200'}`}
                  />
                  {errors.registrationDeadline && <p className="text-xs text-red-500 mt-1">{errors.registrationDeadline}</p>}
                  <p className="text-xs text-gray-400 mt-1">Leave empty = open until event date</p>
                </div>
              )}
              {enabledOptionals.maxParticipants && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Participants</label>
                  <input
                    type="number"
                    min="1"
                    max="100000"
                    value={form.totalSeats}
                    onChange={(e) => handleChange('totalSeats', e.target.value)}
                    placeholder="Leave empty for unlimited"
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 ${errors.totalSeats ? 'border-red-400' : 'border-gray-200'}`}
                  />
                  {errors.totalSeats && <p className="text-xs text-red-500 mt-1">{errors.totalSeats}</p>}
                  <p className="text-xs text-gray-400 mt-1">Empty = unlimited participants</p>
                </div>
              )}
            </div>
          )}

          {/* Scope */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Scope</label>
            <div className="flex gap-3">
              {SCOPES.map(s => (
                <label key={s.value} className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 border rounded-lg cursor-pointer text-sm font-medium transition-colors
                  ${form.scope === s.value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                  <input
                    type="radio"
                    name="scope"
                    value={s.value}
                    checked={form.scope === s.value}
                    onChange={(e) => handleChange('scope', e.target.value)}
                    className="sr-only"
                  />
                  {s.label}
                </label>
              ))}
            </div>
          </div>

          {/* Banner Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Banner Image <span className="text-xs text-gray-400">(optional)</span></label>
            {bannerPreview && (
              <div className="mb-2 relative">
                <img src={bannerPreview} alt="Banner preview" className="w-full h-40 object-cover rounded-lg" />
                <button
                  type="button"
                  onClick={() => { setBanner(null); setBannerPreview(''); }}
                  className="absolute top-2 right-2 bg-white/90 p-1 rounded-full hover:bg-white"
                >
                  <HiOutlineXMark className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleBannerChange}
              className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
            />
          </div>

          {/* ── Default Registration Fields Picker ── */}
          <div className="border-t border-gray-200 pt-5">
            <div className="mb-3">
              <h3 className="text-sm font-bold text-gray-900">Registration Form Fields</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Choose which student details to collect when they register.
              </p>
            </div>

            {/* Always-on fields (locked) */}
            <div className="flex flex-wrap gap-2 mb-3">
              {['Name', 'Email', 'College'].map(f => (
                <span
                  key={f}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 opacity-70 cursor-not-allowed"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                  {f}
                </span>
              ))}
            </div>

            {/* Toggleable default fields */}
            <div className="flex flex-wrap gap-2">
              {DEFAULT_REG_FIELDS.map(f => {
                const isActive = defaultRegFields.includes(f.key);
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => {
                      setDefaultRegFields(prev =>
                        prev.includes(f.key)
                          ? prev.filter(k => k !== f.key)
                          : [...prev, f.key]
                      );
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
                      ${isActive
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-gray-100 text-gray-400 border-gray-200'}`}
                  >
                    {isActive ? (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    )}
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Custom Registration Form Fields ── */}
          <div className="border-t border-gray-200 pt-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Custom Registration Form</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Name, Email & College are collected automatically. Add extra fields below.
                </p>
              </div>
              <button
                type="button"
                onClick={addCustomField}
                className="inline-flex items-center gap-1 text-sm text-blue-600 font-medium hover:text-blue-800"
              >
                <HiOutlinePlus className="w-4 h-4" />
                Add Field
              </button>
            </div>

            {customFields.length === 0 ? (
              <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <p className="text-sm text-gray-400">No custom fields added</p>
                <p className="text-xs text-gray-400 mt-1">Students will fill: Name, Email, College</p>
              </div>
            ) : (
              <div className="space-y-4">
                {customFields.map((field, index) => (
                  <div key={field.fieldId} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start gap-2">
                      {/* Reorder buttons */}
                      <div className="flex flex-col gap-0.5 pt-1">
                        <button type="button" onClick={() => moveField(index, -1)} disabled={index === 0}
                          className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30">
                          <HiOutlineChevronUp className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => moveField(index, 1)} disabled={index === customFields.length - 1}
                          className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30">
                          <HiOutlineChevronDown className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex-1 space-y-3">
                        {/* Label + Type row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <input
                              type="text"
                              value={field.label}
                              onChange={(e) => updateCustomField(index, 'label', e.target.value)}
                              placeholder="Field Label *"
                              className={`w-full px-3 py-2 border rounded-lg text-sm ${errors[`cf_${index}_label`] ? 'border-red-400' : 'border-gray-200'}`}
                            />
                            {errors[`cf_${index}_label`] && (
                              <p className="text-xs text-red-500 mt-1">{errors[`cf_${index}_label`]}</p>
                            )}
                          </div>
                          <div>
                            <select
                              value={field.type}
                              onChange={(e) => updateCustomField(index, 'type', e.target.value)}
                              className={`w-full px-3 py-2 border rounded-lg text-sm ${errors[`cf_${index}_type`] ? 'border-red-400' : 'border-gray-200'}`}
                            >
                              {FIELD_TYPES.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                              ))}
                            </select>
                            {errors[`cf_${index}_type`] && (
                              <p className="text-xs text-red-500 mt-1">{errors[`cf_${index}_type`]}</p>
                            )}
                          </div>
                        </div>

                        {/* Placeholder */}
                        <input
                          type="text"
                          value={field.placeholder}
                          onChange={(e) => updateCustomField(index, 'placeholder', e.target.value)}
                          placeholder="Placeholder text (optional)"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        />

                        {/* Required toggle */}
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => updateCustomField(index, 'required', e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-600">Required</span>
                        </label>

                        {/* Options for dropdown/radio/multi-select */}
                        {NEEDS_OPTIONS.includes(field.type) && (
                          <div className="space-y-2 pl-2 border-l-2 border-blue-200">
                            <p className="text-xs font-medium text-gray-600">Options:</p>
                            {(field.options || []).map((opt, optIdx) => (
                              <div key={optIdx} className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={opt}
                                  onChange={(e) => updateOption(index, optIdx, e.target.value)}
                                  placeholder={`Option ${optIdx + 1}`}
                                  className="flex-1 px-2 py-1.5 border border-gray-200 rounded text-sm"
                                />
                                <button type="button" onClick={() => removeOption(index, optIdx)}
                                  className="p-1 text-red-400 hover:text-red-600">
                                  <HiOutlineXMark className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                            <button type="button" onClick={() => addOption(index)}
                              className="text-xs text-blue-600 font-medium hover:text-blue-800">
                              + Add Option
                            </button>
                            {errors[`cf_${index}_options`] && (
                              <p className="text-xs text-red-500">{errors[`cf_${index}_options`]}</p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Delete field */}
                      <button type="button" onClick={() => removeCustomField(index)}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                        <HiOutlineTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Rules & Guidelines ── */}
          <div className="border-t border-gray-200 pt-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Rules & Guidelines</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Add rules for participants to follow. Leave empty to use auto-generated defaults.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRules(prev => [...prev, ''])}
                className="inline-flex items-center gap-1 text-sm text-blue-600 font-medium hover:text-blue-800"
              >
                <HiOutlinePlus className="w-4 h-4" />
                Add Rule
              </button>
            </div>
            <div className="space-y-2">
              {rules.map((rule, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-blue-600">{index + 1}</span>
                  </span>
                  <input
                    type="text"
                    value={rule}
                    onChange={(e) => {
                      const updated = [...rules];
                      updated[index] = e.target.value;
                      setRules(updated);
                    }}
                    placeholder={`Rule ${index + 1}`}
                    maxLength={500}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {rules.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setRules(prev => prev.filter((_, i) => i !== index))}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── FAQs ── */}
          <div className="border-t border-gray-200 pt-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Frequently Asked Questions</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Add FAQs for your event. Leave empty to use auto-generated defaults.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFaqs(prev => [...prev, { question: '', answer: '' }])}
                className="inline-flex items-center gap-1 text-sm text-blue-600 font-medium hover:text-blue-800"
              >
                <HiOutlinePlus className="w-4 h-4" />
                Add FAQ
              </button>
            </div>
            {faqs.length === 0 ? (
              <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <p className="text-sm text-gray-400">No custom FAQs added</p>
                <p className="text-xs text-gray-400 mt-1">Auto-generated FAQs will be shown based on event settings</p>
              </div>
            ) : (
              <div className="space-y-3">
                {faqs.map((faq, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          value={faq.question}
                          onChange={(e) => {
                            const updated = [...faqs];
                            updated[index] = { ...updated[index], question: e.target.value };
                            setFaqs(updated);
                          }}
                          placeholder="Question"
                          maxLength={300}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <textarea
                          value={faq.answer}
                          onChange={(e) => {
                            const updated = [...faqs];
                            updated[index] = { ...updated[index], answer: e.target.value };
                            setFaqs(updated);
                          }}
                          placeholder="Answer"
                          maxLength={1000}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setFaqs(prev => prev.filter((_, i) => i !== index))}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <HiOutlineTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            {viewOnly ? (
              <button
                type="button"
                onClick={() => onClose(false)}
                className="w-full px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onClose(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : isEdit ? 'Update Event' : 'Create Event'}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
