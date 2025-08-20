import express from 'express';
import User from '../models/User.js';
import Course from '../models/Course.js';
import BlogPost from '../models/BlogPost.js';
import Tool from '../models/Tool.js';
import Playlist from '../models/Playlist.js';
import { authenticateAdmin } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Configure multer for various uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadDir = 'uploads/';
    if (file.fieldname === 'featuredImage' || file.fieldname === 'image') {
      uploadDir += 'blog-thumbnails';
    } else if (file.fieldname === 'thumbnail') {
      uploadDir += 'course-thumbnails';
    } else {
      uploadDir += 'general';
    }
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const prefix = (file.fieldname === 'featuredImage' || file.fieldname === 'image') ? 'blog-' : 
                   file.fieldname === 'thumbnail' ? 'course-' : 'file-';
    cb(null, prefix + uniqueSuffix + path.extname(file.originalname));
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

// Apply admin auth middleware to all admin routes
router.use(authenticateAdmin);

// === USER MANAGEMENT ===
// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create user
router.post('/users', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    
    if (!password) {
      return res.status(400).json({ error: 'Password is required for new users' });
    }

    const user = new User({
      username,
      email,
      password,
      role: role || 'user',
      isDefaultPassword: false
    });
    
    await user.save();
    
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.status(201).json(userResponse);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'Username or email already exists' });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

// Update user
router.put('/users/:id', async (req, res) => {
  try {
    const { username, email, role, isActive } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { username, email, role, isActive },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// === COURSE MANAGEMENT ===
// Get all courses
router.get('/courses', async (req, res) => {
  try {
    const courses = await Course.find()
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create course
router.post('/courses', upload.single('thumbnail'), async (req, res) => {
  try {
    let thumbnailUrl = 'https://images.pexels.com/photos/325229/pexels-photo-325229.jpeg'; // default
    if (req.file) {
      thumbnailUrl = `${process.env.BACKEND_URL || 'http://localhost:3001'}/uploads/course-thumbnails/${req.file.filename}`;
    }

    const course = new Course({
      ...req.body,
      thumbnail: thumbnailUrl,
      createdBy: req.user._id
    });
    
    await course.save();
    await course.populate('createdBy', 'username email');
    
    res.status(201).json(course);
  } catch (error) {
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
    res.status(400).json({ error: error.message });
  }
});

// Update course
router.put('/courses/:id', upload.single('thumbnail'), async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    if (req.file) {
      updateData.thumbnail = `${process.env.BACKEND_URL || 'http://localhost:3001'}/uploads/course-thumbnails/${req.file.filename}`;
    }

    const course = await Course.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'username email');
    
    if (!course) {
      if (req.file) {
        fs.unlink(req.file.path, () => {});
      }
      return res.status(404).json({ error: 'Course not found' });
    }
    
    res.json(course);
  } catch (error) {
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
    res.status(400).json({ error: error.message });
  }
});

// Delete course
router.delete('/courses/:id', async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// === BLOG MANAGEMENT ===
// Get all blog posts
router.get('/blog-posts', async (req, res) => {
  try {
    const posts = await BlogPost.find()
      .populate('author', 'username email')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create blog post
router.post('/blog-posts', upload.fields([
  { name: 'featuredImage', maxCount: 1 },
  { name: 'image', maxCount: 1 }
]), async (req, res) => {
  try {
    let featuredImage = 'https://images.pexels.com/photos/325229/pexels-photo-325229.jpeg'; // default
    let image = null;
    
    if (req.files && req.files.featuredImage) {
      featuredImage = `${process.env.BACKEND_URL || 'http://localhost:3001'}/uploads/blog-thumbnails/${req.files.featuredImage[0].filename}`;
    }
    
    if (req.files && req.files.image) {
      image = `${process.env.BACKEND_URL || 'http://localhost:3001'}/uploads/blog-thumbnails/${req.files.image[0].filename}`;
    }

    const post = new BlogPost({
      ...req.body,
      featuredImage,
      image,
      author: req.user._id
    });
    
    await post.save();
    await post.populate('author', 'username email');
    
    res.status(201).json(post);
  } catch (error) {
    if (req.files) {
      if (req.files.featuredImage) fs.unlink(req.files.featuredImage[0].path, () => {});
      if (req.files.image) fs.unlink(req.files.image[0].path, () => {});
    }
    res.status(400).json({ error: error.message });
  }
});

// Update blog post
router.put('/blog-posts/:id', upload.fields([
  { name: 'featuredImage', maxCount: 1 },
  { name: 'image', maxCount: 1 }
]), async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    if (req.files && req.files.featuredImage) {
      updateData.featuredImage = `${process.env.BACKEND_URL || 'http://localhost:3001'}/uploads/blog-thumbnails/${req.files.featuredImage[0].filename}`;
    }
    
    if (req.files && req.files.image) {
      updateData.image = `${process.env.BACKEND_URL || 'http://localhost:3001'}/uploads/blog-thumbnails/${req.files.image[0].filename}`;
    }

    const post = await BlogPost.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('author', 'username email');
    
    if (!post) {
      if (req.files) {
        if (req.files.featuredImage) fs.unlink(req.files.featuredImage[0].path, () => {});
        if (req.files.image) fs.unlink(req.files.image[0].path, () => {});
      }
      return res.status(404).json({ error: 'Blog post not found' });
    }
    
    res.json(post);
  } catch (error) {
    if (req.files) {
      if (req.files.featuredImage) fs.unlink(req.files.featuredImage[0].path, () => {});
      if (req.files.image) fs.unlink(req.files.image[0].path, () => {});
    }
    res.status(400).json({ error: error.message });
  }
});

// Delete blog post
router.delete('/blog-posts/:id', async (req, res) => {
  try {
    const post = await BlogPost.findByIdAndDelete(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Blog post not found' });
    }
    res.json({ message: 'Blog post deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// === TOOLS MANAGEMENT ===
// Get all tools
router.get('/tools', async (req, res) => {
  try {
    const tools = await Tool.find()
      .populate('author', 'username email')
      .sort({ createdAt: -1 });
    res.json(tools);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create tool
router.post('/tools', async (req, res) => {
  try {
    const tool = new Tool({
      ...req.body,
      author: req.user._id
    });
    
    await tool.save();
    await tool.populate('author', 'username email');
    
    res.status(201).json(tool);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update tool
router.put('/tools/:id', async (req, res) => {
  try {
    const tool = await Tool.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('author', 'username email');
    
    if (!tool) {
      return res.status(404).json({ error: 'Tool not found' });
    }
    
    res.json(tool);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete tool
router.delete('/tools/:id', async (req, res) => {
  try {
    const tool = await Tool.findByIdAndDelete(req.params.id);
    if (!tool) {
      return res.status(404).json({ error: 'Tool not found' });
    }
    res.json({ message: 'Tool deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// === PLAYLIST MANAGEMENT ===
// Get all playlists
router.get('/playlists', async (req, res) => {
  try {
    const playlists = await Playlist.find()
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 });
    res.json(playlists);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;