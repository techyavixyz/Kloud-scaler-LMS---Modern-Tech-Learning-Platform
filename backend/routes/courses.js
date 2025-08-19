import express from 'express';
import Course from '../models/Course.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get all active courses (public)
router.get('/', async (req, res) => {
  try {
    const { category, difficulty } = req.query;
    const filter = { isActive: true };
    
    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;
    
    const courses = await Course.find(filter)
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 });
    
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single course with playlist (requires auth)
router.get('/:id', authenticate, async (req, res) => {
  try {
    const course = await Course.findOne({ 
      _id: req.params.id, 
      isActive: true 
    }).populate('createdBy', 'username');
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Check if user is enrolled or is admin
    const isEnrolled = req.user.enrolledCourses.includes(course._id) || req.user.role === 'admin';
    
    if (!isEnrolled) {
      return res.status(403).json({ error: 'Access denied. Please enroll in this course.' });
    }
    
    res.json(course);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Enroll in course
router.post('/:id/enroll', authenticate, async (req, res) => {
  try {
    const course = await Course.findOne({ 
      _id: req.params.id, 
      isActive: true 
    });
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Add course to user's enrolled courses if not already enrolled
    if (!req.user.enrolledCourses.includes(course._id)) {
      req.user.enrolledCourses.push(course._id);
      await req.user.save();
    }
    
    res.json({ message: 'Successfully enrolled in course' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;