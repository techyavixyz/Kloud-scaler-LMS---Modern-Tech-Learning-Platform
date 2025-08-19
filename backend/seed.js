// Load env first (works great with "type": "module")
import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/User.js';
import Course from './models/Course.js';
import BlogPost from './models/BlogPost.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kloud_scaler_lms';

const DB_NAME = process.env.MONGODB_DB || 'kloud_scaler';

async function seedData() {
  try {
    if (!MONGODB_URI) {
      throw new Error(
        'Missing Mongo connection string. Set MONGODB_URI in .env'
      );
    }

    await mongoose.connect(MONGODB_URI);
    console.log(`✅ Connected to MongoDB (db: ${DB_NAME})`);

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Course.deleteMany({}),
      BlogPost.deleteMany({}),
    ]);

    // Create admin user
    const adminUser = await new User({
      username: 'admin',
      email: 'admin@example.com',
      password: 'password123', // assumes your User model hashes on save
      role: 'admin',
      isDefaultPassword: true,
    }).save();

    // Create regular user
    await new User({
      username: 'john_doe',
      email: 'john@example.com',
      password: 'password123',
      role: 'user',
    }).save();

    // Additional test users
    await User.insertMany([
      { username: 'jane_smith', email: 'jane@example.com', password: 'password123', role: 'user' },
      { username: 'bob_wilson', email: 'bob@example.com', password: 'password123', role: 'user' },
    ]);

    // Courses
    const courses = [
      {
        title: 'AWS Fundamentals',
        description: 'Learn the basics of Amazon Web Services including EC2, S3, and IAM.',
        category: 'AWS',
        difficulty: 'Beginner',
        duration: '4 hours',
        playlist: [
          { title: 'Introduction to AWS', src: '/api/drive/hls/sample1', order: 1 },
          { title: 'EC2 Basics', src: '/api/drive/hls/sample2', order: 2 },
          { title: 'S3 Storage', src: '/api/drive/hls/sample3', order: 3 }
        ],
        createdBy: adminUser._id
      },
      {
        title: 'Kubernetes Mastery',
        description: 'Master container orchestration with Kubernetes from basics to advanced concepts.',
        category: 'Kubernetes',
        difficulty: 'Intermediate',
        duration: '8 hours',
        playlist: [
          { title: 'Kubernetes Overview', src: '/api/drive/hls/sample4', order: 1 },
          { title: 'Pods and Services', src: '/api/drive/hls/sample5', order: 2 },
          { title: 'Deployments', src: '/api/drive/hls/sample6', order: 3 }
        ],
        createdBy: adminUser._id
      },
      {
        title: 'Docker Deep Dive',
        description: 'Comprehensive Docker training covering containers, images, and orchestration.',
        category: 'Docker',
        difficulty: 'Beginner',
        duration: '6 hours',
        playlist: [
          { title: 'Docker Basics', src: '/api/drive/hls/sample7', order: 1 },
          { title: 'Building Images', src: '/api/drive/hls/sample8', order: 2 },
          { title: 'Docker Compose', src: '/api/drive/hls/sample9', order: 3 }
        ],
        createdBy: adminUser._id
      }
    ];
    await Course.insertMany(courses);

    // Blog posts
    const blogPosts = [
      {
        title: 'Getting Started with AWS Lambda',
        excerpt: 'Learn how to build serverless applications using AWS Lambda functions.',
        content: `# Getting Started with AWS Lambda
... (unchanged long content) ...`,
        category: 'AWS',
        tags: ['aws', 'lambda', 'serverless', 'tutorial'],
        status: 'published',
        author: adminUser._id,
        publishedAt: new Date()
      },
      {
        title: 'Kubernetes Best Practices for Production',
        excerpt: 'Essential practices for running Kubernetes clusters in production environments.',
        content: `# Kubernetes Best Practices for Production
... (unchanged long content) ...`,
        category: 'Kubernetes',
        tags: ['kubernetes', 'production', 'best-practices', 'devops'],
        status: 'published',
        author: adminUser._id,
        publishedAt: new Date(Date.now() - 86400000)
      },
      {
        title: 'Docker Multi-Stage Builds Explained',
        excerpt: 'Learn how to optimize your Docker images using multi-stage builds.',
        content: `# Docker Multi-Stage Builds Explained
... (unchanged long content) ...`,
        category: 'Docker',
        tags: ['docker', 'containers', 'optimization', 'tutorial'],
        status: 'published',
        author: adminUser._id,
        publishedAt: new Date(Date.now() - 172800000)
      }
    ];
    await BlogPost.insertMany(blogPosts);

    console.log('✅ Seed data created successfully!');
    console.log('Admin user: admin@example.com / password123');
    console.log('Regular user: john@example.com / password123');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

seedData();
