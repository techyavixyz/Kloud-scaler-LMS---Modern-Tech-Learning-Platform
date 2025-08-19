// MongoDB initialization script
// This script runs when the MongoDB container starts for the first time

db = db.getSiblingDB('kloud_scaler_lms');

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['username', 'email', 'password', 'role'],
      properties: {
        username: {
          bsonType: 'string',
          description: 'Username must be a string and is required'
        },
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
          description: 'Email must be a valid email address'
        },
        password: {
          bsonType: 'string',
          minLength: 6,
          description: 'Password must be at least 6 characters'
        },
        role: {
          bsonType: 'string',
          enum: ['admin', 'user'],
          description: 'Role must be either admin or user'
        }
      }
    }
  }
});

db.createCollection('courses', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['title', 'description', 'category', 'createdBy'],
      properties: {
        title: {
          bsonType: 'string',
          description: 'Title must be a string and is required'
        },
        category: {
          bsonType: 'string',
          enum: ['AWS', 'Kubernetes', 'Docker', 'Linux', 'Ansible', 'GCP'],
          description: 'Category must be one of the allowed values'
        },
        difficulty: {
          bsonType: 'string',
          enum: ['Beginner', 'Intermediate', 'Advanced'],
          description: 'Difficulty must be one of the allowed values'
        }
      }
    }
  }
});

db.createCollection('blogposts', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['title', 'content', 'author'],
      properties: {
        title: {
          bsonType: 'string',
          description: 'Title must be a string and is required'
        },
        status: {
          bsonType: 'string',
          enum: ['draft', 'published', 'archived'],
          description: 'Status must be one of the allowed values'
        }
      }
    }
  }
});

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ role: 1 });

db.courses.createIndex({ category: 1 });
db.courses.createIndex({ difficulty: 1 });
db.courses.createIndex({ isActive: 1 });
db.courses.createIndex({ createdAt: -1 });

db.blogposts.createIndex({ slug: 1 }, { unique: true });
db.blogposts.createIndex({ status: 1 });
db.blogposts.createIndex({ category: 1 });
db.blogposts.createIndex({ tags: 1 });
db.blogposts.createIndex({ publishedAt: -1 });

print('Database initialization completed successfully!');