import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import BlogPost from '../models/BlogPost.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for blog thumbnail uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/blog-thumbnails';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'blog-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

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

// Admin routes for blog management with file upload
router.post('/admin/create', authenticateAdmin, upload.single('featuredImage'), async (req, res) => {
  try {
    const { title, excerpt, content, category, tags, status } = req.body;

    let featuredImage = 'https://images.pexels.com/photos/325229/pexels-photo-325229.jpeg'; // default
    if (req.file) {
      featuredImage = `${process.env.BACKEND_URL || 'http://localhost:3001'}/uploads/blog-thumbnails/${req.file.filename}`;
    }

    const post = new BlogPost({
      title,
      excerpt,
      content,
      category,
      tags: tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
      status: status || 'draft',
      featuredImage,
      author: req.user._id
    });

    await post.save();
    await post.populate('author', 'username');

    res.status(201).json(post);
  } catch (error) {
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
    res.status(400).json({ error: error.message });
  }
});

router.put('/admin/:id', authenticateAdmin, upload.single('featuredImage'), async (req, res) => {
  try {
    const { title, excerpt, content, category, tags, status } = req.body;
    const updateData = {
      title,
      excerpt,
      content,
      category,
      tags: tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
      status: status || 'draft'
    };

    if (req.file) {
      updateData.featuredImage = `${process.env.BACKEND_URL || 'http://localhost:3001'}/uploads/blog-thumbnails/${req.file.filename}`;
    }

    const post = await BlogPost.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('author', 'username');

    if (!post) {
      if (req.file) {
        fs.unlink(req.file.path, () => {});
      }
      return res.status(404).json({ error: 'Blog post not found' });
    }

    res.json(post);
  } catch (error) {
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
    res.status(400).json({ error: error.message });
  }
});

export default router;