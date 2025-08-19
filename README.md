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

1. **Clone and install dependencies:**
   ```bash
   npm install
   cd backend && npm install
   ```

2. **Google Drive Setup:**
   - Place your `credentials.json` file in the root directory
   - Run OAuth setup to generate `token.json`
   - Set your Google Drive folder ID in backend/.env

3. **Environment Configuration:**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the application:**
   ```bash
   # Terminal 1: Start backend
   cd backend && npm run dev

   # Terminal 2: Start frontend
   npm run dev
   ```

### File Structure

```
├── backend/                 # Express.js backend
│   ├── server.js           # Main server file
│   ├── package.json        # Backend dependencies
│   └── .env.example        # Environment template
├── src/                    # React frontend
│   ├── components/         # Reusable components
│   ├── pages/             # Page components
│   └── assets/            # Static assets
├── credentials.json        # Google API credentials (not in repo)
├── token.json             # OAuth token (generated)
└── package.json           # Main project file
```

### API Endpoints

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