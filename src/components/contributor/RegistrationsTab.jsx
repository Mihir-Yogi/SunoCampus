import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import {
  HiOutlineUsers,
  HiOutlineMagnifyingGlass,
  HiOutlineArrowDownTray,
  HiOutlineXMark,
  HiOutlineCalendarDays,
} from 'react-icons/hi2';

export default function RegistrationsTab({ showToast }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [exportEvent, setExportEvent] = useState(null);

  const fetchRegistrations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/contributor/registrations');
      if (res.data.success) setEvents(res.data.data);
    } catch {
      showToast('error', 'Failed to load registrations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRegistrations(); }, [fetchRegistrations]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Registrations</h1>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <HiOutlineUsers className="w-16 h-16 text-gray-300 mx-auto" />
          <p className="text-gray-500 mt-3 text-lg">No registrations yet</p>
          <p className="text-gray-400 text-sm mt-1">Students will appear here once they register for your events</p>
        </div>
      ) : (
        <div className="space-y-5">
          {events.map((event) => (
            <div key={event._id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Event header */}
              <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-gray-900">{event.title}</h2>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full
                      ${event.status === 'open' ? 'bg-green-100 text-green-700'
                        : event.status === 'full' ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-600'}`}>
                      {event.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-2">
                    <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded text-xs">{event.category}</span>
                    <span>{new Date(event.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </p>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="text-center px-3">
                    <p className="font-bold text-gray-900">{event.totalRegistered}</p>
                    <p className="text-xs text-gray-500">Registered</p>
                  </div>
                  <div className="text-center px-3 border-l border-gray-200">
                    <p className="font-bold text-emerald-600">{event.availableSeats != null ? event.availableSeats : '∞'}</p>
                    <p className="text-xs text-gray-500">Available</p>
                  </div>
                </div>
              </div>

              {/* Preview students */}
              <div className="p-4">
                {event.previewStudents.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-3">No students registered</p>
                ) : (
                  <>
                    <div className="space-y-2">
                      {event.previewStudents.map((s) => (
                        <div key={s._id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-semibold">
                              {s.studentName?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-800">{s.studentName}</p>
                              <p className="text-xs text-gray-500">{s.studentEmail}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {event.totalRegistered > 3 && (
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={() => setSelectedEvent(event._id)}
                          className="flex-1 text-sm text-blue-600 font-medium py-2 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-center"
                        >
                          View All {event.totalRegistered} Students
                        </button>
                        <button
                          onClick={() => setExportEvent(event._id)}
                          className="inline-flex items-center gap-1.5 text-sm text-emerald-600 font-medium px-4 py-2 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                        >
                          <HiOutlineArrowDownTray className="w-4 h-4" />
                          CSV
                        </button>
                      </div>
                    )}

                    {event.totalRegistered <= 3 && event.totalRegistered > 0 && (
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={() => setExportEvent(event._id)}
                          className="inline-flex items-center gap-1.5 text-sm text-emerald-600 font-medium px-4 py-2 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors w-full justify-center"
                        >
                          <HiOutlineArrowDownTray className="w-4 h-4" />
                          CSV
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Student List Modal */}
      {selectedEvent && (
        <StudentListModal
          eventId={selectedEvent}
          onClose={() => { setSelectedEvent(null); fetchRegistrations(); }}
          showToast={showToast}
        />
      )}

      {/* CSV Export Modal */}
      {exportEvent && (
        <CSVExportModal
          eventId={exportEvent}
          onClose={() => setExportEvent(null)}
          showToast={showToast}
        />
      )}
    </div>
  );
}

// ── Student List Modal with Attendance ──
function StudentListModal({ eventId, onClose, showToast }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/contributor/events/${eventId}/registrations`, {
        params: { search: search || undefined, limit: 200 },
      });
      if (res.data.success) setData(res.data.data);
    } catch {
      showToast('error', 'Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [eventId, search]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl w-full max-w-3xl my-8 shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">
            {data?.event?.title || 'Registered Students'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <HiOutlineXMark className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {/* Stats */}
          {data?.stats && (
            <div className="flex gap-4 mb-4">
              <div className="bg-blue-50 rounded-lg px-4 py-2 text-center flex-1">
                <p className="text-lg font-bold text-blue-700">{data.stats.totalRegistered}</p>
                <p className="text-xs text-blue-600">Registered</p>
              </div>
              <div className="bg-emerald-50 rounded-lg px-4 py-2 text-center flex-1">
                <p className="text-lg font-bold text-emerald-700">{data.stats.seatsAvailable != null ? data.stats.seatsAvailable : '∞'}</p>
                <p className="text-xs text-emerald-600">Available</p>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="relative mb-4">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Student list */}
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
          ) : data?.registrations?.length === 0 ? (
            <p className="text-center text-gray-400 py-8">No students found</p>
          ) : (
            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {data.registrations.map((reg) => {
                const hasResponses = reg.formResponses && (
                  (reg.formResponses instanceof Map ? reg.formResponses.size > 0 : Object.keys(reg.formResponses).length > 0)
                );
                const responses = reg.formResponses instanceof Map
                  ? Object.fromEntries(reg.formResponses)
                  : (reg.formResponses || {});
                const isExpanded = expandedId === reg._id;

                // Format response labels
                const defaultLabels = {
                  default_phone: 'Phone', default_branch: 'Branch', default_currentYear: 'Year',
                  default_studentId: 'Student ID', default_gender: 'Gender', default_dateOfBirth: 'DOB',
                };

                return (
                <div key={reg._id} className="bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center justify-between p-3">
                    <div
                      className={`flex items-center gap-3 min-w-0 flex-1 ${hasResponses ? 'cursor-pointer' : ''}`}
                      onClick={() => hasResponses && setExpandedId(isExpanded ? null : reg._id)}
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                        {reg.student?.fullName?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{reg.student?.fullName}</p>
                        <p className="text-xs text-gray-500 truncate">{reg.student?.email}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                          <span>{reg.student?.college?.name || reg.student?.collegeName}</span>
                          <span>·</span>
                          <span>{new Date(reg.registeredAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                          {hasResponses && (
                            <>
                              <span>·</span>
                              <span className="text-blue-500 font-medium">{isExpanded ? 'Hide details' : 'View details'}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expandable form responses */}
                  {isExpanded && hasResponses && (
                    <div className="px-3 pb-3 pt-0">
                      <div className="bg-white rounded-lg border border-gray-200 p-3 ml-12">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Registration Responses</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {Object.entries(responses).map(([key, val]) => {
                            // Get pretty label
                            let label = defaultLabels[key] || key;
                            let fieldType = 'text';
                            // Check custom fields
                            if (data.event?.customFormFields) {
                              const cf = data.event.customFormFields.find(f => f.fieldId === key);
                              if (cf) {
                                label = cf.label;
                                fieldType = cf.type;
                              }
                            }
                            
                            // Handle file uploads as download links
                            if (fieldType === 'file' && val && typeof val === 'string' && (val.startsWith('http') || val.includes('cloudinary'))) {
                              const fileName = val.split('/').pop()?.split('?')[0] || 'Download';
                              return (
                                <div key={key}>
                                  <p className="text-[10px] font-medium text-gray-400">{label}</p>
                                  <a
                                    href={val}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
                                  >
                                    📥 Download
                                  </a>
                                </div>
                              );
                            }
                            
                            const displayVal = Array.isArray(val) ? val.join(', ') : String(val);
                            return (
                              <div key={key}>
                                <p className="text-[10px] font-medium text-gray-400">{label}</p>
                                <p className="text-xs text-gray-700">{displayVal || '—'}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── CSV Export Modal with field selection ──
function CSVExportModal({ eventId, onClose, showToast }) {
  const [fields, setFields] = useState([]);
  const [selected, setSelected] = useState([]);
  const [eventTitle, setEventTitle] = useState('');
  const [totalRegs, setTotalRegs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchFields = async () => {
      try {
        const res = await api.get(`/contributor/events/${eventId}/export-fields`);
        if (res.data.success) {
          setFields(res.data.data.fields);
          setEventTitle(res.data.data.eventTitle);
          setTotalRegs(res.data.data.totalRegistrations);
          // Pre-select default fields
          setSelected(res.data.data.fields.filter(f => f.type === 'default').map(f => f.fieldId));
        }
      } catch {
        showToast('error', 'Failed to load export fields');
        onClose();
      } finally {
        setLoading(false);
      }
    };
    fetchFields();
  }, [eventId]);

  const toggleField = (fieldId) => {
    setSelected(prev =>
      prev.includes(fieldId)
        ? prev.filter(f => f !== fieldId)
        : [...prev, fieldId]
    );
  };

  const selectAll = () => setSelected(fields.map(f => f.fieldId));
  const deselectAll = () => setSelected([]);

  const handleExport = async () => {
    if (selected.length === 0) {
      showToast('warning', 'Select at least one field');
      return;
    }
    try {
      setExporting(true);
      const res = await api.post(
        `/contributor/events/${eventId}/export-csv`,
        { selectedFields: selected },
        { responseType: 'blob' }
      );

      // Download the CSV file
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${eventTitle.replace(/[^a-zA-Z0-9]/g, '_')}_registrations.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast('success', 'CSV exported successfully');
      onClose();
    } catch {
      showToast('error', 'Failed to export CSV');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Export CSV</h2>
            <p className="text-xs text-gray-500 mt-0.5">{eventTitle} — {totalRegs} registrations</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <HiOutlineXMark className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Select all / deselect all */}
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-700">Select columns to export:</p>
                <div className="flex gap-2 text-xs">
                  <button onClick={selectAll} className="text-blue-600 hover:text-blue-800 font-medium">All</button>
                  <span className="text-gray-300">|</span>
                  <button onClick={deselectAll} className="text-gray-500 hover:text-gray-700 font-medium">None</button>
                </div>
              </div>

              {/* Field checkboxes */}
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {/* Default fields */}
                {fields.filter(f => f.type === 'default').length > 0 && (
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-1 mb-1">Default Fields</p>
                )}
                {fields.filter(f => f.type === 'default').map((field) => (
                  <label key={field.fieldId} className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selected.includes(field.fieldId)}
                      onChange={() => toggleField(field.fieldId)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{field.label}</span>
                  </label>
                ))}

                {/* Custom fields */}
                {fields.filter(f => f.type === 'custom').length > 0 && (
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-3 mb-1">Custom Fields</p>
                )}
                {fields.filter(f => f.type === 'custom').map((field) => (
                  <label key={field.fieldId} className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selected.includes(field.fieldId)}
                      onChange={() => toggleField(field.fieldId)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{field.label}</span>
                  </label>
                ))}
              </div>

              <div className="flex gap-3 mt-5 pt-4 border-t border-gray-200">
                <button onClick={onClose}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                  Cancel
                </button>
                <button
                  onClick={handleExport}
                  disabled={exporting || selected.length === 0}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                  <HiOutlineArrowDownTray className="w-4 h-4" />
                  {exporting ? 'Exporting...' : `Export (${selected.length} cols)`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
