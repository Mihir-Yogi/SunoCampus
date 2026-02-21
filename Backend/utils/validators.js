import College from '../models/College.js';

// Validate college email
export const validateCollegeEmail = async (email) => {
  try {
    const domain = email.split('@')[1];
    if (!domain) return false;

    const college = await College.findOne({
      emailDomain: domain,
      isActive: true,
    });

    return college ? true : false;
  } catch (error) {
    console.error('College validation error:', error);
    return false;
  }
};

// Get college from email domain
export const getCollegeFromEmail = async (email) => {
  try {
    const domain = email.split('@')[1];
    if (!domain) return null;

    const college = await College.findOne({
      emailDomain: domain,
      isActive: true,
    }).select('_id name abbreviation emailDomain');

    return college;
  } catch (error) {
    console.error('Error fetching college:', error);
    return null;
  }
};

// Validate password strength
export const validatePasswordStrength = (password) => {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return regex.test(password);
};

// Validate email format
export const validateEmailFormat = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export default validateCollegeEmail;
