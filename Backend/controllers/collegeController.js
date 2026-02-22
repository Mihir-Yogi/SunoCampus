import College from '../models/College.js';

// Get all colleges
export const getAllColleges = async (req, res) => {
  try {
    const colleges = await College.find({}).select('_id name email domain');
    res.json({
      success: true,
      colleges,
    });
  } catch (error) {
    console.error('Error fetching colleges:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch colleges',
    });
  }
};
