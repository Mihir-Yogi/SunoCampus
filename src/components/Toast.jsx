import { useEffect, useState } from 'react';

export const Toast = ({ type = 'info', message, duration = 4000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  const styles = {
    error: 'bg-red-50 border-red-200 text-red-800 before:bg-red-500',
    success: 'bg-green-50 border-green-200 text-green-800 before:bg-green-500',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800 before:bg-yellow-500',
    info: 'bg-blue-50 border-blue-200 text-blue-800 before:bg-blue-500',
  };

  const icons = {
    error: '❌',
    success: '✅',
    warning: '⚠️',
    info: 'ℹ️',
  };

  return (
    <div
      className={`fixed top-4 right-4 max-w-md border-l-4 p-4 rounded-lg shadow-lg animate-slideDown z-50 ${styles[type]}`}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icons[type]}</span>
        <p className="font-medium">{message}</p>
        <button
          onClick={() => setIsVisible(false)}
          className="ml-auto text-lg opacity-60 hover:opacity-100"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default Toast;
