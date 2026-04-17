import Save from '../models/Save.js';
import Post from '../models/Post.js';
import Event from '../models/Event.js';

// ============================================================
// SAVE/UNSAVE CONTENT
// ============================================================
export const saveContent = async (req, res) => {
  try {
    const { contentType, contentId } = req.body;
    const userId = req.user._id;

    // Validate contentType
    if (!['post', 'event'].includes(contentType)) {
      return res.status(400).json({ success: false, message: 'Invalid content type' });
    }

    // Verify content exists
    const Model = contentType === 'post' ? Post : Event;
    const content = await Model.findById(contentId);
    if (!content) {
      return res.status(404).json({ success: false, message: `${contentType} not found` });
    }

    // Check if already saved
    const existingSave = await Save.findOne({
      user: userId,
      contentType,
      content: contentId,
    });

    if (existingSave) {
      return res.status(400).json({ success: false, message: 'Already saved' });
    }

    // Create save record
    const save = new Save({
      user: userId,
      contentType,
      content: contentId,
    });

    await save.save();

    res.status(201).json({
      success: true,
      message: `${contentType} saved successfully`,
    });
  } catch (error) {
    console.error('Save content error:', error);
    res.status(500).json({ success: false, message: 'Failed to save content' });
  }
};

// ============================================================
// UNSAVE CONTENT
// ============================================================
export const unsaveContent = async (req, res) => {
  try {
    const { contentType, contentId } = req.body;
    const userId = req.user._id;

    // Validate contentType
    if (!['post', 'event'].includes(contentType)) {
      return res.status(400).json({ success: false, message: 'Invalid content type' });
    }

    const result = await Save.findOneAndDelete({
      user: userId,
      contentType,
      content: contentId,
    });

    if (!result) {
      return res.status(404).json({ success: false, message: 'Save not found' });
    }

    res.json({
      success: true,
      message: `${contentType} removed from saves`,
    });
  } catch (error) {
    console.error('Unsave content error:', error);
    res.status(500).json({ success: false, message: 'Failed to unsave content' });
  }
};

// ============================================================
// GET SAVED ITEMS WITH FILTERS
// ============================================================
export const getSavedItems = async (req, res) => {
  try {
    const userId = req.user._id;
    const { type = 'all', page = 1, limit = 12 } = req.query;
    
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(30, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const filter = { user: userId };
    if (type !== 'all') {
      filter.contentType = type; // 'post' or 'event'
    }

    // Get total count
    const total = await Save.countDocuments(filter);

    // Get saves
    const saves = await Save.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Populate content based on contentType (refPath requires manual population)
    const itemsWithContent = await Promise.all(
      saves.map(async (save) => {
        const Model = save.contentType === 'post' ? Post : Event;
        const content = await Model.findById(save.content)
          .select('title description image bannerImage eventDate eventTime category status totalSeats registeredCount isLiked createdBy college')
          .populate({
            path: 'createdBy',
            select: 'fullName avatar profilePicture email college',
            populate: {
              path: 'college',
              select: 'name abbreviation',
            },
          })
          .lean();
        
        return {
          saveId: save._id,
          type: save.contentType,
          content: content,
          savedAt: save.createdAt,
        };
      })
    );

    res.json({
      success: true,
      data: itemsWithContent,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get saved items error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch saved items' });
  }
};

// ============================================================
// GET ALL SAVED IDS (NO LIMIT FOR INITIALIZATION)
// ============================================================
export const getAllSavedIds = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all saved items without pagination limit (just IDs)
    const saves = await Save.find({ user: userId })
      .select('contentType content')
      .lean();

    // Build set of "contentType-contentId" keys
    const savedIds = saves.map(save => `${save.contentType}-${save.content}`);
    const total = saves.length;

    res.json({
      success: true,
      data: savedIds,
      total,
    });
  } catch (error) {
    console.error('Get all saved ids error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch saved ids' });
  }
};

// ============================================================
// CHECK IF CONTENT IS SAVED
// ============================================================
export const checkIfSaved = async (req, res) => {
  try {
    const userId = req.user._id;
    const { contentType, contentId } = req.query;

    if (!['post', 'event'].includes(contentType)) {
      return res.status(400).json({ success: false, message: 'Invalid content type' });
    }

    const save = await Save.findOne({
      user: userId,
      contentType,
      content: contentId,
    });

    res.json({
      success: true,
      isSaved: !!save,
    });
  } catch (error) {
    console.error('Check if saved error:', error);
    res.status(500).json({ success: false, message: 'Failed to check save status' });
  }
};
