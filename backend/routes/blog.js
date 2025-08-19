import express from 'express';
import BlogPost from '../models/BlogPost.js';

const router = express.Router();

// Get all published blog posts
router.get('/', async (req, res) => {
  try {
    const { category, tag, search, page = 1, limit = 10 } = req.query;
    const filter = { status: 'published' };
    
    if (category) filter.category = category;
    if (tag) filter.tags = { $in: [tag] };
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }
    
    const posts = await BlogPost.find(filter)
      .populate('author', 'username')
      .sort({ publishedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-content'); // Exclude full content for list view
    
    const total = await BlogPost.countDocuments(filter);
    
    res.json({
      posts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single blog post by slug
router.get('/:slug', async (req, res) => {
  try {
    const post = await BlogPost.findOne({ 
      slug: req.params.slug, 
      status: 'published' 
    }).populate('author', 'username');
    
    if (!post) {
      return res.status(404).json({ error: 'Blog post not found' });
    }
    
    // Increment views
    post.views += 1;
    await post.save();
    
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get blog categories
router.get('/meta/categories', async (req, res) => {
  try {
    const categories = await BlogPost.distinct('category', { status: 'published' });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get blog tags
router.get('/meta/tags', async (req, res) => {
  try {
    const tags = await BlogPost.distinct('tags', { status: 'published' });
    res.json(tags);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get related posts
router.get('/:slug/related', async (req, res) => {
  try {
    const currentPost = await BlogPost.findOne({ 
      slug: req.params.slug, 
      status: 'published' 
    });
    
    if (!currentPost) {
      return res.status(404).json({ error: 'Blog post not found' });
    }
    
    const relatedPosts = await BlogPost.find({
      _id: { $ne: currentPost._id },
      status: 'published',
      $or: [
        { category: currentPost.category },
        { tags: { $in: currentPost.tags } }
      ]
    })
    .populate('author', 'username')
    .sort({ publishedAt: -1 })
    .limit(3)
    .select('-content');
    
    res.json(relatedPosts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;