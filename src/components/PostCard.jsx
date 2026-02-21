import { useState } from 'react';

export const PostCard = ({ post, onLike, onComment, onBookmark }) => {
  const [showComments, setShowComments] = useState(false);
  const [isLiked, setIsLiked] = useState(post?.isLiked || false);

  const handleLike = () => {
    setIsLiked(!isLiked);
    onLike?.(post.id);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      {/* Post Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-bold">{post.author?.name?.charAt(0)}</span>
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{post.author?.name}</h3>
            <p className="text-sm text-gray-500">{post.createdAt}</p>
          </div>
        </div>
        <button className="text-gray-500 hover:text-gray-700">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
          </svg>
        </button>
      </div>

      {/* Post Content */}
      <p className="text-gray-800 mb-4">{post.content}</p>

      {/* Post Image */}
      {post.image && (
        <img src={post.image} alt="Post" className="w-full rounded-lg mb-4 object-cover" />
      )}

      {/* Post Stats */}
      <div className="flex justify-between text-sm text-gray-500 mb-4 pb-4 border-b">
        <span>{post.likes || 0} Likes</span>
        <span>{post.comments || 0} Comments</span>
        <span>{post.shares || 0} Shares</span>
      </div>

      {/* Post Actions */}
      <div className="flex justify-between gap-4">
        <button
          onClick={handleLike}
          className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg font-medium transition ${
            isLiked
              ? 'text-blue-600 bg-blue-50'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <svg className="w-5 h-5" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m0 0l-2-1m2 1v2.5M14 4l-2 1m0 0l-2-1m2 1v2.5" />
          </svg>
          <span>Like</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex-1 flex items-center justify-center space-x-2 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
          <span>Comment</span>
        </button>

        <button
          onClick={() => onBookmark?.(post.id)}
          className="flex-1 flex items-center justify-center space-x-2 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h6a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          <span>Bookmark</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 pt-4 border-t">
          <div className="space-y-3 mb-4">
            {/* Sample comments */}
            <div className="flex space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">User Name</p>
                <p className="text-sm text-gray-600">Great post!</p>
              </div>
            </div>
          </div>
          
          {/* Comment Input */}
          <div className="flex items-center space-x-3">
            <input
              type="text"
              placeholder="Write a comment..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.target.value) {
                  onComment?.(post.id, e.target.value);
                  e.target.value = '';
                }
              }}
            />
            <button className="text-blue-600 hover:text-blue-700 font-medium">Post</button>
          </div>
        </div>
      )}
    </div>
  );
};
