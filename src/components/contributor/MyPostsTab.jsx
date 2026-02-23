import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineHeart,
  HiOutlineChatBubbleLeft,
  HiOutlinePhoto,
  HiOutlineXMark,
  HiOutlinePencilSquare,
} from 'react-icons/hi2';

export default function MyPostsTab({ showToast }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [deletePostId, setDeletePostId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/contributor/posts');
      if (res.data.success) setPosts(res.data.data);
    } catch {
      showToast('error', 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleDeletePost = async () => {
    if (!deletePostId) return;
    try {
      setDeleting(true);
      const res = await api.delete(`/contributor/posts/${deletePostId}`);
      if (res.data.success) {
        showToast('success', 'Post deleted');
        fetchPosts();
      }
    } catch {
      showToast('error', 'Failed to delete post');
    } finally {
      setDeleting(false);
      setDeletePostId(null);
    }
  };

  const handleModalClose = (refresh) => {
    setShowModal(false);
    setEditingPost(null);
    if (refresh) fetchPosts();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">My Posts</h1>
        <button
          onClick={() => { setEditingPost(null); setShowModal(true); }}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          <HiOutlinePlus className="w-5 h-5" />
          Create Post
        </button>
      </div>

      {/* Posts */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <HiOutlinePencilSquare className="w-16 h-16 text-gray-300 mx-auto" />
          <p className="text-gray-500 mt-3 text-lg">No posts yet</p>
          <p className="text-gray-400 text-sm mt-1">Share updates with your campus</p>
          <button
            onClick={() => { setEditingPost(null); setShowModal(true); }}
            className="mt-4 inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            <HiOutlinePlus className="w-4 h-4" />
            Create Post
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {posts.map((post) => (
            <div key={post._id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
              {/* Image */}
              {post.image ? (
                <img src={post.image} alt="" className="w-full h-40 object-cover" />
              ) : (
                <div className="w-full h-24 bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
                  <HiOutlinePencilSquare className="w-10 h-10 text-purple-300" />
                </div>
              )}

              <div className="p-4">
                <h3 className="font-semibold text-gray-900 leading-tight truncate">{post.title}</h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{post.content}</p>

                {/* Meta */}
                <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                  <span>{new Date(post.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <HiOutlineHeart className="w-3.5 h-3.5 text-rose-400" />
                      {post.likesCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <HiOutlineChatBubbleLeft className="w-3.5 h-3.5 text-blue-400" />
                      {post.commentsCount}
                    </span>
                    {post.image && <HiOutlinePhoto className="w-3.5 h-3.5 text-green-400" />}
                  </div>
                </div>

                {post.scope === 'global' && (
                  <span className="inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">Global</span>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => { setEditingPost(post); setShowModal(true); }}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <HiOutlinePencil className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => setDeletePostId(post._id)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <HiOutlineTrash className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Post Form Modal */}
      {showModal && (
        <PostFormModal
          post={editingPost}
          onClose={handleModalClose}
          showToast={showToast}
        />
      )}

      {/* Delete Confirmation */}
      {deletePostId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900">Delete Post?</h3>
            <p className="text-sm text-gray-600 mt-2">
              This will permanently delete this post along with all its likes and comments.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setDeletePostId(null)}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Keep Post
              </button>
              <button
                onClick={handleDeletePost}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Post Form Modal (inline) ──
function PostFormModal({ post, onClose, showToast }) {
  const isEdit = !!post;
  const [form, setForm] = useState({
    title: post?.title || '',
    content: post?.content || '',
    scope: post?.scope || 'campus',
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(post?.image || '');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('error', 'Image must be under 5MB');
        return;
      }
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = {};
    if (!form.title.trim()) err.title = 'Required';
    if (!form.content.trim()) err.content = 'Required';
    setErrors(err);
    if (Object.keys(err).length > 0) return;

    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('content', form.content);
      formData.append('scope', form.scope);
      if (image) formData.append('image', image);

      let res;
      if (isEdit) {
        res = await api.put(`/contributor/posts/${post._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        res = await api.post('/contributor/posts', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      if (res.data.success) {
        showToast('success', res.data.message);
        onClose(true);
      }
    } catch (error) {
      showToast('error', error.response?.data?.message || 'Failed to save post');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl w-full max-w-lg my-8 shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">{isEdit ? 'Edit Post' : 'Create Post'}</h2>
          <button onClick={() => onClose(false)} className="p-1 hover:bg-gray-100 rounded-lg">
            <HiOutlineXMark className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => { setForm(p => ({ ...p, title: e.target.value })); setErrors(p => ({ ...p, title: '' })); }}
              placeholder="Post title"
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 ${errors.title ? 'border-red-400' : 'border-gray-200'}`}
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
            <textarea
              rows={5}
              value={form.content}
              onChange={(e) => { setForm(p => ({ ...p, content: e.target.value })); setErrors(p => ({ ...p, content: '' })); }}
              placeholder="Write your post..."
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 resize-none ${errors.content ? 'border-red-400' : 'border-gray-200'}`}
            />
            {errors.content && <p className="text-xs text-red-500 mt-1">{errors.content}</p>}
          </div>

          {/* Scope */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Scope</label>
            <div className="flex gap-3">
              {[{ value: 'campus', label: 'Campus Only' }, { value: 'global', label: 'Global' }].map(s => (
                <label key={s.value} className={`flex-1 flex items-center justify-center px-3 py-2 border rounded-lg cursor-pointer text-sm font-medium transition-colors
                  ${form.scope === s.value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                  <input type="radio" name="postScope" value={s.value} checked={form.scope === s.value}
                    onChange={(e) => setForm(p => ({ ...p, scope: e.target.value }))} className="sr-only" />
                  {s.label}
                </label>
              ))}
            </div>
          </div>

          {/* Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image (optional)</label>
            {imagePreview && (
              <div className="mb-2 relative">
                <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover rounded-lg" />
                <button type="button" onClick={() => { setImage(null); setImagePreview(''); }}
                  className="absolute top-2 right-2 bg-white/90 p-1 rounded-full hover:bg-white">
                  <HiOutlineXMark className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            )}
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange}
              className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => onClose(false)}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Saving...' : isEdit ? 'Update Post' : 'Publish Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
