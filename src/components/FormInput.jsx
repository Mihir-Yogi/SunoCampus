import { useState } from 'react';

export const FormInput = ({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  hint,
  validation,
  required = false,
  disabled = false,
  hideSuccessIcon = false,
  isDarkMode = false,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isInvalid = error && value;
  
  // Only show valid checkmark if validation passed AND no error
  const validationResult = validation ? validation(value) : true;
  const isValid = !hideSuccessIcon ? (!error && value && validationResult) : false;

  const handleInputChange = (e) => {
    onChange(e);
  };

  return (
    <div className="mb-5">
      {label && (
        <label className={`block text-sm font-medium mb-2 ${
          isDarkMode ? 'text-slate-300' : 'text-gray-700'
        }`}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <div
          className={`relative flex items-center transition-all duration-300 ${
            isFocused
              ? isDarkMode ? 'ring-2 ring-blue-500 ring-offset-0' : 'ring-2 ring-blue-600 ring-offset-0'
              : isDarkMode ? 'ring-1 ring-slate-600' : 'ring-1 ring-gray-300'
          } ${
            isInvalid && 'ring-red-500'
          } ${
            isValid && 'ring-green-500'
          } rounded-lg overflow-hidden ${
            isDarkMode ? 'bg-slate-700/50' : 'bg-white'
          }`}
        >
          {/* Input */}
          <input
            type={type === 'password' && showPassword ? 'text' : type}
            placeholder={placeholder}
            value={value}
            onChange={handleInputChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={disabled}
            className={`w-full px-4 py-3 bg-transparent outline-none transition-all duration-300 ${
              isDarkMode ? 'text-white placeholder-slate-500' : 'text-gray-900 placeholder-gray-500'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            {...props}
          />

          {/* Right Icons (password toggle or validation) */}
          <div className="pr-4 flex items-center gap-2">
            {type === 'password' && value && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-gray-600 transition-colors font-medium text-sm"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            )}

            {/* Validation icons */}
            {isValid && (
              <span className="text-green-500 text-lg animate-pulse">✓</span>
            )}
            {isInvalid && (
              <span className="text-red-500 text-lg animate-bounce">✕</span>
            )}
          </div>
        </div>

        {/* Error message */}
        {isInvalid && (
          <p className="mt-2 text-sm text-red-500 flex items-center gap-1 animate-slideDown">
            {error}
          </p>
        )}

        {/* Hint text */}
        {hint && !error && (
          <p className={`mt-2 text-sm ${
            isDarkMode ? 'text-slate-400' : 'text-gray-500'
          }`}>ℹ️ {hint}</p>
        )}
      </div>
    </div>
  );
};

export default FormInput;
