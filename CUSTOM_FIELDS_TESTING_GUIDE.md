# Custom Event Fields - Testing Guide

## Quick Test Steps

### Test 1: Create Event with Multiple Field Types

1. **Login as Contributor**
   - Go to Contributor Dashboard
   - Click "Create Event"

2. **Create Custom Fields**
   - Fill in basic event details (Title, Date, Time, etc.)
   - Scroll to "Custom Registration Form" section
   - Click "+ Add Custom Field"
   - Add fields:
     - **Field 1**: Label: "Age", Type: **Number**
     - **Field 2**: Label: "Email Address", Type: **Email**
     - **Field 3**: Label: "Experience Level", Type: **Dropdown**
       - Options: Beginner, Intermediate, Advanced
     - **Field 4**: Label: "Skills", Type: **Multi-Select**
       - Options: Python, JavaScript, React, Node.js
     - **Field 5**: Label: "Preferred Date", Type: **Date**
   - Click "Create Event"

### Test 2: Register for Event and Verify Field Types

1. **Login as Student**
   - Go to Browse page
   - Find the event you just created
   - Click "Register"

2. **Verify Field Rendering**
   ✅ **Age field** should show:
   - `<input type="number">` element
   - Spinner controls (up/down buttons)
   - Rejects non-numeric input

   ✅ **Email field** should show:
   - `<input type="email">` element
   - Email validation icon in browser
   - Browser validates email format on submit

   ✅ **Experience Level field** should show:
   - `<select>` dropdown element
   - Three options: Beginner, Intermediate, Advanced
   - NOT a text input

   ✅ **Skills field** should show:
   - Multiple checkboxes (one for each skill)
   - Can select multiple options
   - NOT a text input or dropdown

   ✅ **Preferred Date field** should show:
   - `<input type="date">` element
   - Calendar picker when clicked
   - NOT a text input

### Test 3: Validation - Try Invalid Inputs

1. **Number Field Validation**
   - Try entering "abc" in Age field
   - Browser/Frontend should prevent submission
   - Try entering "25" - should work ✓

2. **Email Field Validation**
   - Try entering "notanemail"
   - Browser should show validation error
   - Try entering "test@example.com" - should work ✓

3. **Date Field Validation**
   - Try entering "12/31/2024"
   - Field should not accept text format
   - Use date picker instead ✓

4. **Dropdown Field Validation**
   - Dropdown should only allow predefined options
   - Should not allow typing arbitrary text

5. **Multi-Select Field Validation**
   - Should allow selecting multiple options
   - Deselecting should remove the option
   - Array should be properly sent to backend

### Test 4: Required Fields

1. **Leave Required Fields Empty**
   - Leave Age field empty (required by default)
   - Try to submit
   - Should show error: "Age is required"

2. **Fill Required Field**
   - Enter value in Age field
   - Submit should proceed
   - Should see success message

### Test 5: Backend Validation

1. **Number Field**
   - Intercept network request
   - Try to manually send text value
   - Backend should return: "Age must be a valid number"

2. **Email Field**
   - Try to manually send "invalid.email"
   - Backend should return: "Invalid email format"

3. **Phone Field**
   - Try to send "123" (less than 9 digits)
   - Backend should return: "Invalid phone format"

4. **URL Field**
   - Try to send "not a url"
   - Backend should return: "Invalid URL format"

5. **Dropdown/Radio**
   - Try to send value not in options list
   - Backend should return: "Invalid selection"

6. **Multi-Select**
   - Try to send non-array value
   - Backend should return: "Must be array of selections"

## Expected Results Summary

| Field Type | Frontend Input | Browser Display | Backend Validation |
|---|---|---|---|
| text | "hello" | `<input type="text">` | String accepted |
| number | "42" | `<input type="number">` | Must be valid number |
| email | "test@ex.com" | `<input type="email">` | Must match email regex |
| phone | "9876543210" | `<input type="tel">` | Min 9 digits |
| url | "https://..." | `<input type="url">` | Must be valid URL |
| date | "2024-12-31" | `<input type="date">` | Must be valid date |
| textarea | multiline | `<textarea>` | String accepted |
| dropdown | "Option 1" | `<select>` | Must be in options |
| radio | "Option 1" | Radio buttons | Must be in options |
| checkbox | true/false | `<input type="checkbox">` | Boolean accepted |
| multi-select | ["A", "B"] | Checkboxes | Array of options |
| file | File object | `<input type="file">` | File handling |

## Troubleshooting

### Issue: Field shows as text input instead of proper type

**Check:**
1. Event was saved with correct field type in database
2. CustomFieldRenderer is being imported correctly
3. Field object has `type` property defined
4. Browser console for any warnings

**Solution:**
- Verify EventFormModal is validating field type before save
- Check backend created event with customFormFields including type
- Clear browser cache and reload

### Issue: Dropdown/Radio shows as text input

**Check:**
1. Field type is set to 'dropdown' or 'radio'
2. At least 2 options are defined for dropdown/radio
3. Options array is not empty

**Solution:**
- Edit event and verify options are saved
- Ensure options array is properly formatted as strings

### Issue: Number field accepts text

**Check:**
1. Frontend rendering using `<input type="number">`
2. Browser supports HTML5 number input
3. Check browser console for errors

**Solution:**
- Required validation is automatic in modern browsers
- For older browsers, backend validation catches invalid numbers

### Issue: Registration form shows error but no field errors

**Check:**
1. Look at `registerError` state - should show which field failed
2. Check backend response message
3. Verify CustomFieldRenderer is marking required fields

**Solution:**
- Update CustomFieldRenderer to highlight invalid fields
- Show field-specific error messages in validation

## Files to Check During Testing

1. **Frontend:**
   - `src/components/CustomFieldRenderer.jsx` - Field rendering
   - `src/pages/Browse.jsx` - Registration form
   - Network tab - Verify formResponses payload

2. **Backend:**
   - `Backend/controllers/browseController.js` - registerForEvent validation
   - `Backend/controllers/contributorController.js` - Event creation validation
   - Console logs - Verify validation messages

## Performance Testing

 testing with large number of custom fields:
1. Create event with 20+ custom fields
2. Verify registration form loads quickly
3. Verify no memory leaks when opening/closing modals
4. Test on mobile devices

## Browser Compatibility

Test on:
- ✓ Chrome/Edge (latest)
- ✓ Firefox (latest)
- ✓ Safari (latest)
- ✓ Mobile browsers (iOS Safari, Chrome Mobile)

HTML5 input types have excellent support, but older IE versions may not support some features. Our backend validation ensures data integrity regardless.
