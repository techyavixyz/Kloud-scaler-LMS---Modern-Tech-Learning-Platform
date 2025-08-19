import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';
import Course from './models/Course.js';
import BlogPost from './models/BlogPost.js';

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Course.deleteMany({});
    await BlogPost.deleteMany({});

    // Create admin user
    const adminUser = new User({
      username: 'admin',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin'
    });
    await adminUser.save();

    // Create regular user
    const regularUser = new User({
      username: 'john_doe',
      email: 'john@example.com',
      password: 'password123',
      role: 'user'
    });
    await regularUser.save();

    // Create sample courses
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

    for (const courseData of courses) {
      const course = new Course(courseData);
      await course.save();
    }

    // Create sample blog posts
    const blogPosts = [
      {
        title: 'Getting Started with AWS Lambda',
        excerpt: 'Learn how to build serverless applications using AWS Lambda functions.',
        content: `# Getting Started with AWS Lambda

AWS Lambda is a serverless computing service that lets you run code without provisioning or managing servers. In this guide, we'll explore the basics of Lambda and build your first function.

## What is AWS Lambda?

AWS Lambda is a compute service that runs your code in response to events and automatically manages the underlying compute resources for you. You can use AWS Lambda to extend other AWS services with custom logic, or create your own back-end services.

## Key Benefits

- **No server management**: AWS Lambda automatically runs your code without requiring you to provision or manage servers.
- **Continuous scaling**: AWS Lambda automatically scales your application by running code in response to each trigger.
- **Pay for what you use**: With AWS Lambda, you are charged for every 100ms your code executes and the number of times your code is triggered.

## Creating Your First Lambda Function

Let's create a simple "Hello World" Lambda function:

\`\`\`python
import json

def lambda_handler(event, context):
    return {
        'statusCode': 200,
        'body': json.dumps('Hello from Lambda!')
    }
\`\`\`

This function returns a simple JSON response with a "Hello from Lambda!" message.

## Best Practices

1. **Keep functions small**: Lambda functions should do one thing well
2. **Use environment variables**: Store configuration outside your code
3. **Handle errors gracefully**: Always include proper error handling
4. **Monitor performance**: Use CloudWatch to monitor your functions

## Conclusion

AWS Lambda is a powerful tool for building serverless applications. Start small, experiment, and gradually build more complex serverless architectures.`,
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

Running Kubernetes in production requires careful planning and adherence to best practices. This guide covers the essential practices you need to know.

## Resource Management

### Resource Requests and Limits

Always set resource requests and limits for your containers:

\`\`\`yaml
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: app
    image: nginx
    resources:
      requests:
        memory: "64Mi"
        cpu: "250m"
      limits:
        memory: "128Mi"
        cpu: "500m"
\`\`\`

### Quality of Service Classes

Kubernetes assigns QoS classes based on resource specifications:
- **Guaranteed**: Requests = Limits for all containers
- **Burstable**: At least one container has requests < limits
- **BestEffort**: No requests or limits specified

## Security Best Practices

1. **Use RBAC**: Implement Role-Based Access Control
2. **Network Policies**: Control traffic between pods
3. **Pod Security Standards**: Enforce security policies
4. **Regular Updates**: Keep Kubernetes and container images updated

## Monitoring and Logging

Set up comprehensive monitoring with:
- **Prometheus**: For metrics collection
- **Grafana**: For visualization
- **ELK Stack**: For centralized logging

## High Availability

- Run multiple master nodes
- Use pod disruption budgets
- Implement health checks
- Plan for disaster recovery

Following these practices will help ensure your Kubernetes clusters are reliable, secure, and performant in production.`,
        category: 'Kubernetes',
        tags: ['kubernetes', 'production', 'best-practices', 'devops'],
        status: 'published',
        author: adminUser._id,
        publishedAt: new Date(Date.now() - 86400000) // 1 day ago
      },
      {
        title: 'Docker Multi-Stage Builds Explained',
        excerpt: 'Learn how to optimize your Docker images using multi-stage builds.',
        content: `# Docker Multi-Stage Builds Explained

Multi-stage builds are a powerful feature in Docker that allows you to create smaller, more secure images by using multiple FROM statements in your Dockerfile.

## Why Use Multi-Stage Builds?

- **Smaller images**: Remove build dependencies from final image
- **Better security**: Fewer components mean smaller attack surface
- **Cleaner separation**: Separate build and runtime environments

## Basic Example

Here's a simple multi-stage build for a Go application:

\`\`\`dockerfile
# Build stage
FROM golang:1.19 AS builder
WORKDIR /app
COPY . .
RUN go build -o main .

# Runtime stage
FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/main .
CMD ["./main"]
\`\`\`

## Advanced Patterns

### Named Stages

You can name your stages for better readability:

\`\`\`dockerfile
FROM node:16 AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:16-alpine AS runtime
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
CMD ["npm", "start"]
\`\`\`

### Build Arguments

Use build arguments to make your builds more flexible:

\`\`\`dockerfile
ARG NODE_VERSION=16
FROM node:\${NODE_VERSION} AS base
# ... rest of your Dockerfile
\`\`\`

## Best Practices

1. **Order layers by change frequency**: Put less frequently changing layers first
2. **Use .dockerignore**: Exclude unnecessary files
3. **Minimize layers**: Combine RUN commands where possible
4. **Use specific tags**: Avoid 'latest' in production

Multi-stage builds are essential for creating production-ready Docker images. They help you maintain clean, secure, and efficient containers.`,
        category: 'Docker',
        tags: ['docker', 'containers', 'optimization', 'tutorial'],
        status: 'published',
        author: adminUser._id,
        publishedAt: new Date(Date.now() - 172800000) // 2 days ago
      }
    ];

    for (const postData of blogPosts) {
      const post = new BlogPost(postData);
      await post.save();
    }

    console.log('✅ Seed data created successfully!');
    console.log('Admin user: admin@example.com / password123');
    console.log('Regular user: john@example.com / password123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
};

seedData();