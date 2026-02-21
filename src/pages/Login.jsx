import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import FormInput from '../components/FormInput';
import PrimaryButton from '../components/PrimaryButton';
import Toast from '../components/Toast';
import api from '../services/api';

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [rememberMe, setRememberMe] = useState(false);

  // Email validation regex
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle login submission
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setToast({
        type: 'error',
        message: 'Please fill all required fields correctly'
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post('/auth/login', {
        email: formData.email,
        password: formData.password,
        rememberMe: rememberMe,
      });

      if (response.data.success) {
        // Save token and user data
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        }

        // Call the onLogin callback to update parent state
        onLogin?.();

        setToast({
          type: 'success',
          message: 'Login successful! Redirecting...'
        });

        // Redirect after short delay
        setTimeout(() => {
          navigate('/about');
        }, 1500);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Login failed. Please try again.';
      setToast({
        type: 'error',
        message: errorMessage
      });

      // Highlight email field if invalid
      if (error.response?.status === 401) {
        setErrors({ email: 'Invalid email or password' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google Login (mock implementation)
  const handleGoogleLogin = async () => {
    setToast({
      type: 'info',
      message: 'Google login integration coming soon!'
    });
    // TODO: Implement actual Google OAuth
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4 py-8">
      {/* Toast notification */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm bg-opacity-95 animate-fadeIn">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-700 to-blue-900 px-6 py-8 sm:px-8">
            <h1 className="text-3xl font-bold text-white mb-2">SunoCampus</h1>
            <p className="text-blue-100">Welcome Back</p>
          </div>

          {/* Form Content */}
          <div className="p-6 sm:p-8">
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email Input */}
              <FormInput
                label="College Email"
                type="email"
                name="email"
                placeholder="yourname@gnu.ac.in"
                value={formData.email}
                onChange={handleInputChange}
                error={errors.email}
                validation={(value) => {
                  if (!value) return false;
                  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                  return emailRegex.test(value);
                }}
                required
              />

              {/* Password Input */}
              <FormInput
                label="Password"
                type="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange}
                error={errors.password}
                hideSuccessIcon={true}
                required
              />

              {/* Remember & Forgot Password */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
                  />
                  <span className="text-gray-700 group-hover:text-blue-600 transition-colors">
                    Remember me for 7 days
                  </span>
                </label>
                <Link
                  to="#"
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>

              {/* Login Button */}
              <PrimaryButton
                type="submit"
                isLoading={isLoading}
                disabled={isLoading}
                size="lg"
              >
                {isLoading ? 'Logging in' : 'Login to SunoCampus'}
              </PrimaryButton>

              {/* Divider */}
              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-white text-gray-600 font-medium">
                    OR Continue With
                  </span>
                </div>
              </div>

              {/* Google Login Button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full py-3 px-4 border-2 border-gray-300 rounded-lg font-semibold text-gray-900 bg-white hover:bg-gray-50 transition-all duration-300 hover:shadow-md hover:-translate-y-1 flex items-center justify-center gap-3"
              >
                <span className="text-xl font-bold">G</span>
                Google Login (College Email)
              </button>

              {/* Register Link */}
              <p className="text-center text-gray-700 mt-6">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="text-blue-600 font-semibold hover:text-blue-700 transition-colors"
                >
                  Register Now
                </Link>
              </p>

              {/* Help Link */}
              <p className="text-center text-sm text-gray-500 hover:text-gray-700 cursor-pointer transition-colors">
                [Need Help?]
              </p>
            </form>
          </div>
        </div>

        {/* Footer Text */}
        <p className="text-center text-gray-600 text-sm mt-6">
          For security, never share your password with anyone
        </p>
      </div>
    </div>
  );
}
