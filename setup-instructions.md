# Kloud-scaler LMS Setup Instructions

## Step-by-Step Setup Guide

### Step 1: Start MongoDB with Docker Compose

```bash
# Start MongoDB and Mongo Express
docker-compose up -d

# Check if containers are running
docker-compose ps
```

This will start:
- MongoDB on port 27017
- Mongo Express (web UI) on port 8081

### Step 2: Install Backend Dependencies

```bash
cd backend
npm install
```

### Step 3: Environment Configuration

The `.env` file has been created with the following configuration:
- MongoDB URI with authentication
- Separate JWT secrets for users and admins
- Google Drive configuration

### Step 4: Seed the Database

```bash
cd backend
npm run seed
```

This creates:
- Admin user: admin@example.com / password123
- Regular users: john@example.com, jane@example.com, bob@example.com / password123
- Sample courses and blog posts

### Step 5: Start the Backend Server

```bash
cd backend
npm run dev
```

### Step 6: Start the Frontend

```bash
# From root directory
npm run dev
```

## New Authentication Endpoints

### User Authentication
- **POST** `/api/auth/user/login` - User login
- **GET** `/api/auth/user/me` - Get current user info

### Admin Authentication
- **POST** `/api/auth/admin/login` - Admin login (separate endpoint)
- **GET** `/api/auth/admin/me` - Get current admin info

## Key Changes Made

### 1. Separate Login Endpoints
- Users and admins now have different login endpoints
- Different JWT secrets for enhanced security
- Admin tokens have shorter expiry (24h vs 7d)

### 2. Enhanced Middleware
- `authenticateUser()` - For regular user routes
- `authenticateAdmin()` - For admin routes with admin-specific JWT secret
- Backward compatibility maintained

### 3. MongoDB Setup
- Docker Compose configuration with MongoDB 7.0
- Mongo Express for database management
- Database initialization script with indexes and validation
- Proper authentication setup

### 4. Frontend Updates
- Login page now has toggle between User/Admin login
- Different styling for admin login
- Automatic endpoint detection in auth context
- Enhanced error handling

## Database Access

### Via Mongo Express (Web UI)
- URL: http://localhost:8081
- No authentication required (disabled for development)

### Via MongoDB Compass
- Connection string: `mongodb://admin:password123@localhost:27017/kloud_scaler_lms?authSource=admin`

### Via Command Line
```bash
# Connect to MongoDB container
docker exec -it kloud-scaler-mongo mongosh

# Authenticate
use admin
db.auth('admin', 'password123')

# Switch to application database
use kloud_scaler_lms

# List collections
show collections
```

## Security Features

1. **Separate JWT Secrets**: Users and admins use different JWT secrets
2. **Role-based Access**: Admin routes require admin-specific authentication
3. **Token Expiry**: Admin tokens expire faster for security
4. **Database Validation**: Schema validation at database level
5. **Indexes**: Optimized database queries with proper indexing

## Testing the Setup

1. **User Login**: Use john@example.com / password123
2. **Admin Login**: Use admin@example.com / password123
3. **Database**: Check Mongo Express at http://localhost:8081
4. **API Health**: Check http://localhost:3001/api/health

## Troubleshooting

### MongoDB Connection Issues
```bash
# Check container logs
docker-compose logs mongodb

# Restart containers
docker-compose restart
```

### Backend Issues
```bash
# Check if MongoDB is accessible
cd backend
node -e "const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI).then(() => console.log('Connected')).catch(console.error)"
```

### Frontend Issues
- Clear browser localStorage if authentication issues persist
- Check browser console for API errors