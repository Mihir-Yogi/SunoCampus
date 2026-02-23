import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FormInput from '../components/FormInput';
import PrimaryButton from '../components/PrimaryButton';
import Toast from '../components/Toast';
import OTPInput from '../components/OTPInput';
import api from '../services/api';

const Register = ({ onLogin }) => {
  const navigate = useNavigate();
  const [toasts, setToasts] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [colleges, setColleges] = useState([]);

  // Step 1: Email & OTP
  const [email, setEmail] = useState('');
  const [otp, setOTP] = useState('');
  const [otpSent, setOTPSent] = useState(false);
  const [otpTimer, setOTPTimer] = useState(0);
  const [emailVerified, setEmailVerified] = useState(false);

  // Step 2: Personal Details
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
  });

  // Step 3: College Details
  const [collegeData, setCollegeData] = useState({
    college: '',
    studentId: '',
    branch: '',
    currentYear: '',
    graduationYear: '',
  });

  // Step 4: Password
  const [passwords, setPasswords] = useState({
    password: '',
    confirmPassword: '',
  });

  // Handle Enter key to submit current step
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        // Skip auto-submit when a select dropdown is focused
        if (document.activeElement?.tagName === 'SELECT') return;
        e.preventDefault();
        if (currentStep === 1) {
          if (!otpSent) {
            handleSendOTP();
          }
          // OTP auto-verifies on 6 digits, no action needed here
        } else if (currentStep === 2) {
          handlePersonalDetailsNext();
        } else if (currentStep === 3) {
          handleCollegeDetailsNext();
        } else if (currentStep === 4) {
          handleRegisterComplete();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, otpSent, loading, email, otp, emailVerified, formData, collegeData, passwords]);

  // Fetch colleges on component mount
  useEffect(() => {
    const fetchColleges = async () => {
      try {
        const response = await api.get('/colleges');
        if (response.data.success) {
          setColleges(response.data.colleges);
        }
      } catch (error) {
        console.error('Failed to fetch colleges:', error);
        addToast('error', 'Failed to load college list');
      }
    };
    fetchColleges();
  }, []);

  // Add toast notification
  const addToast = (type, message) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Step 1: Send OTP
  const handleSendOTP = async () => {
    try {
      if (!email) {
        addToast('error', 'Please enter your email');
        return;
      }

      if (!email.includes('@')) {
        addToast('error', 'Invalid email format');
        return;
      }

      setLoading(true);
      const response = await api.post('/auth/send-otp', { email });

      if (response.data.success) {
        addToast('success', 'OTP sent to your email');
        setOTPSent(true);
        setOTPTimer(600); // 10 minutes in seconds

        // Countdown timer
        const interval = setInterval(() => {
          setOTPTimer((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              setOTPSent(false);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (error) {
      addToast('error', error.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Verify OTP
  const handleVerifyOTP = async (otpValue) => {
    const otpToVerify = otpValue || otp;
    try {
      if (!otpToVerify || otpToVerify.length !== 6) {
        addToast('error', 'Please enter a valid 6-digit OTP');
        return;
      }

      setLoading(true);
      const response = await api.post('/auth/verify-otp', { email, otp: otpToVerify });

      if (response.data.success) {
        addToast('success', 'Email verified successfully');
        setEmailVerified(true);
        setCurrentStep(2);
        setOTPSent(false);
      }
    } catch (error) {
      addToast('error', error.response?.data?.error || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  // Auto-verify OTP when all 6 digits are entered
  useEffect(() => {
    if (otp.length === 6 && otpSent && !emailVerified && !loading) {
      handleVerifyOTP(otp);
    }
  }, [otp]);

  // Step 2: Handle personal details
  const handlePersonalDetailsChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePersonalDetailsNext = () => {
    if (!formData.fullName) {
      addToast('error', 'Please enter your full name');
      return;
    }
    if (!formData.phone || formData.phone.length < 10) {
      addToast('error', 'Please enter a valid phone number');
      return;
    }
    if (!formData.dateOfBirth) {
      addToast('error', 'Please enter your date of birth');
      return;
    }
    if (!formData.gender) {
      addToast('error', 'Please select your gender');
      return;
    }

    setCurrentStep(3);
  };

  // Step 3: Handle college details
  const handleCollegeDetailsChange = (e) => {
    const { name, value } = e.target;
    
    // For studentId, only allow digits and limit to 11 characters
    if (name === 'studentId') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 11);
      setCollegeData((prev) => ({
        ...prev,
        [name]: digitsOnly,
      }));
      return;
    }
    
    // For currentYear, auto-calculate graduation year
    if (name === 'currentYear') {
      const year = parseInt(value);
      let calculatedGraduationYear = '';
      if (year) {
        // Assuming 4-year degree program
        // If 1st year: graduate in 3 years
        // If 2nd year: graduate in 2 years
        // If 3rd year: graduate in 1 year
        // If 4th year: graduate this year
        const yearsRemaining = 4 - year;
        calculatedGraduationYear = new Date().getFullYear() + yearsRemaining;
      }
      setCollegeData((prev) => ({
        ...prev,
        [name]: value,
        graduationYear: calculatedGraduationYear,
      }));
      return;
    }
    
    setCollegeData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCollegeDetailsNext = async () => {
    if (!collegeData.college) {
      addToast('error', 'Please select your college');
      return;
    }
    if (!collegeData.studentId) {
      addToast('error', 'Please enter your enrollment number');
      return;
    }
    if (collegeData.studentId.length !== 11) {
      addToast('error', 'Enrollment number must be exactly 11 digits');
      return;
    }
    if (!collegeData.branch) {
      addToast('error', 'Please select your branch');
      return;
    }
    if (!collegeData.currentYear) {
      addToast('error', 'Please select your current year');
      return;
    }

    // Check enrollment availability against database
    try {
      setLoading(true);
      const response = await api.post('/auth/check-enrollment', {
        college: collegeData.college,
        studentId: collegeData.studentId,
      });

      if (!response.data.available) {
        addToast('error', response.data.message);
        return;
      }

      setCurrentStep(4);
    } catch (error) {
      addToast('error', error.response?.data?.error || 'Failed to verify enrollment number');
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Handle passwords
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Step 4: Complete registration
  const handleRegisterComplete = async () => {
    try {
      if (!passwords.password) {
        addToast('error', 'Please enter a password');
        return;
      }
      if (!passwords.confirmPassword) {
        addToast('error', 'Please confirm your password');
        return;
      }
      if (passwords.password !== passwords.confirmPassword) {
        addToast('error', 'Passwords do not match');
        return;
      }
      if (passwords.password.length < 8) {
        addToast('error', 'Password must be at least 8 characters');
        return;
      }

      setLoading(true);

      const registrationData = {
        email,
        password: passwords.password,
        confirmPassword: passwords.confirmPassword,
        fullName: formData.fullName,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        college: collegeData.college,
        studentId: collegeData.studentId,
        branch: collegeData.branch,
        currentYear: collegeData.currentYear,
        graduationYear: collegeData.graduationYear,
      };

      const response = await api.post('/auth/register', registrationData);

      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        addToast('success', 'Account created successfully!');
        // Navigate first, then update auth state so the route guard
        // doesn't race and cause a flicker
        setTimeout(() => {
          navigate('/about');
          if (onLogin) onLogin();
        }, 1000);
      }
    } catch (error) {
      addToast('error', error.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const formatOTPTimer = () => {
    const mins = Math.floor(otpTimer / 60);
    const secs = otpTimer % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 px-4 pt-20 pb-12">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Join SunoCampus</h1>
          <p className="text-gray-600">Create your account to connect with your campus community</p>
        </div>

        {/* Progress Steps */}
        <div className="relative flex justify-between items-start mb-10">
          {/* Connecting line behind circles */}
          <div className="absolute top-5 left-0 right-0 flex px-[calc(12.5%)]">
            {[1, 2, 3].map((step) => (
              <div key={`line-${step}`} className="flex-1 h-1 mx-1">
                <div
                  className={`h-full rounded transition-all duration-300 ${
                    step < currentStep ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
              </div>
            ))}
          </div>

          {/* Step circles */}
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex flex-col items-center flex-1 z-10">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                  step <= currentStep
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}
              >
                {step}
              </div>
              <span className="text-xs text-gray-600 mt-2">
                {['Email', 'Details', 'College', 'Password'][step - 1]}
              </span>
            </div>
          ))}
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-200">
          {/* Step 1: Email & OTP */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Verify Your Email</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  College Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@college.edu"
                  disabled={otpSent || emailVerified}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-white"
                />
                <p className="text-xs text-gray-500 mt-2">Use your official college email address</p>
              </div>

              {!emailVerified ? (
                <>
                  <PrimaryButton
                    onClick={handleSendOTP}
                    loading={loading}
                    disabled={otpSent && otpTimer > 0 || loading}
                    className="w-full"
                  >
                    {loading ? 'Sending OTP...' : (otpSent && otpTimer > 0 ? `Resend in ${formatOTPTimer()}` : 'Send OTP')}
                  </PrimaryButton>

                  {otpSent && (
                    <div className="space-y-4 animate-slideDown">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
                          Enter 6-Digit OTP
                        </label>
                        <OTPInput 
                          value={otp} 
                          onChange={setOTP}
                          length={6}
                          autoFocus={true}
                        />
                        {loading && (
                          <p className="text-sm text-blue-600 text-center mt-3 animate-pulse">Verifying OTP...</p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-700 font-medium">✓ Email verified</p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Personal Details */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Personal Details</h2>

              <FormInput
                label="Full Name"
                name="fullName"
                value={formData.fullName}
                onChange={handlePersonalDetailsChange}
                placeholder="John Doe"
              />

              <FormInput
                label="Phone Number"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handlePersonalDetailsChange}
                placeholder="+91 9XXXXXXXXX"
                validation={(value) => /^\d{10,11}$/.test(value)}
              />

              <FormInput
                label="Date of Birth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handlePersonalDetailsChange}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handlePersonalDetailsChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all bg-white"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="flex gap-4">
                <PrimaryButton
                  onClick={() => setCurrentStep(1)}
                  variant="outline"
                  className="flex-1"
                >
                  Back
                </PrimaryButton>
                <PrimaryButton
                  onClick={handlePersonalDetailsNext}
                  className="flex-1"
                >
                  Next
                </PrimaryButton>
              </div>
            </div>
          )}

          {/* Step 3: College Details */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">College Information</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">College Name *</label>
                <select
                  value={collegeData.college}
                  onChange={(e) => setCollegeData(prev => ({ ...prev, college: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all bg-white"
                >
                  <option value="">Select Your College</option>
                  {colleges.map((college) => (
                    <option key={college._id} value={college._id}>
                      {college.name}
                    </option>
                  ))}
                </select>
              </div>

              <FormInput
                label="Enrollment Number"
                name="studentId"
                value={collegeData.studentId}
                onChange={handleCollegeDetailsChange}
                placeholder="E.g., 24172012..."
                validation={(value) => /^\d{11}$/.test(value)}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Branch/Course</label>
                <select
                  name="branch"
                  value={collegeData.branch}
                  onChange={handleCollegeDetailsChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all bg-white"
                >
                  <option value="">Select Branch</option>
                  <option value="CSE">Computer Science</option>
                  <option value="ECE">Electronics & Communication</option>
                  <option value="ME">Mechanical</option>
                  <option value="CE">Civil</option>
                  <option value="EE">Electrical</option>
                  <option value="CHEMISTRY">Chemical</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Year *</label>
                <select
                  name="currentYear"
                  value={collegeData.currentYear}
                  onChange={handleCollegeDetailsChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all bg-white"
                >
                  <option value="">Select Your Current Year</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>

              {collegeData.currentYear && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900 font-medium">
                    Expected Graduation Year: <span className="font-bold text-lg text-blue-600">{collegeData.graduationYear}</span>
                  </p>
                </div>
              )}

              <div className="flex gap-4">
                <PrimaryButton
                  onClick={() => setCurrentStep(2)}
                  variant="outline"
                  className="flex-1"
                >
                  Back
                </PrimaryButton>
                <PrimaryButton
                  onClick={handleCollegeDetailsNext}
                  loading={loading}
                  className="flex-1"
                >
                  {loading ? 'Verifying...' : 'Next'}
                </PrimaryButton>
              </div>
            </div>
          )}

          {/* Step 4: Password */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-fadeIn">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Set Your Password</h2>

              <FormInput
                label="Password"
                name="password"
                type="password"
                value={passwords.password}
                onChange={handlePasswordChange}
                placeholder="Create a strong password"
                hideSuccessIcon={true}
              />

              <FormInput
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                value={passwords.confirmPassword}
                onChange={handlePasswordChange}
                placeholder="Confirm your password"
                hideSuccessIcon={true}
              />

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-900 mb-2 font-semibold">Password requirements:</p>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• At least 8 characters long</li>
                  <li>• Contains uppercase and lowercase letters</li>
                  <li>• Contains numbers and special characters (@$!%*?&)</li>
                </ul>
              </div>

              <div className="flex gap-4">
                <PrimaryButton
                  onClick={() => setCurrentStep(3)}
                  variant="outline"
                  className="flex-1"
                >
                  Back
                </PrimaryButton>
                <PrimaryButton
                  onClick={handleRegisterComplete}
                  loading={loading}
                  className="flex-1"
                >
                  Create Account
                </PrimaryButton>
              </div>

              <p className="text-xs text-gray-600 text-center">
                By registering, you agree to our Terms & Conditions
              </p>
            </div>
          )}
        </div>

        {/* Sign In Link */}
        <p className="text-center text-gray-600 mt-8">
          Already have an account?{' '}
          <button
            onClick={() => navigate('/login')}
            className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
          >
            Sign In
          </button>
        </p>
      </div>

      {/* Toast Notifications */}
      <div className="fixed top-6 right-6 space-y-3 z-50">
        {toasts.map((toast) => (
          <Toast key={toast.id} type={toast.type} message={toast.message} />
        ))}
      </div>
    </div>
  );
};

export default Register;
