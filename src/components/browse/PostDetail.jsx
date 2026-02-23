import { useState, useEffect, useRef, useCallback } from 'react';
import {
  HiOutlineHeart,
  HiHeart,
  HiOutlineChatBubbleOvalLeft,
  HiOutlineTrash,
  HiOutlineXMark,
  HiOutlinePaperAirplane,
  HiOutlineFlag,
} from 'react-icons/hi2';
import api from '../../services/api';

const PostDetail = ({ postId, onClose, onLikeUpdate, onCommentCountUpdate, onAuthorClick, onReport }) => {
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [commentPage, setCommentPage] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [totalComments, setTotalComments] = useState(0);
  const [error, setError] = useState('');
  const overlayRef = useRef(null);
  const inputRef = useRef(null);
  const [justLiked, setJustLiked] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const heartRef = useRef(null);

  // Get current user
  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  })();

  // Fetch post
  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/browse/posts/${postId}`);
        setPost(res.data.data);
      } catch (err) {
        setError('Failed to load post');
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [postId]);

  // Fetch comments
  useEffect(() => {
    if (!postId) return;
    fetchComments(1, true);
  }, [postId]);

  const fetchComments = async (page = 1, replace = false) => {
    try {
      setCommentsLoading(true);
      const res = await api.get(`/browse/posts/${postId}/comments?page=${page}&limit=15`);
      const { comments: newComments, pagination } = res.data.data;
      setComments(prev => replace ? newComments : [...prev, ...newComments]);
      setCommentPage(pagination.currentPage);
      setHasMoreComments(pagination.hasMore);
      setTotalComments(pagination.totalItems);
    } catch {
      // silent fail for comments
    } finally {
      setCommentsLoading(false);
    }
  };

  // Like toggle
  const handleLike = async () => {
    if (isLiking || !post) return;
    setIsLiking(true);

    // Optimistic update
    const wasLiked = post.isLiked;
    if (!wasLiked) {
      setJustLiked(true);
      setTimeout(() => setJustLiked(false), 500);
    }
    setPost(prev => ({
      ...prev,
      isLiked: !prev.isLiked,
      likesCount: prev.isLiked ? prev.likesCount - 1 : prev.likesCount + 1,
    }));

    try {
      const res = await api.post(`/browse/posts/${postId}/like`);
      setPost(prev => ({
        ...prev,
        isLiked: res.data.data.isLiked,
        likesCount: res.data.data.likesCount,
      }));
      // Notify parent to update card
      if (onLikeUpdate) {
        onLikeUpdate(postId, res.data.data.isLiked, res.data.data.likesCount);
      }
    } catch {
      // Rollback
      setPost(prev => ({
        ...prev,
        isLiked: wasLiked,
        likesCount: wasLiked ? prev.likesCount + 1 : prev.likesCount - 1,
      }));
    } finally {
      setIsLiking(false);
    }
  };

  // Add comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await api.post(`/browse/posts/${postId}/comments`, {
        content: commentText.trim(),
      });
      setComments(prev => [res.data.data, ...prev]);
      setTotalComments(prev => prev + 1);
      setCommentText('');
      // Update comment count on post
      const newCount = (post?.commentsCount || 0) + 1;
      setPost(prev => ({ ...prev, commentsCount: newCount }));
      if (onCommentCountUpdate) onCommentCountUpdate(postId, newCount);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await api.delete(`/browse/comments/${commentId}`);
      setComments(prev => prev.filter(c => c._id !== commentId));
      setTotalComments(prev => prev - 1);
      const newCount = Math.max(0, (post?.commentsCount || 1) - 1);
      setPost(prev => ({ ...prev, commentsCount: newCount }));
      if (onCommentCountUpdate) onCommentCountUpdate(postId, newCount);
    } catch {
      setError('Failed to delete comment');
    }
  };

  // Close on overlay click
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Time ago
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

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div ref={overlayRef} onClick={handleOverlayClick} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-overlay-in">
        <div className="bg-white rounded-2xl p-8 max-w-2xl w-full animate-modal-in">
          <div className="space-y-4">
            <div className="h-6 skeleton-shimmer rounded w-3/4" />
            <div className="h-4 skeleton-shimmer rounded w-full" />
            <div className="h-4 skeleton-shimmer rounded w-5/6" />
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div ref={overlayRef} onClick={handleOverlayClick} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-overlay-in">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center animate-modal-in">
          <p className="text-gray-500">{error || 'Post not found'}</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200 active:scale-95 transition-all">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto animate-overlay-in"
    >
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto my-4 animate-modal-in browse-scrollbar">
        {/* Header */}
        <div className="sticky top-0 bg-white/90 backdrop-blur-sm border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div
            className="flex items-center gap-3 cursor-pointer group/author"
            onClick={() => {
              if (post.createdBy?._id && onAuthorClick) onAuthorClick(post.createdBy._id);
            }}
          >
            {post.createdBy?.avatar || post.createdBy?.profilePicture ? (
              <img
                src={post.createdBy.avatar || post.createdBy.profilePicture}
                alt={post.createdBy.fullName}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm group-hover/author:ring-blue-300 transition-all"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-sm font-bold ring-2 ring-white shadow-sm group-hover/author:ring-blue-300 transition-all">
                {getInitials(post.createdBy?.fullName)}
              </div>
            )}
            <div>
              <p className="font-semibold text-gray-800 group-hover/author:text-blue-600 transition-colors">{post.createdBy?.fullName || 'Unknown'}</p>
              <p className="text-xs text-gray-400">
                {post.college?.abbreviation || post.college?.name} · {timeAgo(post.createdAt)}
                {post.scope === 'global' && (
                  <span className="ml-1.5 px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded text-[10px] font-medium">Global</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                if (onReport && post) onReport({ type: 'post', userId: post.createdBy?._id, contentId: post._id, title: post.title });
              }}
              className="p-2 hover:bg-red-50 rounded-lg transition-all active:scale-90 group/report"
              title="Report this post"
            >
              <HiOutlineFlag size={18} className="text-gray-400 group-hover/report:text-red-500 transition-colors" />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-all active:scale-90">
              <HiOutlineXMark size={20} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Post Content */}
        <div className="px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900 mb-3">{post.title}</h2>

          {post.image && (
            <div className="mb-4 rounded-xl overflow-hidden bg-gray-100 relative">
              {!imageLoaded && <div className="w-full aspect-video skeleton-shimmer" />}
              <img
                src={post.image}
                alt={post.title}
                onLoad={() => setImageLoaded(true)}
                className={`w-full max-h-96 object-contain ${imageLoaded ? 'animate-image-reveal' : 'opacity-0 absolute inset-0'}`}
              />
            </div>
          )}

          <div className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">
            {post.content}
          </div>

          {/* Like & Comment Stats */}
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
            <button
              onClick={handleLike}
              disabled={isLiking}
              className={`flex items-center gap-1.5 text-sm font-medium transition-all duration-200 ${
                post.isLiked ? 'text-red-500 hover:text-red-600' : 'text-gray-400 hover:text-red-500'
              }`}
            >
              <span ref={heartRef} className={justLiked ? 'animate-heart-pop inline-flex' : 'inline-flex'}>
                {post.isLiked ? <HiHeart size={20} /> : <HiOutlineHeart size={20} />}
              </span>
              <span className={`tabular-nums ${justLiked ? 'animate-count-pop' : ''}`}>{post.likesCount || 0}</span> {post.likesCount === 1 ? 'Like' : 'Likes'}
            </button>
            <div className="flex items-center gap-1.5 text-sm text-gray-400">
              <HiOutlineChatBubbleOvalLeft size={20} />
              {totalComments} {totalComments === 1 ? 'Comment' : 'Comments'}
            </div>
          </div>
        </div>

        {/* Comment Input */}
        <div className="px-6 pb-3">
          <form onSubmit={handleAddComment} className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
              {getInitials(currentUser?.fullName)}
            </div>
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                maxLength={2000}
                rows={1}
                className="w-full px-3 py-2 pr-10 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none placeholder-gray-400 transition-all duration-200"
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddComment(e);
                  }
                }}
              />
              <button
                type="submit"
                disabled={!commentText.trim() || submitting}
                className="absolute right-2 bottom-2 text-blue-600 disabled:text-gray-300 hover:text-blue-700 transition-colors"
              >
                <HiOutlinePaperAirplane size={18} />
              </button>
            </div>
          </form>
          {error && <p className="text-xs text-red-500 mt-1 ml-11">{error}</p>}
        </div>

        {/* Comments List */}
        <div className="px-6 pb-6">
          {commentsLoading && comments.length === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-full skeleton-shimmer" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 skeleton-shimmer rounded w-20" />
                    <div className="h-3 skeleton-shimmer rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : comments.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              No comments yet. Be the first to comment!
            </p>
          ) : (
            <div className="space-y-3">
              {comments.map((comment, idx) => (
                <div key={comment._id} className="flex items-start gap-2.5 group animate-comment-in" style={{ animationDelay: `${idx * 40}ms` }}>
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5">
                    {getInitials(comment.user?.fullName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="bg-gray-50 rounded-xl px-3 py-2">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold text-gray-800">
                          {comment.user?.fullName}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {timeAgo(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                        {comment.content}
                      </p>
                    </div>
                    {/* Delete button — only for comment author or admin */}
                    {currentUser && (comment.user?._id === currentUser._id || currentUser.role === 'admin') && (
                      <button
                        onClick={() => handleDeleteComment(comment._id)}
                        className="mt-0.5 ml-2 text-[11px] text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5"
                      >
                        <HiOutlineTrash size={12} /> Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Load more */}
              {hasMoreComments && (
                <button
                  onClick={() => fetchComments(commentPage + 1, false)}
                  disabled={commentsLoading}
                  className="w-full py-2 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  {commentsLoading ? 'Loading...' : 'Load more comments'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostDetail;
