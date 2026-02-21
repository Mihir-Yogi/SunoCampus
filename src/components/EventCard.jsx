import { Link } from 'react-router-dom';

export const EventCard = ({ event, onRegister, onBookmark }) => {
  const isRegistered = event?.isRegistered || false;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
      {/* Event Image */}
      {event.image && (
        <img src={event.image} alt={event.title} className="w-full h-48 object-cover" />
      )}

      {/* Event Content */}
      <div className="p-6">
        {/* Category Badge */}
        <div className="flex items-center space-x-2 mb-3">
          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
            {event.category}
          </span>
          <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
            {event.mode}
          </span>
        </div>

        {/* Event Title */}
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{event.title}</h3>

        {/* Event Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>

        {/* Event Details */}
        <div className="space-y-2 mb-4 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{event.date}</span>
          </div>

          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 2m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{event.time}</span>
          </div>

          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            <span>{event.location}</span>
          </div>
        </div>

        {/* Attendees Count */}
        <div className="mb-4 pb-4 border-b">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{event.attendees || 0}</span> interested
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => onRegister?.(event.id)}
            className={`flex-1 py-2 rounded-lg font-medium transition ${
              isRegistered
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isRegistered ? 'Registered' : 'Register'}
          </button>

          <button
            onClick={() => onBookmark?.(event.id)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h6a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
