// import express from "express";
// import path from "path";
// import { fileURLToPath } from "url";
// import fs from "fs";
// import { google } from "googleapis";
// import cors from "cors";
// import dotenv from "dotenv";

// dotenv.config();

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const app = express();
// const PORT = process.env.PORT || 3001;

// // Middleware
// app.use(cors());
// app.use(express.json());

// // === Google Drive Config ===
// const TOKEN_PATH = path.join(__dirname, "token.json");
// const CREDENTIALS_PATH = path.join(__dirname, "credentials.json");
// const FOLDER_VIDEOS = process.env.GOOGLE_DRIVE_FOLDER_ID || "1cWL0RI9uvBzNrwAUusWVf81sIRXyFYcE";

// // === Cache with TTL ===
// const CACHE_TTL = 30 * 60 * 1000; // 30 min
// const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour
// const fileCache = new Map(); // key -> { file, cachedAt }

// function cacheSet(key, file) {
//   fileCache.set(key, { file, cachedAt: Date.now() });
// }

// function cacheGet(key) {
//   const entry = fileCache.get(key);
//   if (!entry) return null;
//   if (Date.now() - entry.cachedAt > CACHE_TTL) {
//     console.log(`🗑️ Cache expired for ${key}`);
//     fileCache.delete(key);
//     return null;
//   }
//   return entry.file;
// }

// // background cleanup
// setInterval(() => {
//   const now = Date.now();
//   let removed = 0;
//   for (const [key, entry] of fileCache.entries()) {
//     if (now - entry.cachedAt > CACHE_TTL) {
//       fileCache.delete(key);
//       removed++;
//     }
//   }
//   if (removed > 0) console.log(`🧹 Cache cleanup removed ${removed} entries`);
// }, CLEANUP_INTERVAL);

// // === Auth ===
// function loadOAuthClient() {
//   const creds = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, "utf8"));
//   const { client_secret, client_id, redirect_uris } = creds.installed;
//   return new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
// }

// async function authorize() {
//   const oAuth2Client = loadOAuthClient();
//   if (fs.existsSync(TOKEN_PATH)) {
//     const token = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf8"));
//     oAuth2Client.setCredentials(token);
//     return oAuth2Client;
//   }
//   throw new Error("⚠️ No token.json found. Run oauth setup first.");
// }

// // === Recursive walker to find all master.m3u8 ===
// async function findMasterFiles(drive, parentId, prefix = "") {
//   const items = [];
//   const { data: { files = [] } } = await drive.files.list({
//     q: `'${parentId}' in parents and trashed=false`,
//     fields: "files(id, name, mimeType, modifiedTime, parents)",
//     pageSize: 1000,
//   });

//   for (const file of files) {
//     if (file.mimeType === "application/vnd.google-apps.folder") {
//       const nested = await findMasterFiles(drive, file.id, `${prefix}${file.name}/`);
//       items.push(...nested);
//     } else if (file.name === "master.m3u8") {
//       cacheSet(file.id, file);
//       items.push({
//         id: file.id,
//         parentId: file.parents[0],
//         title: prefix.split("/")[0] || file.name, // folder name only
//         src: `/api/drive/hls/${file.id}`, // proxy endpoint
//         mtime: new Date(file.modifiedTime).getTime(),
//       });
//     }
//   }
//   return items;
// }

// // === API Routes ===

// // Health check
// app.get("/api/health", (req, res) => {
//   res.json({ status: "ok", message: "Kloud-scaler LMS Backend is running" });
// });

// // Playlist API
// app.get("/api/playlist", async (req, res) => {
//   console.log("📥 GET /api/playlist");
//   console.time("⏱ /api/playlist");
//   try {
//     const auth = await authorize();
//     const drive = google.drive({ version: "v3", auth });
//     const items = await findMasterFiles(drive, FOLDER_VIDEOS);
//     items.sort((a, b) => b.mtime - a.mtime);
//     res.json(items.map(({ title, src }) => ({ title, src })));
//   } catch (err) {
//     console.error("❌ Error fetching playlist:", err.message);
//     res.status(500).json({ error: err.message });
//   }
//   console.timeEnd("⏱ /api/playlist");
// });

// // Proxy for m3u8 (master + variants)
// app.get("/api/drive/hls/:id", async (req, res) => {
//   console.log(`📥 GET /api/drive/hls/${req.params.id}`);
//   console.time(`⏱ m3u8 ${req.params.id}`);
//   try {
//     const fileId = req.params.id;
//     const auth = await authorize();
//     const drive = google.drive({ version: "v3", auth });

//     let file = cacheGet(fileId);
//     if (!file) {
//       file = await drive.files.get({ fileId, fields: "id,name,parents,modifiedTime" })
//         .then(r => r.data);
//       cacheSet(fileId, file);
//     }

//     const stream = await drive.files.get(
//       { fileId: file.id, alt: "media" },
//       { responseType: "stream" }
//     );

//     let content = "";
//     stream.data.on("data", chunk => content += chunk.toString());
//     stream.data.on("end", async () => {
//       // get segments
//       const segs = await drive.files.list({
//         q: `'${file.parents[0]}' in parents and trashed=false and name contains '.ts'`,
//         fields: "files(id,name)",
//         pageSize: 1000,
//       });
//       segs.data.files.forEach(f => cacheSet(f.name, f));
//       const tsMap = Object.fromEntries(segs.data.files.map(f => [f.name, f.id]));

//       // get variants
//       const variants = await drive.files.list({
//         q: `'${file.parents[0]}' in parents and trashed=false and name contains '.m3u8'`,
//         fields: "files(id,name)",
//         pageSize: 100,
//       });
//       variants.data.files.forEach(f => cacheSet(f.name, f));

//       // rewrite ts
//       content = content.replace(/([^\s]+\.ts)/g, m => `/api/drive/file/${tsMap[m] || m}`);

//       // rewrite m3u8 variants
//       content = content.replace(/([^\s]+\.m3u8)/g, m => {
//         const f = cacheGet(m);
//         return f ? `/api/drive/hls/${f.id}` : m;
//       });

//       res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
//       res.send(content);
//       console.timeEnd(`⏱ m3u8 ${req.params.id}`);
//     });
//   } catch (err) {
//     console.error("❌ Error proxying m3u8:", err.message);
//     res.status(500).send("Error fetching m3u8");
//     console.timeEnd(`⏱ m3u8 ${req.params.id}`);
//   }
// });

// // Proxy for TS segments
// app.get("/api/drive/file/:id", async (req, res) => {
//   console.log(`📥 GET /api/drive/file/${req.params.id}`);
//   console.time(`⏱ ts ${req.params.id}`);
//   try {
//     const auth = await authorize();
//     const drive = google.drive({ version: "v3", auth });
//     const fileId = req.params.id;

//     const file = await drive.files.get(
//       { fileId, alt: "media" },
//       { responseType: "stream" }
//     );

//     res.setHeader("Content-Type", "video/mp2t");
//     file.data.pipe(res).on("finish", () => {
//       console.timeEnd(`⏱ ts ${req.params.id}`);
//     });
//   } catch (err) {
//     console.error("❌ Error proxying segment:", err.message);
//     res.status(500).send("Error fetching segment");
//     console.timeEnd(`⏱ ts ${req.params.id}`);
//   }
// });

// // Error handling middleware
// app.use((err, req, res, next) => {
//   console.error("💥 Unhandled error:", err);
//   res.status(500).json({ error: "Internal server error" });
// });

// app.listen(PORT, () => {
//   console.log(`✅ Kloud-scaler LMS Backend running at http://localhost:${PORT}`);
//   console.log(`👉 API Health check at http://localhost:${PORT}/api/health`);
//   console.log(`👉 Playlist API at http://localhost:${PORT}/api/playlist`);
// });

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { google } from "googleapis";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

// Import routes
import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import coursesRoutes from "./routes/courses.js";
import blogRoutes from "./routes/blog.js";
import toolsRoutes from "./routes/tools.js";
import playlistRoutes from "./routes/playlist.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files
app.use('/uploads', express.static('uploads'));

// === MongoDB Connection ===
const MONGODB_URI = process.env.MONGODB_URI;
mongoose.connect(MONGODB_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// === Google Drive Config ===
const TOKEN_PATH = path.resolve(process.env.GOOGLE_TOKEN_PATH || path.join(__dirname, "token.json"));
const CREDENTIALS_PATH = path.resolve(process.env.GOOGLE_CREDENTIALS_PATH || path.join(__dirname, "credentials.json"));
const FOLDER_VIDEOS = process.env.GOOGLE_DRIVE_FOLDER_ID;
const REDIRECT_URL = process.env.GOOGLE_REDIRECT_URL || `http://localhost:${PORT}/oauth2callback`;

// === File Cache (for m3u8 + ts mapping) ===
const CACHE_TTL = 30 * 60 * 1000; // 30 min
const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour
const fileCache = new Map(); // key -> { file, cachedAt }

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
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of fileCache.entries()) {
    if (now - entry.cachedAt > CACHE_TTL) fileCache.delete(key);
  }
}, CLEANUP_INTERVAL);

// === OAuth Handling ===
function loadOAuthClient() {
  const creds = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, "utf8"));
  const { client_secret, client_id } = creds.installed;
  return new google.auth.OAuth2(client_id, client_secret, REDIRECT_URL);
}

async function authorize() {
  const oAuth2Client = loadOAuthClient();
  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf8"));
    oAuth2Client.setCredentials(token);
    
    // Check token expiry
    if (token.expiry_date && token.expiry_date < Date.now()) {
      console.log("⚠️ Token expired, need re-authentication");
      throw new Error("Token expired - visit /oauth to re-authenticate");
    }
    
    return oAuth2Client;
  } else {
    console.log("⚠️ No token.json found, visit /oauth to authenticate");
    throw new Error("No token.json found");
  }
}

// === OAuth Routes ===
app.get("/oauth", (req, res) => {
  const oAuth2Client = loadOAuthClient();
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/drive.readonly"],
  });
  res.send(`
    <html>
      <head><title>Google Drive Authentication</title></head>
      <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Google Drive Authentication Required</h2>
        <p>Click the link below to authenticate with Google Drive:</p>
        <a href="${authUrl}" target="_blank" style="background: #4285f4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Authenticate with Google Drive
        </a>
        <p style="margin-top: 20px; color: #666;">
          After authentication, you'll be redirected back and can close this window.
        </p>
      </body>
    </html>
  `);
});

app.get("/oauth2callback", async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.status(400).send(`
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>❌ Authentication Failed</h2>
          <p>Missing authorization code. Please try again.</p>
          <a href="/oauth">← Back to Authentication</a>
        </body>
      </html>
    `);
  }
  
  try {
    const oAuth2Client = loadOAuthClient();
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
    
    res.send(`
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>✅ Authentication Successful!</h2>
          <p>Google Drive access has been configured successfully.</p>
          <p>You can now close this window and use the video streaming features.</p>
        </body>
      </html>
    `);
    
    console.log("✅ Google Drive authentication successful");
  } catch (error) {
    console.error("❌ OAuth callback error:", error);
    res.status(500).send(`
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>❌ Authentication Error</h2>
          <p>Failed to complete authentication: ${error.message}</p>
          <a href="/oauth">← Try Again</a>
        </body>
      </html>
    `);
  }
});

// === Recursive walker for Drive ===
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
      cacheSet(file.id, file);
      items.push({
        id: file.id,
        parentId: file.parents[0],
        title: prefix.split("/")[0] || file.name,
        src: `/api/drive/hls/${file.id}`,
        mtime: new Date(file.modifiedTime).getTime(),
      });
    }
  }
  return items;
}

// === API Routes ===

// Core Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/courses", coursesRoutes);
app.use("/api/blog", blogRoutes);
app.use("/api/tools", toolsRoutes);
app.use("/api/playlists", playlistRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    message: "Backend is running",
    googleDrive: fs.existsSync(TOKEN_PATH) ? "authenticated" : "not authenticated"
  });
});

// Legacy endpoint - redirect to new playlist API
app.get("/api/playlist", (req, res) => {
  res.redirect('/api/playlists');
});

// Proxy for m3u8
app.get("/api/drive/hls/:id", async (req, res) => {
  console.log(`📥 GET /api/drive/hls/${req.params.id}`);
  try {
    const fileId = req.params.id;
    const auth = await authorize();
    const drive = google.drive({ version: "v3", auth });
    
    let file = cacheGet(fileId);
    if (!file) {
      file = await drive.files.get({ 
        fileId, 
        fields: "id,name,parents,modifiedTime" 
      }).then(r => r.data);
      cacheSet(fileId, file);
    }
    
    const stream = await drive.files.get({ 
      fileId: file.id, 
      alt: "media" 
    }, { responseType: "stream" });
    
    let content = "";
    stream.data.on("data", chunk => content += chunk.toString());
    stream.data.on("end", async () => {
      try {
        // Get .ts segments from the same folder
      const segs = await drive.files.list({
        q: `'${file.parents[0]}' in parents and trashed=false and name contains '.ts'`,
        fields: "files(id,name)",
        pageSize: 1000,
      });
        segs.data.files.forEach(f => cacheSet(f.name, f));
      const tsMap = Object.fromEntries(segs.data.files.map(f => [f.name, f.id]));
        
        // Get variant .m3u8 files from the same folder
      const variants = await drive.files.list({
        q: `'${file.parents[0]}' in parents and trashed=false and name contains '.m3u8'`,
        fields: "files(id,name)",
        pageSize: 100,
      });
      variants.data.files.forEach(f => cacheSet(f.name, f));
        
        // Rewrite .ts segment references to use our proxy
      content = content.replace(/([^\s]+\.ts)/g, m => `/api/drive/file/${tsMap[m] || m}`);
        
        // Rewrite variant .m3u8 references to use our proxy
      content = content.replace(/([^\s]+\.m3u8)/g, m => {
        const f = cacheGet(m);
        return f ? `/api/drive/hls/${f.id}` : m;
      });
        
      res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Cache-Control", "no-cache");
      res.send(content);
        
        console.log(`✅ Served m3u8 for ${file.name} with ${Object.keys(tsMap).length} segments`);
      } catch (error) {
        console.error("❌ Error processing m3u8 content:", error);
        res.status(500).send("Error processing m3u8");
      }
    });
  } catch (err) {
    console.error("❌ Error proxying m3u8:", err.message);
    res.status(500).send("Error fetching m3u8");
  }
});

// Proxy for TS segments
app.get("/api/drive/file/:id", async (req, res) => {
  console.log(`📥 GET /api/drive/file/${req.params.id}`);
  try {
    const auth = await authorize();
    const drive = google.drive({ version: "v3", auth });
    const fileId = req.params.id;
    
    const file = await drive.files.get({ 
      fileId, 
      alt: "media" 
    }, { responseType: "stream" });
    
    res.setHeader("Content-Type", "video/mp2t");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "public, max-age=3600"); // Cache for 1 hour
    
    file.data.pipe(res);
    
    console.log(`✅ Served TS segment ${fileId}`);
  } catch (err) {
    console.error("❌ Error proxying segment:", err.message);
    res.status(500).send("Error fetching segment");
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error("💥 Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log(`👉 Health: http://localhost:${PORT}/api/health`);
  console.log(`👉 Playlists: http://localhost:${PORT}/api/playlists`);
  
  // Check Google Drive authentication status
  if (!fs.existsSync(TOKEN_PATH)) {
    console.log(`⚠️  Google Drive not authenticated - visit: http://localhost:${PORT}/oauth`);
  } else {
    console.log(`✅ Google Drive authenticated`);
  }
});
