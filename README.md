# Kloud-scaler LMS - Modern Tech Learning Platform

A comprehensive Learning Management System focused on cloud technologies, DevOps, and modern infrastructure tools.

## Features

- **Modern UI**: Clean, responsive design with tech-focused aesthetics
- **Video Streaming**: HLS video streaming from Google Drive
- **Course Management**: Organized learning paths for various technologies
- **Interactive Player**: Custom video player with quality controls and playlists
- **Responsive Design**: Works seamlessly across all devices

## Technologies Covered

- AWS (Amazon Web Services)
- Kubernetes & Container Orchestration
- Docker & Containerization
- Linux System Administration
- Ansible Automation
- Google Cloud Platform (GCP)

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- Google Drive API credentials
- OAuth2 setup for Google Drive access

### Installation

1. **Setup project:**
   ```bash
   npm run setup
   ```

2. **Environment Configuration:**
   ```bash
   # Copy environment files
   cp backend/.env.example backend/.env
   
   # Edit backend/.env with your configuration
   # Set MONGODB_URI, JWT secrets, and Google Drive settings
   ```

3. **Start MongoDB (if using local MongoDB):**
   ```bash
   # Install and start MongoDB locally, or use MongoDB Atlas
   # Update MONGODB_URI in backend/.env accordingly
   ```

4. **Seed the database:**
   ```bash
   npm run seed
   ```

5. **Google Drive Setup (Optional):**
   - Place your `credentials.json` file in the root directory
   - Run OAuth setup to generate `token.json`
   - Set your Google Drive folder ID in backend/.env as GOOGLE_DRIVE_FOLDER_ID

6. **Start the application:**
   ```bash
   # Start both frontend and backend together
   npm run start:dev
   
   # OR start them separately:
   # Terminal 1: Backend
   npm run backend
   
   # Terminal 2: Frontend  
   npm run dev
   ```

## Available Scripts

```bash
# Setup project (install all dependencies)
npm run setup

# Start both frontend and backend
npm run start:dev

# Start backend only
npm run backend

# Start frontend only
npm run dev

# Seed database with sample data
npm run seed

# Build for production
npm run build
```

## Login Credentials

### User Login (http://localhost:5173/login)
- **Email:** john@example.com
- **Password:** password123

### Admin Login (http://localhost:5173/admin/login)
- **Email:** admin@example.com  
- **Password:** password123

## Environment Variables

### Backend (.env)
```bash
PORT=3001
MONGODB_URI=mongodb://localhost:27017/kloud_scaler_lms
MONGODB_DB=kloud_scaler_lms

# JWT secrets
JWT_SECRET=supersecretkey123
JWT_ADMIN_SECRET=superadminsecretkey456

# Google Drive (optional)
GOOGLE_DRIVE_FOLDER_ID=your_folder_id
GOOGLE_CREDENTIALS_PATH=./credentials.json
GOOGLE_TOKEN_PATH=./token.json
GOOGLE_REDIRECT_URL=http://localhost:3001/oauth2callback

NODE_ENV=development
```

## Database Setup

The application uses MongoDB. You can use either:

1. **Local MongoDB:**
   ```bash
   # Install MongoDB locally
   # Set MONGODB_URI=mongodb://localhost:27017/kloud_scaler_lms
   ```

2. **MongoDB Atlas (Cloud):**
   ```bash
   # Create account at https://cloud.mongodb.com
   # Set MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/kloud_scaler_lms
   ```

### File Structure

```
├── backend/                 # Express.js backend
│   ├── server.js           # Main server file
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── middleware/         # Authentication middleware
│   ├── package.json        # Backend dependencies
│   ├── .env                # Environment variables
│   └── .env.example        # Environment template
├── src/                    # React frontend
│   ├── components/         # Reusable components
│   ├── pages/             # Page components
│   ├── contexts/          # React contexts
│   └── assets/            # Static assets
├── credentials.json        # Google API credentials (optional)
├── token.json             # OAuth token (optional)
└── package.json           # Main project file
```

### API Endpoints

#### Authentication
- `POST /api/auth/user/login` - User login
- `POST /api/auth/admin/login` - Admin login
- `GET /api/auth/user/me` - Get current user
- `GET /api/auth/admin/me` - Get current admin

#### Courses
- `GET /api/courses` - Get all courses
- `GET /api/courses/:id` - Get course details
- `POST /api/courses/:id/enroll` - Enroll in course

#### Blog
- `GET /api/blog` - Get blog posts
- `GET /api/blog/:slug` - Get single blog post

#### Admin
- `GET /api/admin/users` - Manage users
- `GET /api/admin/courses` - Manage courses  
- `GET /api/admin/blog-posts` - Manage blog posts

#### Video Streaming
- `GET /api/health` - Health check
- `GET /api/playlist` - Get video playlist
- `GET /api/drive/hls/:id` - HLS stream proxy
- `GET /api/drive/file/:id` - Video segment proxy

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details.