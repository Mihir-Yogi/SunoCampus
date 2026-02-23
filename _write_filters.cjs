const fs = require('fs');
const path = require('path');

const content = `import { useState } from 'react';
import { HiOutlineMagnifyingGlass, HiOutlineXMark } from 'react-icons/hi2';

const EVENT_CATEGORIES = [
  'All', 'Workshop', 'Seminar', 'Conference', 'Competition',
  'Cultural', 'Sports', 'Technical', 'Other',
];

const EVENT_STATUSES = [
  { value: '', label: 'All Status' },
  { value: 'open', label: 'Open' },
  { value: 'full', label: 'Full' },
  { value: 'past', label: 'Past' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'mostLiked', label: 'Most Liked' },
  { value: 'mostCommented', label: 'Most Commented' },
  { value: 'soonest', label: 'Soonest Events' },
];

const FeedFilters = ({
  type,
  setType,
  category,
  setCategory,
  eventStatus,
  setEventStatus,
  sort,
  setSort,
  search,
  setSearch,
  onSearch,
}) => {
  const [searchOpen, setSearchOpen] = useState(false);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onSearch();
  };

  const activeFilterCount = [
    category !== 'all',
    eventStatus !== '',
    sort !== 'newest',
  ].filter(Boolean).length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-2.5 animate-filter-in">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Content Type Tabs */}
        <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
          {[
            { value: 'all', label: 'All' },
            { value: 'posts', label: 'Posts' },
            { value: 'events', label: 'Events' },
          ].map(t => (
            <button
              key={t.value}
              onClick={() => setType(t.value)}
              className={\`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all duration-200 \${
                type === t.value
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }\`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-gray-200 hidden sm:block" />

        {/* Category */}
        {(type === 'all' || type === 'events') && (
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={\`px-2.5 py-1.5 text-xs border rounded-lg outline-none transition-all duration-200 cursor-pointer \${
              category !== 'all'
                ? 'border-blue-200 bg-blue-50 text-blue-700 font-medium'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
            }\`}
          >
            {EVENT_CATEGORIES.map(c => (
              <option key={c} value={c === 'All' ? 'all' : c}>{c === 'All' ? 'Category' : c}</option>
            ))}
          </select>
        )}

        {/* Status */}
        {(type === 'all' || type === 'events') && (
          <select
            value={eventStatus}
            onChange={(e) => setEventStatus(e.target.value)}
            className={\`px-2.5 py-1.5 text-xs border rounded-lg outline-none transition-all duration-200 cursor-pointer \${
              eventStatus !== ''
                ? 'border-blue-200 bg-blue-50 text-blue-700 font-medium'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
            }\`}
          >
            {EVENT_STATUSES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        )}

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className={\`px-2.5 py-1.5 text-xs border rounded-lg outline-none transition-all duration-200 cursor-pointer \${
            sort !== 'newest'
              ? 'border-blue-200 bg-blue-50 text-blue-700 font-medium'
              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
          }\`}
        >
          {SORT_OPTIONS.filter(s => {
            if (type === 'events' && (s.value === 'mostLiked' || s.value === 'mostCommented')) return false;
            if (type === 'posts' && s.value === 'soonest') return false;
            return true;
          }).map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        {/* Active filter count badge */}
        {activeFilterCount > 0 && (
          <button
            onClick={() => { setCategory('all'); setEventStatus(''); setSort('newest'); }}
            className="px-2 py-1 text-[10px] font-medium text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors flex items-center gap-1"
            title="Clear filters"
          >
            {activeFilterCount} active
            <HiOutlineXMark size={10} />
          </button>
        )}

        {/* Push search to right */}
        <div className="flex-1" />

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex items-center">
          <div className={\`flex items-center transition-all duration-300 \${searchOpen ? 'w-48 sm:w-56' : 'w-8'}\`}>
            {searchOpen ? (
              <div className="relative w-full flex items-center">
                <HiOutlineMagnifyingGlass size={14} className="absolute left-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                  onBlur={() => { if (!search) setSearchOpen(false); }}
                  onKeyDown={(e) => { if (e.key === 'Escape') { setSearch(''); setSearchOpen(false); } }}
                  className="w-full pl-8 pr-8 py-1.5 text-xs border border-gray-200 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none placeholder-gray-400"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => { setSearch(''); onSearch(); }}
                    className="absolute right-2 text-gray-400 hover:text-gray-600"
                  >
                    <HiOutlineXMark size={14} />
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
              >
                <HiOutlineMagnifyingGlass size={16} />
              </button>
            )}
          </div>
          {searchOpen && search && (
            <button
              type="submit"
              className="ml-2 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 active:scale-95 whitespace-nowrap"
            >
              Search
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default FeedFilters;
`;

const targetPath = path.join(__dirname, 'src', 'components', 'browse', 'FeedFilters.jsx');
fs.writeFileSync(targetPath, content, 'utf8');
console.log('Written to:', targetPath);
