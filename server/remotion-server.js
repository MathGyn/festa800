import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}.${file.originalname.split('.').pop()}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// Middlewares
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/output', express.static(path.join(__dirname, '../output')));
app.use('/card-details.png', express.static(path.join(__dirname, './card-details.png')));
app.use('/bg-card.jpg', express.static(path.join(__dirname, './bg-card.jpg')));

// Global bundleLocation cache
let bundleLocation = null;

// Initialize Remotion bundle
async function initializeBundle() {
  if (!bundleLocation) {
    console.log('🎬 Bundling Remotion project...');
    bundleLocation = await bundle({
      entryPoint: path.resolve(__dirname, '../src/remotion/Root.tsx'),
      onProgress: (progress) => {
        console.log(`📦 Bundling progress: ${Math.round(progress * 100)}%`);
      },
    });
    console.log('✅ Remotion bundle ready!');
  }
  return bundleLocation;
}

// Function to remove background from image using PhotoRoom API
async function removeBackground(imagePath) {
  try {
    console.log('🖼️ Removing background from image using PhotoRoom...');
    
    const API_KEY = 'sk_pr_default_928d4f9b69a687e3aa884bc3468f9d08310b4f93'; // PhotoRoom API key
    const processedImagePath = imagePath.replace(/(\.[^.]+)$/, '-nobg$1');
    
    // Read the image file
    const imageBuffer = fs.readFileSync(imagePath);
    
    // Call PhotoRoom API using form data
    const FormData = (await import('form-data')).default;
    const formData = new FormData();
    formData.append('image_file', imageBuffer, {
      filename: 'image.jpg',
      contentType: 'image/jpeg'
    });

    const response = await axios.post('https://sdk.photoroom.com/v1/segment', formData, {
      headers: {
        'x-api-key': API_KEY,
        ...formData.getHeaders(),
      },
      responseType: 'arraybuffer',
      maxContentLength: 50 * 1024 * 1024, // 50MB
    });
    
    // Save the processed image
    fs.writeFileSync(processedImagePath, response.data);
    
    console.log('✅ Background removal completed using PhotoRoom API');
    return processedImagePath;
  } catch (error) {
    console.error('❌ Background removal failed:', error.message);
    console.error('Error details:', error.response?.status, error.response?.statusText);
    
    // Fallback: return original image if API fails
    console.log('🔄 Using original image as fallback');
    return imagePath;
  }
}

// Route to render video
app.post('/api/render-video', upload.single('userImage'), async (req, res) => {
  try {
    const { userName } = req.body;
    const userImageFile = req.file;

    if (!userName || !userImageFile) {
      return res.status(400).json({ error: 'Missing userName or userImage' });
    }

    console.log(`🎬 Starting video generation for: ${userName}`);

    // Remove background from uploaded image
    const processedImagePath = await removeBackground(userImageFile.path);
    const processedImageName = path.basename(processedImagePath);
    
    // Initialize bundle if needed
    const serveUrl = await initializeBundle();

    // Convert processed file to public URL
    const userImageUrl = `http://localhost:${PORT}/uploads/${processedImageName}`;

    // Get composition
    const composition = await selectComposition({
      serveUrl,
      id: 'ProfileCard',
      inputProps: {
        userName,
        userImage: userImageUrl,
      },
    });

    // Generate output path
    const outputDir = path.join(__dirname, '../output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputFileName = `profile-card-${Date.now()}.mp4`;
    const outputPath = path.join(outputDir, outputFileName);

    console.log(`📹 Rendering video to: ${outputPath}`);

    // Render the video
    await renderMedia({
      composition,
      serveUrl,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps: {
        userName,
        userImage: userImageUrl,
      },
      onProgress: ({ renderedFrames, totalFrames }) => {
        if (totalFrames && totalFrames > 0) {
          const progress = Math.round((renderedFrames / totalFrames) * 100);
          console.log(`🎬 Rendering progress: ${progress}%`);
        } else {
          console.log(`🎬 Rendering frame: ${renderedFrames}`);
        }
      },
    });

    console.log('✅ Video rendered successfully!');

    // Read the rendered video and send as response
    const videoBuffer = fs.readFileSync(outputPath);
    
    // Clean up uploaded images
    if (fs.existsSync(userImageFile.path)) {
      fs.unlinkSync(userImageFile.path);
    }
    if (fs.existsSync(processedImagePath) && processedImagePath !== userImageFile.path) {
      fs.unlinkSync(processedImagePath);
    }

    // Send video file
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', `attachment; filename="${outputFileName}"`);
    res.send(videoBuffer);

    // Clean up output file after sending
    setTimeout(() => {
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }
    }, 5000);

  } catch (error) {
    console.error('❌ Error rendering video:', error);
    res.status(500).json({ 
      error: 'Failed to render video',
      details: error.message 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Remotion server is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Remotion server running on http://localhost:${PORT}`);
  console.log(`🎬 Ready to render videos!`);
  
  // Preload bundle
  initializeBundle().catch(console.error);
});

export default app;