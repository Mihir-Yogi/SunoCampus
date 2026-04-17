import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useSaveContext } from '../context/SaveContext';
import { HiOutlineBookmark, HiBookmark, HiOutlineMagnifyingGlass, HiOutlineExclamationTriangle } from 'react-icons/hi2';
import EventCard from '../components/browse/EventCard';
import PostCard from '../components/browse/PostCard';
import PostDetail from '../components/browse/PostDetail';
import ReportModal from '../components/ReportModal';

export default function SavedItems() {
  const navigate = useNavigate();
  const { toggleSave } = useSaveContext();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, posts, events
  const [search, setSearch] = useState('');
  const [selectedPost, setSelectedPost] = useState(null);
  const [showReport, setShowReport] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const fetchSavedItems = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      // Convert plural filter to singular for API (posts -> post, events -> event)
      const typeParam = filter === 'all' ? 'all' : filter.slice(0, -1); // Remove trailing 's'
      
      const res = await api.get('/saves', {
        params: { type: typeParam, page, limit: 12 },
      });

      if (res.data.success) {
        setItems(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch saved items:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchSavedItems(1);
  }, [filter, fetchSavedItems]);

  const handleUnsave = async (saveId, contentType, contentId) => {
    try {
      await toggleSave(contentType, contentId);
      setItems(items.filter(item => item.saveId !== saveId));
      setPagination(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }));
    } catch (error) {
      console.error('Failed to unsave:', error);
    }
  };

  const filteredItems = items.filter(item => {
    const content = item.content;
    if (!content) return false;
    const searchText = search.toLowerCase();
    return (content.title || '').toLowerCase().includes(searchText);
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <HiBookmark size={32} className="text-blue-600" />
            Saved Items
          </h1>
          <p className="text-gray-600">Your bookmarked posts and events</p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            {/* Filter Tabs */}
            <div className="flex gap-2">
              {['all', 'posts', 'events'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    filter === f
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="flex-1 relative">
              <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search saved items..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Info */}
          <div className="mt-4 text-sm text-gray-600">
            Showing <span className="font-semibold">{filteredItems.length}</span> of{' '}
            <span className="font-semibold">{pagination.total}</span> saved{' '}
            {filter === 'all' ? 'items' : filter}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <HiOutlineBookmark className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No saved items yet</h3>
            <p className="text-gray-600 max-w-sm mx-auto">
              {search ? 'Try adjusting your search filters' : 'Bookmark posts and events to save them for later'}
            </p>
          </div>
        ) : (
          <>
            {/* Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {filteredItems.map((item, idx) => {
                const content = item.content;
                if (!content) return null;

                return (
                  <div key={item.saveId} className="relative">
                    {item.type === 'post' ? (
                      <PostCard
                        post={content}
                        onLike={async () => {}}
                        onOpenPost={() => setSelectedPost(content._id)}
                        onAuthorClick={() => navigate(`/user/${content.createdBy._id}`)}
                        onReport={(report) => setShowReport(report)}
                        index={idx}
                      />
                    ) : (
                      <EventCard
                        event={content}
                        onRegister={async () => {}}
                        onOpenEvent={() => navigate(`/event/${content._id}`)}
                        onAuthorClick={() => navigate(`/user/${content.createdBy._id}`)}
                        onReport={(report) => setShowReport(report)}
                        index={idx}
                      />
                    )}

                    {/* Unsave Button Overlay */}
                    <button
                      onClick={() => handleUnsave(item.saveId, item.type, content._id)}
                      className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-all z-10"
                      title="Remove from saves"
                    >
                      <HiBookmark size={20} className="text-amber-500" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => fetchSavedItems(Math.max(1, pagination.page - 1))}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-gray-600">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => fetchSavedItems(Math.min(pagination.pages, pagination.page + 1))}
                  disabled={pagination.page === pagination.pages}
                  className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* Modals */}
        {selectedPost && (
          <PostDetail
            postId={selectedPost}
            onClose={() => setSelectedPost(null)}
            onAuthorClick={() => {}}
          />
        )}

        {showReport && (
          <ReportModal
            report={showReport}
            onClose={() => setShowReport(null)}
            onSubmit={async () => setShowReport(null)}
          />
        )}
      </div>
    </div>
  );
}
