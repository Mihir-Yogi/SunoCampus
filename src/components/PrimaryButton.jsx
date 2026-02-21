export const PrimaryButton = ({
  children,
  isLoading = false,
  disabled = false,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'lg',
  className = '',
  ...props
}) => {
  const baseStyles = 'font-semibold transition-all duration-300 focus:outline-none relative overflow-hidden active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2';

  const variants = {
    primary: 'bg-gradient-to-r from-blue-700 to-blue-800 text-white hover:from-blue-800 hover:to-blue-900 hover:shadow-lg hover:-translate-y-1 active:shadow-md',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 hover:shadow-md hover:-translate-y-1',
    outline: 'border-2 border-blue-700 text-blue-700 hover:bg-blue-50 hover:shadow-md',
    danger: 'bg-red-600 text-white hover:bg-red-700 hover:shadow-lg'
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm rounded-md',
    md: 'px-6 py-2.5 text-base rounded-lg',
    lg: 'px-8 py-3 text-base rounded-lg w-full',
    xl: 'px-8 py-3.5 text-lg rounded-lg w-full'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {/* Ripple effect background */}
      <span className="absolute inset-0 bg-white opacity-0 rounded-full pointer-events-none"></span>

      {/* Content */}
      {isLoading ? (
        <>
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span>{children.toString().split(' ')[0]}...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default PrimaryButton;
