# Custom Event Fields Implementation - Complete Reference

## Overview
This document provides a complete reference for the custom event field system that allows event creators to define custom registration form fields with specific data types, and ensures proper rendering and validation during student registration.

## Problem Statement
- Event creators could add custom fields with specific types during event creation
- Custom fields were not properly rendered on the registration form
- All custom fields displayed as plain text inputs, ignoring their configured types
- Missing server-side validation for field type constraints

## Solution Architecture

### 1. Custom Field Renderer Component
**File:** `src/components/CustomFieldRenderer.jsx`
- **Purpose:** Centralized component for rendering form fields with type-specific inputs
- **Supported Types:** 12 different field types
- **Key Features:**
  - Automatic type detection and appropriate input rendering
  - Consistent styling and error handling
  - Accessible labels and required field indicators
  - Console warnings for invalid/missing types

**Usage:**
```jsx
<CustomFieldRenderer
  field={customField}      // {fieldId, label, type, required, placeholder, options}
  value={currentValue}     // Current field value
  onChange={handleChange}  // Change handler function
  required={isRequired}    // Is field required
/>
```

### 2. Event Creation Flow
**File:** `src/components/contributor/EventFormModal.jsx`

#### Creating Custom Fields:
1. Contributor clicks "+ Add Custom Field"
2. System creates field object with default properties
3. Dropdown allows selection from 12 field types
4. Type-specific UI appears:
   - For options-based types (dropdown, radio, multi-select): Option input fields appear
5. Frontend validation ensures:
   - Label is provided
   - Type is valid
   - Options-based types have minimum 2 options
6. Event saved with all custom fields

**Frontend Validation:**
```javascript
FIELD_TYPES = [
  'text', 'number', 'email', 'phone', 'url', 
  'textarea', 'date', 'dropdown', 'multi-select', 
  'radio', 'checkbox', 'file'
]

// Validation checks
- field.label exists and not empty
- field.type in validFieldTypes
- Options-based types have >= 2 options
```

### 3. Event Registration Flow  
**File:** `src/pages/Browse.jsx`

#### Student Registration:
1. Student clicks "Register" on event card
2. System fetches event details with custom fields
3. Registration modal opens with:
   - Pre-filled default fields (name, email, college)
   - Any selected default student fields (phone, branch, etc.)
   - Custom fields rendered with proper types
4. Student fills form
5. Frontend HTML5 validation runs (required fields, type constraints)
6. On submit:
   - Remove helper fields (_collegeName)
   - Send formResponses to backend
7. Backend validates all field types
8. Registration created on success

**Field Rendering:**
```jsx
{registeringEvent.customFormFields?.map(field => (
  <CustomFieldRenderer
    key={field.fieldId}
    field={field}
    value={formResponses[field.fieldId] || ''}
    onChange={(val) => setFormResponses(prev => ({
      ...prev,
      [field.fieldId]: val
    }))}
    required={field.required}
  />
))}
```

### 4. Backend Validation
**File:** `Backend/controllers/browseController.js`

The `registerForEvent` endpoint validates:

#### Data Type Validation:
```javascript
case 'number': isNaN(Number(value)) → error
case 'email': /^[^\s@]+@[^\s@]+\.[^\s@]+$/ → error
case 'phone': digits < 9 → error
case 'url': new URL(value) → error
case 'date': isNaN(Date.parse(value)) → error
case 'dropdown'|'radio': !options.includes(value) → error
case 'multi-select': 
  - !Array.isArray(value) → error
  - value.some(v => !options.includes(v)) → error
```

#### Required Field Validation:
```javascript
if (field.required && (value === '' || value === null || 
    value === undefined || (Array.isArray(value) && value.length === 0)))
  → error: "${field.label}" is required"
```

### 5. Event Creation Validation
**File:** `Backend/controllers/contributorController.js`

Both `createEvent` and `updateEvent` validate custom fields:
- Field type must be in valid list
- Field must have fieldId, label, type
- Options-based types must have minimum 2 options

## Field Types Reference

### Single-Value Fields

#### Text Input Fields
```javascript
type: 'text' | 'email' | 'phone' | 'url' | 'number'
Renders: <input type="[type]">
Example: Name, Email, Phone Number
```

#### Textarea
```javascript
type: 'textarea'
Renders: <textarea rows="3">
Example: Additional comments, feedback
```

#### Date
```javascript
type: 'date'
Renders: <input type="date">
Example: Preferred date, date of birth
```

### Selection-Based Fields

#### Dropdown (Single Select)
```javascript
type: 'dropdown'
options: ['Option 1', 'Option 2', 'Option 3']
Renders: <select><option>...</option></select>
Example: Experience level, category selection
```

#### Radio Buttons (Single Select)
```javascript
type: 'radio'
options: ['Option 1', 'Option 2', 'Option 3']
Renders: Multiple <input type="radio"> buttons
Example: Yes/No questions, multiple choice
```

#### Checkbox (Single Boolean)
```javascript
type: 'checkbox'
Renders: <input type="checkbox">
Example: Agree to terms checkbox
```

#### Multi-Select (Multiple Select)
```javascript
type: 'multi-select'
options: ['Option 1', 'Option 2', 'Option 3']
Renders: Multiple <input type="checkbox"> elements
Value: Array of selected options
Example: Skills, interests, preferences
```

#### File Upload
```javascript
type: 'file'
Renders: <input type="file">
Example: Resume, portfolio, document upload
```

## Data Flow Diagram

```
EVENT CREATION
    │
    ├─> Contributor adds custom fields
    │   └─> Field type selected from dropdown
    │       └─> Options added for multi-select types
    │
    ├─> Frontend validation
    │   ├─> Label required
    │   ├─> Type valid
    │   └─> Options valid (if needed)
    │
    ├─> Send to backend with all field data
    │
    ├─> Backend validation
    │   ├─> Type in valid list
    │   ├─> Required properties exist
    │   └─> Options structure valid
    │
    └─> Save event with customFormFields

EVENT REGISTRATION
    │
    ├─> Student clicks Register
    │
    ├─> Fetch event details (includes customFormFields)
    │
    ├─> Render registration form
    │   └─> CustomFieldRenderer maps type → HTML input
    │
    ├─> Student fills form
    │   └─> Each input validates based on type
    │
    ├─> Student submits
    │
    ├─> Frontend HTML5 validation
    │   ├─> Fields marked required checked
    │   ├─> Email format validated
    │   ├─> Number field type checked
    │   └─> Date format validated
    │
    ├─> Send formResponses to backend
    │
    ├─> Backend validation
    │   ├─> Check required fields
    │   ├─> Validate field types
    │   ├─> Check option validity
    │   └─> Verify array types
    │
    └─> Create registration with formResponses
```

## API Contract

### GET /browse/feed
**Returns:**
```javascript
{
  success: true,
  data: {
    feed: [{
      ...,
      customFormFields: [
        {
          fieldId: "field_123",
          label: "Age",
          type: "number",
          required: true,
          placeholder: "Enter your age",
          options: []
        },
        [...]
      ],
      defaultFormFields: ["phone", "branch"],
      ...,
    }]
  }
}
```

### POST /browse/events/:id/register
**Request:**
```javascript
{
  formResponses: {
    "default_phone": "+1234567890",
    "default_branch": "Computer Science",
    "field_123": "25",  // Number field
    "field_124": "John@example.com",  // Email field
    "field_125": "Intermediate",  // Dropdown field
    "field_126": ["Python", "React"],  // Multi-select field
  }
}
```

**Validation:**
- Number: value must be parsed as valid number
- Email: value must match email regex
- Phone: must have >= 9 digits
- Dropdown/Radio: value must be in options array
- Multi-select: value must be array with items in options array

**Response (Success):**
```javascript
{
  success: true,
  data: {
    registrationId: "...",
    isRegistered: true,
    registeredCount: 25,
    availableSeats: 5,
    status: "open"
  },
  message: "Successfully registered for the event!"
}
```

**Response (Validation Error):**
```javascript
{
  error: "\"Age\" must be a valid number"
}
```

## File Structure

```
SunoCampus/
├── src/
│   ├── components/
│   │   ├── CustomFieldRenderer.jsx  [NEW]
│   │   └── contributor/
│   │       └── EventFormModal.jsx   [MODIFIED]
│   └── pages/
│       └── Browse.jsx                [MODIFIED]
└── Backend/
    └── controllers/
        ├── browseController.js       [MODIFIED]
        └── contributorController.js  [MODIFIED]
```

## Key Changes Summary

| File | Change | Impact |
|---|---|---|
| CustomFieldRenderer.jsx | NEW | Centralized field rendering |
| Browse.jsx | Import + Use CustomFieldRenderer | Consistent field display |
| EventFormModal.jsx | Validate field type | Prevent invalid field types |
| browseController.js | Enhanced field validation | Type-safe registration |
| contributorController.js | Validate field type in create/update | Enforce field structure |

## Testing Checklist

- [ ] Number field only accepts numeric values
- [ ] Email field validates email format
- [ ] Dropdown shows as select element with options
- [ ] Radio buttons appear for radio field type
- [ ] Multi-select shows checkboxes
- [ ] Date field shows date picker
- [ ] Required fields prevent empty submission
- [ ] Backend rejects invalid field types
- [ ] Multi-select sends array to backend
- [ ] All 12 field types render correctly
- [ ] Field validation works on both frontend and backend

## Future Enhancements

1. **Advanced Validation Rules**
   - Min/Max values for numbers
   - Pattern validation for text fields
   - File type restrictions (pdf, doc only, etc.)

2. **Conditional Fields**
   - Show field only if another field has specific value
   - Dependencies between custom fields

3. **Field Dependencies**
   - Mark one field based on another field's value
   - Dynamic field visibility

4. **Rich Text Editor**
   - Support for rich text in custom fields
   - Formatted text storage and display

5. **Field Reusability**
   - Save field templates
   - Reuse across multiple events
   - Field library management

## Developer Quick Start

### To Use CustomFieldRenderer:
```jsx
import CustomFieldRenderer from '../components/CustomFieldRenderer';

// In your component
<CustomFieldRenderer
  field={fieldObject}
  value={fieldValue}
  onChange={handleValueChange}
  required={true}
/>
```

### To Add New Field Type:
1. Add to FIELD_TYPES in EventFormModal.jsx
2. Add to validFieldTypes in controllers
3. Add case in CustomFieldRenderer
4. Add validation in browseController.js
5. Add test cases

### To Debug Field Issues:
1. Check browser console for CustomFieldRenderer warnings
2. Check Network tab for formResponses payload
3. Check server logs for validation errors
4. Verify field.type matches FIELD_TYPES list
5. Ensure options array is properly formatted for multi-select types
