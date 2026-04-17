/**
 * CustomFieldRenderer.jsx
 * Renders custom event registration form fields with proper type handling
 * Supports: text, number, email, phone, url, textarea, date, dropdown, radio, checkbox, multi-select, file
 */

export const CustomFieldRenderer = ({ field, value = '', onChange, required = false }) => {
  if (!field || !field.type) {
    console.warn('CustomFieldRenderer: Invalid field or missing type', field);
    return null;
  }

  const commonInputClass = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all';
  const commonLabelClass = 'block text-sm font-medium text-gray-700 mb-1';

  const renderField = () => {
    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || ''}
            required={required}
            className={commonInputClass}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(e.target.value || '')}
            placeholder={field.placeholder || ''}
            required={required}
            className={commonInputClass}
          />
        );

      case 'email':
        return (
          <input
            type="email"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || ''}
            required={required}
            className={commonInputClass}
          />
        );

      case 'phone':
        return (
          <input
            type="tel"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || ''}
            required={required}
            className={commonInputClass}
          />
        );

      case 'url':
        return (
          <input
            type="url"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || ''}
            required={required}
            className={commonInputClass}
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            required={required}
            className={commonInputClass}
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || ''}
            required={required}
            rows={3}
            className={`${commonInputClass} resize-none`}
          />
        );

      case 'dropdown':
        return (
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            required={required}
            className={commonInputClass}
          >
            <option value="">{field.placeholder || 'Select an option...'}</option>
            {Array.isArray(field.options) && field.options.map((opt, idx) => (
              <option key={idx} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {Array.isArray(field.options) && field.options.map((opt, idx) => (
              <label key={idx} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={field.fieldId}
                  value={opt}
                  checked={value === opt}
                  onChange={() => onChange(opt)}
                  required={required}
                  className="text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-sm text-gray-700">{opt}</span>
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => onChange(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <span className="text-sm text-gray-700">{field.placeholder || field.label}</span>
          </label>
        );

      case 'multi-select':
        const selectedArray = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2">
            {Array.isArray(field.options) && field.options.map((opt, idx) => (
              <label key={idx} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedArray.includes(opt)}
                  onChange={(e) => {
                    const updated = e.target.checked
                      ? [...selectedArray, opt]
                      : selectedArray.filter(item => item !== opt);
                    onChange(updated);
                  }}
                  className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-sm text-gray-700">{opt}</span>
              </label>
            ))}
          </div>
        );

      case 'file':
        return (
          <input
            type="file"
            onChange={(e) => onChange(e.target.files?.[0] || '')}
            required={required}
            className={commonInputClass}
          />
        );

      default:
        console.warn(`CustomFieldRenderer: Unknown field type "${field.type}", defaulting to text`);
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || ''}
            required={required}
            className={commonInputClass}
          />
        );
    }
  };

  return (
    <div>
      <label className={commonLabelClass}>
        {field.label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {renderField()}
    </div>
  );
};

export default CustomFieldRenderer;
