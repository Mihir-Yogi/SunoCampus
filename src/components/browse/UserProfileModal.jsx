import { useState, useEffect } from 'react';
import {
  HiOutlineXMark,
  HiOutlineAcademicCap,
  HiOutlineBuildingLibrary,
  HiOutlineDocumentText,
  HiOutlineCalendarDays,
  HiOutlineSparkles,
  HiOutlineUserCircle,
} from 'react-icons/hi2';
import api from '../../services/api';

const UserProfileModal = ({ userId, onClose }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) return;
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await api.get(`/browse/users/${userId}`);
        setProfile(res.data.data);
      } catch (err) {
        console.error('Fetch public profile error:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId]);

  if (!userId) return null;

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      month: 'long',
      year: 'numeric',
    });
  };

  const getRoleBadge = (role) => {
    if (role === 'contributor') return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
        <HiOutlineSparkles size={12} />
        Contributor
      </span>
    );
    if (role === 'admin') return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700">
        Admin
      </span>
    );
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
        Student
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-bounceIn">
        {/* Header gradient */}
        <div className="h-28 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
          >
            <HiOutlineXMark size={18} />
          </button>
        </div>

        {/* Avatar overlapping header */}
        <div className="flex justify-center -mt-14">
          {loading ? (
            <div className="w-28 h-28 rounded-full bg-gray-200 border-4 border-white shadow-lg animate-pulse" />
          ) : profile?.avatar ? (
            <img
              src={profile.avatar}
              alt={profile.fullName}
              className="w-28 h-28 rounded-full border-4 border-white shadow-lg object-cover"
            />
          ) : (
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 border-4 border-white shadow-lg flex items-center justify-center text-white text-3xl font-bold">
              {getInitials(profile?.fullName)}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="px-6 pb-6 pt-3">
          {loading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-2/3 mx-auto" />
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto" />
              <div className="h-20 bg-gray-100 rounded-xl" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <HiOutlineUserCircle size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">{error}</p>
            </div>
          ) : profile ? (
            <>
              {/* Name + Role */}
              <div className="text-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">{profile.fullName}</h2>
                <div className="mt-2">{getRoleBadge(profile.role)}</div>
              </div>

              {/* Bio */}
              {profile.bio && (
                <p className="text-sm text-gray-600 text-center mb-4 leading-relaxed">
                  {profile.bio}
                </p>
              )}

              {/* Stats */}
              <div className="flex justify-center gap-6 mb-5">
                <div className="text-center">
                  <p className="text-xl font-bold text-gray-900">{profile.postsCount}</p>
                  <p className="text-xs text-gray-500">Posts</p>
                </div>
                <div className="w-px bg-gray-200" />
                <div className="text-center">
                  <p className="text-xl font-bold text-gray-900">{profile.eventsCount}</p>
                  <p className="text-xs text-gray-500">Events</p>
                </div>
              </div>

              {/* Details Card */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                {/* College */}
                {profile.college && (
                  <div className="flex items-start gap-3">
                    <HiOutlineBuildingLibrary size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-400 font-medium">College</p>
                      <p className="text-sm text-gray-800">{profile.college.name}</p>
                    </div>
                  </div>
                )}

                {/* Branch / Program */}
                {(profile.branch || profile.degreeProgram) && (
                  <div className="flex items-start gap-3">
                    <HiOutlineAcademicCap size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-400 font-medium">
                        {profile.degreeProgram ? 'Program' : 'Branch'}
                      </p>
                      <p className="text-sm text-gray-800">
                        {profile.degreeProgram || profile.branch}
                        {profile.currentYear ? ` · Year ${profile.currentYear}` : ''}
                      </p>
                    </div>
                  </div>
                )}

                {/* Academic Interests */}
                {profile.academicInterests && (
                  <div className="flex items-start gap-3">
                    <HiOutlineDocumentText size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Interests</p>
                      <p className="text-sm text-gray-800">{profile.academicInterests}</p>
                    </div>
                  </div>
                )}

                {/* Joined */}
                {profile.joinedAt && (
                  <div className="flex items-start gap-3">
                    <HiOutlineCalendarDays size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Joined</p>
                      <p className="text-sm text-gray-800">{formatDate(profile.joinedAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
