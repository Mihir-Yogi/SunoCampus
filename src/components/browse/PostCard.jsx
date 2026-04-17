import { useState, useRef, useEffect } from 'react';
import { useSaveContext } from '../../context/SaveContext';
import { HiOutlineHeart, HiHeart, HiOutlineChatBubbleOvalLeft, HiOutlineEllipsisVertical, HiOutlineFlag, HiOutlineBookmark, HiBookmark } from 'react-icons/hi2';

const PostCard = ({ post, onLike, onOpenPost, onAuthorClick, onReport, index = 0 }) => {
  const { toggleSave, isSavedItem } = useSaveContext();
  const [isLiking, setIsLiking] = useState(false);
  const [justLiked, setJustLiked] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const heartRef = useRef(null);
  const menuRef = useRef(null);

  // Check if post is saved on mount
  useEffect(() => {
    setIsSaved(isSavedItem('post', post._id));
  }, [post._id, isSavedItem]);

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    const handleClick = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showMenu]);

  const handleLike = async (e) => {
    e.stopPropagation();
    if (isLiking) return;
    setIsLiking(true);
    setJustLiked(!post.isLiked);
    try {
      await onLike(post._id);
    } finally {
      setIsLiking(false);
      setTimeout(() => setJustLiked(false), 400);
    }
  };

  const handleSave = async (e) => {
    e.stopPropagation();
    if (isSaving) return;
    setIsSaving(true);
    try {
      const result = await toggleSave('post', post._id);
      setIsSaved(result);
    } catch (error) {
      console.error('Failed to save/unsave post:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Time ago helper
  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}w ago`;
    return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  // Author initials
  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  // Truncate content
  const truncate = (text, maxLen = 150) => {
    if (!text || text.length <= maxLen) return text;
    return text.slice(0, maxLen).trim() + '...';
  };

  return (
    <div
      onClick={() => onOpenPost(post._id)}
      className="bg-white rounded-xl border border-gray-200 hover:border-blue-200 hover:shadow-lg transition-all duration-300 cursor-pointer group animate-card-enter hover:-translate-y-1"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Post Image */}
      {post.image && (
        <div className="aspect-video w-full overflow-hidden bg-gray-100">
          <img
            src={post.image}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}

      <div className="p-4">
        {/* Author Row */}
        <div
          className="flex items-center gap-2.5 mb-3 cursor-pointer group/author"
          onClick={(e) => {
            e.stopPropagation();
            if (post.createdBy?._id && onAuthorClick) onAuthorClick(post.createdBy._id);
          }}
        >
          {post.createdBy?.avatar || post.createdBy?.profilePicture ? (
            <img
              src={post.createdBy.avatar || post.createdBy.profilePicture}
              alt={post.createdBy.fullName}
              className="w-8 h-8 rounded-full object-cover flex-shrink-0 ring-2 ring-transparent group-hover/author:ring-blue-300 transition-all"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ring-2 ring-transparent group-hover/author:ring-blue-300 transition-all">
              {getInitials(post.createdBy?.fullName)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-800 truncate group-hover/author:text-blue-600 transition-colors">
              {post.createdBy?.fullName || 'Unknown'}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <span className="truncate">{post.college?.abbreviation || post.college?.name || ''}</span>
              <span>·</span>
              <span className="flex-shrink-0">{timeAgo(post.createdAt)}</span>
            </div>
          </div>
          {/* Scope badge */}
          {post.scope === 'global' && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded flex-shrink-0">
              Global
            </span>
          )}

          {/* More menu */}
          <div className="relative ml-auto flex-shrink-0 z-50" ref={menuRef}>
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
              className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors opacity-0 group-hover:opacity-100"
            >
              <HiOutlineEllipsisVertical size={16} />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-gray-200 py-1.5 z-50 animate-fadeIn">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    if (onReport) onReport({ type: 'post', userId: post.createdBy?._id, contentId: post._id, title: post.title });
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <HiOutlineFlag size={15} /> Report Post
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-gray-900 mb-1.5 line-clamp-2 group-hover:text-blue-700 transition-colors">
          {post.title}
        </h3>

        {/* Content Preview */}
        <p className="text-sm text-gray-600 leading-relaxed mb-3 line-clamp-3">
          {truncate(post.content)}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
          <button
            onClick={handleLike}
            disabled={isLiking}
            className={`flex items-center gap-1.5 text-sm transition-all duration-200 ${
              post.isLiked
                ? 'text-red-500 hover:text-red-600'
                : 'text-gray-400 hover:text-red-500'
            } ${isLiking ? 'opacity-50' : ''}`}
          >
            <span ref={heartRef} className={`inline-flex ${justLiked ? 'animate-heart-pop' : ''}`}>
              {post.isLiked ? <HiHeart size={18} /> : <HiOutlineHeart size={18} />}
            </span>
            <span className="font-medium tabular-nums">{post.likesCount || 0}</span>
          </button>

          <div className="flex items-center gap-1.5 text-sm text-gray-400">
            <HiOutlineChatBubbleOvalLeft size={18} />
            <span className="font-medium">{post.commentsCount || 0}</span>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`ml-auto flex items-center gap-1.5 text-sm transition-all duration-200 ${
              isSaved
                ? 'text-amber-500 hover:text-amber-600'
                : 'text-gray-400 hover:text-amber-500'
            } ${isSaving ? 'opacity-50' : ''}`}
            title={isSaved ? 'Remove from saves' : 'Save post'}
          >
            {isSaved ? <HiBookmark size={18} /> : <HiOutlineBookmark size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostCard;
