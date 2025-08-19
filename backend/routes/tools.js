import express from 'express';
import Tool from '../models/Tool.js';

const router = express.Router();

// Get all published tools
router.get('/', async (req, res) => {
  try {
    const { category, tag, search, page = 1, limit = 12 } = req.query;
    const filter = { status: 'published' };
    
    if (category) filter.category = category;
    if (tag) filter.tags = { $in: [tag] };
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }
    
    const tools = await Tool.find(filter)
      .populate('author', 'username')
      .sort({ publishedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-content'); // Exclude full content for list view
    
    const total = await Tool.countDocuments(filter);
    
    res.json({
      tools,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single tool by slug
router.get('/:slug', async (req, res) => {
  try {
    const tool = await Tool.findOne({ 
      slug: req.params.slug, 
      status: 'published' 
    }).populate('author', 'username');
    
    if (!tool) {
      return res.status(404).json({ error: 'Tool not found' });
    }
    
    // Increment views
    tool.views += 1;
    await tool.save();
    
    res.json(tool);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get tool categories
router.get('/meta/categories', async (req, res) => {
  try {
    const categories = await Tool.distinct('category', { status: 'published' });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get tool tags
router.get('/meta/tags', async (req, res) => {
  try {
    const tags = await Tool.distinct('tags', { status: 'published' });
    res.json(tags);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get related tools
router.get('/:slug/related', async (req, res) => {
  try {
    const currentTool = await Tool.findOne({ 
      slug: req.params.slug, 
      status: 'published' 
    });
    
    if (!currentTool) {
      return res.status(404).json({ error: 'Tool not found' });
    }
    
    const relatedTools = await Tool.find({
      _id: { $ne: currentTool._id },
      status: 'published',
      $or: [
        { category: currentTool.category },
        { tags: { $in: currentTool.tags } }
      ]
    })
    .populate('author', 'username')
    .sort({ publishedAt: -1 })
    .limit(3)
    .select('-content');
    
    res.json(relatedTools);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;