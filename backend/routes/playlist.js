import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { google } from 'googleapis';
import Playlist from '../models/Playlist.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/thumbnails';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'playlist-' + uniqueSuffix + path.extname(file.originalname));
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

// Google Drive helper functions
const TOKEN_PATH = path.resolve(process.env.GOOGLE_TOKEN_PATH || './token.json');
const CREDENTIALS_PATH = path.resolve(process.env.GOOGLE_CREDENTIALS_PATH || './credentials.json');

// Cache with TTL for Google Drive files
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const fileCache = new Map();

function cacheSet(key, file) {
  fileCache.set(key, { file, cachedAt: Date.now() });
}

function cacheGet(key) {
  const entry = fileCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > CACHE_TTL) {
    fileCache.delete(key);
    return null;
  }
  return entry.file;
}

// Cleanup expired cache entries
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of fileCache.entries()) {
    if (now - entry.cachedAt > CACHE_TTL) {
      fileCache.delete(key);
    }
  }
}, 60 * 60 * 1000); // Run every hour

function loadOAuthClient() {
  const creds = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, "utf8"));
  const { client_secret, client_id } = creds.installed;
  const REDIRECT_URL = process.env.GOOGLE_REDIRECT_URL || `http://localhost:${process.env.PORT || 3001}/oauth2callback`;
  return new google.auth.OAuth2(client_id, client_secret, REDIRECT_URL);
}

async function authorize() {
  const oAuth2Client = loadOAuthClient();
  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf8"));
    oAuth2Client.setCredentials(token);
    
    // Check token expiry
    if (token.expiry_date && token.expiry_date < Date.now()) {
      throw new Error("Token expired");
    }
    
    return oAuth2Client;
  }
  throw new Error("No token.json found");
}

async function findMasterFiles(drive, parentId, prefix = "") {
  const items = [];
  const { data: { files = [] } } = await drive.files.list({
    q: `'${parentId}' in parents and trashed=false`,
    fields: "files(id,name,mimeType,modifiedTime,parents)",
    pageSize: 1000,
  });

  for (const file of files) {
    if (file.mimeType === "application/vnd.google-apps.folder") {
      const nested = await findMasterFiles(drive, file.id, `${prefix}${file.name}/`);
      items.push(...nested);
    } else if (file.name === "master.m3u8") {
      // Cache the master file
      cacheSet(file.id, file);
      items.push({
        id: file.id,
        parentId: file.parents[0],
        title: prefix.replace(/\/$/, '') || file.name, // Remove trailing slash
        src: `/api/drive/hls/${file.id}`,
        duration: '', // Will be populated if needed
        order: items.length + 1,
        fileId: file.id
      });
    }
  }
  return items;
}

// Get all playlists (public)
router.get('/', async (req, res) => {
  try {
    const playlists = await Playlist.find({ isActive: true })
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 })
      .select('-videos'); // Don't include videos in list view

    res.json(playlists);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single playlist with videos (public)
router.get('/:id', async (req, res) => {
  try {
    const playlist = await Playlist.findOne({ 
      _id: req.params.id, 
      isActive: true 
    }).populate('createdBy', 'username');

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    // Always try to refresh videos from Google Drive to ensure they're up to date
    let shouldUpdateVideos = false;
    
    if (!playlist.videos || playlist.videos.length === 0) {
      shouldUpdateVideos = true;
    } else {
      // Check if videos were last updated more than 1 hour ago
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      if (playlist.updatedAt < oneHourAgo) {
        shouldUpdateVideos = true;
      }
    }
    
    if (shouldUpdateVideos) {
      try {
        const auth = await authorize();
        const drive = google.drive({ version: "v3", auth });
        const videos = await findMasterFiles(drive, playlist.googleDriveFolderId);
        
        // Update playlist with videos
        playlist.videos = videos.map((video, index) => ({
          title: video.title,
          src: video.src,
          duration: video.duration || '',
          order: index + 1,
          fileId: video.fileId
        }));
        
        await playlist.save();
        console.log(`✅ Updated playlist "${playlist.title}" with ${videos.length} videos`);
      } catch (driveError) {
        console.error('Error fetching from Google Drive:', driveError.message);
        // Return playlist with existing videos even if Drive fetch fails
      }
    }

    res.json(playlist);
  } catch (error) {
    console.error('Error loading playlist:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin routes
router.use('/admin', authenticateAdmin);

// Get all playlists for admin
router.get('/admin/all', async (req, res) => {
  try {
    const playlists = await Playlist.find()
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 });

    res.json(playlists);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create playlist
router.post('/admin/create', upload.single('thumbnail'), async (req, res) => {
  try {
    const { title, description, googleDriveFolderId } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Thumbnail image is required' });
    }

    const thumbnailUrl = `${process.env.BACKEND_URL || 'http://localhost:3001'}/uploads/thumbnails/${req.file.filename}`;

    const playlist = new Playlist({
      title,
      description,
      googleDriveFolderId,
      thumbnail: thumbnailUrl,
      createdBy: req.user._id
    });

    // Immediately try to populate videos from Google Drive
    try {
      const auth = await authorize();
      const drive = google.drive({ version: "v3", auth });
      const videos = await findMasterFiles(drive, googleDriveFolderId);
      
      playlist.videos = videos.map((video, index) => ({
        title: video.title,
        src: video.src,
        duration: video.duration || '',
        order: index + 1,
        fileId: video.fileId
      }));
      
      console.log(`✅ Populated new playlist "${title}" with ${videos.length} videos`);
    } catch (driveError) {
      console.error('Error populating videos for new playlist:', driveError.message);
      // Continue with empty videos array
    }

    await playlist.save();
    await playlist.populate('createdBy', 'username');

    res.status(201).json(playlist);
  } catch (error) {
    // Clean up uploaded file if playlist creation fails
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
    res.status(400).json({ error: error.message });
  }
});

// Update playlist
router.put('/admin/:id', upload.single('thumbnail'), async (req, res) => {
  try {
    const { title, description, googleDriveFolderId } = req.body;
    const updateData = { title, description, googleDriveFolderId };

    if (req.file) {
      const thumbnailUrl = `${process.env.BACKEND_URL || 'http://localhost:3001'}/uploads/thumbnails/${req.file.filename}`;
      updateData.thumbnail = thumbnailUrl;
    }

    const playlist = await Playlist.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'username');

    if (!playlist) {
      if (req.file) {
        fs.unlink(req.file.path, () => {});
      }
      return res.status(404).json({ error: 'Playlist not found' });
    }

    // If Google Drive folder ID changed, refresh videos
    if (googleDriveFolderId && googleDriveFolderId !== playlist.googleDriveFolderId) {
      try {
        const auth = await authorize();
        const drive = google.drive({ version: "v3", auth });
        const videos = await findMasterFiles(drive, googleDriveFolderId);
        
        playlist.videos = videos.map((video, index) => ({
          title: video.title,
          src: video.src,
          duration: video.duration || '',
          order: index + 1,
          fileId: video.fileId
        }));
        
        await playlist.save();
        console.log(`✅ Updated playlist "${playlist.title}" videos after folder change`);
      } catch (driveError) {
        console.error('Error updating videos after folder change:', driveError.message);
      }
    }

    res.json(playlist);
  } catch (error) {
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
    res.status(400).json({ error: error.message });
  }
});

// Refresh playlist videos from Google Drive
router.post('/admin/:id/refresh', async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    const auth = await authorize();
    const drive = google.drive({ version: "v3", auth });
    const videos = await findMasterFiles(drive, playlist.googleDriveFolderId);
    
    playlist.videos = videos.map((video, index) => ({
      title: video.title,
      src: video.src,
      duration: video.duration || '',
      order: index + 1,
      fileId: video.fileId
    }));
    
    await playlist.save();
    await playlist.populate('createdBy', 'username');

    console.log(`✅ Manually refreshed playlist "${playlist.title}" with ${videos.length} videos`);
    res.json(playlist);
  } catch (error) {
    console.error('Error refreshing playlist:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete playlist
router.delete('/admin/:id', async (req, res) => {
  try {
    const playlist = await Playlist.findByIdAndDelete(req.params.id);
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    // Clean up thumbnail file
    if (playlist.thumbnail && playlist.thumbnail.includes('/uploads/thumbnails/')) {
      const filename = path.basename(playlist.thumbnail);
      const filePath = path.join('uploads/thumbnails', filename);
      fs.unlink(filePath, () => {});
    }

    res.json({ message: 'Playlist deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;