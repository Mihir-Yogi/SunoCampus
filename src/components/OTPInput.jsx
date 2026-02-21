import { useRef, useEffect } from 'react';

export const OTPInput = ({ value, onChange, length = 6 }) => {
  const inputRefs = useRef([]);

  const handleChange = (e, index) => {
    const val = e.target.value;
    
    // Only allow numbers
    if (!/^\d*$/.test(val)) return;

    // Take only the last character if multiple are pasted
    const digit = val.slice(-1);
    
    // Update the OTP value
    const newOtp = value.split('');
    newOtp[index] = digit;
    const otpString = newOtp.join('').slice(0, length);
    onChange(otpString);

    // Move to next field if digit is entered
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const newOtp = value.split('');
      newOtp[index] = '';
      onChange(newOtp.join('').slice(0, index));
      
      // Move to previous field
      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const digits = pastedData.replace(/\D/g, '').slice(0, length);
    onChange(digits);
    
    // Focus on the last filled field or the field after the last digit
    const nextIndex = Math.min(digits.length, length - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength="1"
          value={value[index] || ''}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          className="w-12 h-12 text-center text-2xl font-bold rounded-lg bg-slate-700/50 border-2 border-slate-600 text-white hover:border-blue-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
          placeholder="0"
        />
      ))}
    </div>
  );
};

export default OTPInput;
