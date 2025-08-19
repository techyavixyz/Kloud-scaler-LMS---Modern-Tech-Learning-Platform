import express from 'express';
import User from '../models/User.js';
import Course from '../models/Course.js';
import BlogPost from '../models/BlogPost.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = express.Router();

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
    
    const user = new User({
      username,
      email,
      password,
      role: role || 'user'
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
router.post('/courses', async (req, res) => {
  try {
    const course = new Course({
      ...req.body,
      createdBy: req.user._id
    });
    
    await course.save();
    await course.populate('createdBy', 'username email');
    
    res.status(201).json(course);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update course
router.put('/courses/:id', async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'username email');
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    res.json(course);
  } catch (error) {
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
router.post('/blog-posts', async (req, res) => {
  try {
    const post = new BlogPost({
      ...req.body,
      author: req.user._id
    });
    
    await post.save();
    await post.populate('author', 'username email');
    
    res.status(201).json(post);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update blog post
router.put('/blog-posts/:id', async (req, res) => {
  try {
    const post = await BlogPost.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('author', 'username email');
    
    if (!post) {
      return res.status(404).json({ error: 'Blog post not found' });
    }
    
    res.json(post);
  } catch (error) {
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

export default router;