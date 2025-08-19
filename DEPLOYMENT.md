# Kloud-scaler LMS Deployment Guide

This guide covers deploying the Kloud-scaler LMS application using Docker Compose with Nginx reverse proxy.

## Prerequisites

- Docker and Docker Compose installed
- Domain name (for production)
- SSL certificates (for HTTPS)
- Google Drive API credentials (optional, for video streaming)

## Quick Start

1. **Clone and prepare the project:**
   ```bash
   git clone <your-repo>
   cd kloud-scaler-lms
   ```

2. **Configure environment:**
   ```bash
   cp .env.prod.example .env.prod
   # Edit .env.prod with your actual configuration
   ```

3. **Deploy:**
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

## Detailed Setup

### 1. Environment Configuration

Create `.env.prod` from the template and configure:

```bash
# Database
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=your_secure_password_here
MONGO_DB_NAME=kloud_scaler_lms

# JWT Secrets (generate strong secrets)
JWT_SECRET=your_jwt_secret_here_make_it_very_long_and_secure
JWT_ADMIN_SECRET=your_admin_jwt_secret_here_make_it_very_long_and_secure

# Server URLs
BACKEND_URL=https://api.your-domain.com
FRONTEND_URL=https://your-domain.com

# Google Drive (optional)
GOOGLE_DRIVE_FOLDER_ID=your_google_drive_folder_id
```

### 2. SSL Configuration (Production)

For HTTPS in production:

1. **Obtain SSL certificates** (Let's Encrypt recommended):
   ```bash
   # Using certbot
   sudo certbot certonly --standalone -d your-domain.com -d api.your-domain.com
   ```

2. **Copy certificates:**
   ```bash
   mkdir -p nginx/ssl
   sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
   sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem
   ```

3. **Update nginx configuration** to enable HTTPS block in `nginx/nginx.conf`

### 3. Google Drive Setup (Optional)

For video streaming functionality:

1. **Create Google Cloud Project** and enable Drive API
2. **Download credentials.json** and place in project root
3. **Generate token.json:**
   ```bash
   # Run OAuth setup locally first
   cd backend
   node oauth-init.js
   # Follow the prompts to generate token.json
   ```

### 4. Deployment

#### Using the deployment script:
```bash
./deploy.sh
```

#### Manual deployment:
```bash
# Build and start services
docker-compose -f docker-compose.prod.yml up -d --build

# Seed database (optional)
docker-compose -f docker-compose.prod.yml exec backend npm run seed
```

## Service Management

### Start/Stop Services
```bash
# Start
docker-compose -f docker-compose.prod.yml up -d

# Stop
docker-compose -f docker-compose.prod.yml down

# Restart
docker-compose -f docker-compose.prod.yml restart
```

### View Logs
```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend
```

### Check Status
```bash
docker-compose -f docker-compose.prod.yml ps
```

## Architecture

```
Internet → Nginx (Port 80/443) → Frontend (Port 80)
                                → Backend (Port 3001) → MongoDB (Port 27017)
```

### Services:

1. **Nginx**: Reverse proxy, SSL termination, static file serving
2. **Frontend**: React application (built and served via Nginx)
3. **Backend**: Node.js API server
4. **MongoDB**: Database with authentication

## File Upload Handling

The application supports file uploads for:
- Blog post featured images
- Course thumbnails  
- Playlist thumbnails

Files are stored in Docker volumes and served through Nginx with proper caching headers.

## Security Features

- Rate limiting on API endpoints
- File upload restrictions
- Security headers
- MongoDB authentication
- JWT token authentication
- Separate admin authentication

## Monitoring and Maintenance

### Health Checks
- Backend: `http://your-domain.com/api/health`
- Overall: `http://your-domain.com/health`

### Database Backup
```bash
# Create backup
docker-compose -f docker-compose.prod.yml exec mongodb mongodump --authenticationDatabase admin -u admin -p your_password --db kloud_scaler_lms --out /backup

# Restore backup
docker-compose -f docker-compose.prod.yml exec mongodb mongorestore --authenticationDatabase admin -u admin -p your_password --db kloud_scaler_lms /backup/kloud_scaler_lms
```

### Log Rotation
Configure log rotation for Docker containers:
```bash
# Add to /etc/docker/daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

## Scaling Considerations

### Horizontal Scaling
- Use Docker Swarm or Kubernetes for multi-node deployment
- Implement Redis for session storage
- Use external MongoDB cluster

### Performance Optimization
- Enable Nginx caching for static assets
- Implement CDN for file uploads
- Use MongoDB indexes for better query performance
- Consider implementing Redis for caching

## Troubleshooting

### Common Issues

1. **Services not starting:**
   ```bash
   # Check logs
   docker-compose -f docker-compose.prod.yml logs
   
   # Check disk space
   df -h
   ```

2. **Database connection issues:**
   ```bash
   # Check MongoDB logs
   docker-compose -f docker-compose.prod.yml logs mongodb
   
   # Verify credentials in .env.prod
   ```

3. **File upload issues:**
   ```bash
   # Check upload directory permissions
   docker-compose -f docker-compose.prod.yml exec backend ls -la uploads/
   
   # Check Nginx upload limits
   ```

4. **SSL certificate issues:**
   ```bash
   # Verify certificate files
   ls -la nginx/ssl/
   
   # Test SSL configuration
   nginx -t
   ```

### Performance Monitoring

Monitor key metrics:
- CPU and memory usage
- Database query performance
- Response times
- Error rates
- Disk usage

## Updates and Maintenance

### Application Updates
```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build
```

### Database Migrations
Database schema changes are handled automatically through the application's migration system.

### Security Updates
- Regularly update Docker base images
- Keep SSL certificates current
- Monitor security advisories for dependencies

## Support

For issues and questions:
1. Check the logs first
2. Review this documentation
3. Check GitHub issues
4. Contact support team

---

**Important Security Notes:**
- Change all default passwords before production use
- Use strong JWT secrets
- Implement proper backup procedures
- Monitor logs for suspicious activity
- Keep all components updated