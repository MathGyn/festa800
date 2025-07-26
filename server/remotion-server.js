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

// 🔥 MAPA DE CONEXÕES DE PROGRESSO REAL
const progressConnections = new Map();

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

// 🔥 ENDPOINT DE PROGRESSO REAL - Server-Sent Events
app.get('/api/render-progress/:sessionId', (req, res) => {
  const sessionId = req.params.sessionId;
  console.log(`🎯 CONECTANDO PROGRESSO REAL: ${sessionId}`);
  
  // Configurar SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });
  
  // Confirmar conexão
  res.write('data: {"type":"connected","message":"Progresso REAL conectado"}\n\n');
  
  // Armazenar conexão para uso posterior
  progressConnections.set(sessionId, res);
  
  // Limpar quando desconectar
  req.on('close', () => {
    console.log(`🔌 Desconectado: ${sessionId}`);
    progressConnections.delete(sessionId);
  });
  
  req.on('error', () => {
    console.log(`❌ Erro na conexão: ${sessionId}`);
    progressConnections.delete(sessionId);
  });
});

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

// Function to remove background from image using rembg
async function removeBackground(imagePath) {
  try {
    console.log('🖼️ Removing background from image using rembg...');
    
    const processedImagePath = imagePath.replace(/(\.[^.]+)$/, '-nobg.png');
    
    // Use Python virtual environment and rembg
    const venvPython = path.join(__dirname, '..', 'venv', 'bin', 'python3');
    const removeScript = path.join(__dirname, 'remove_bg.py');
    
    // Execute rembg Python script
    const { spawn } = await import('child_process');
    
    return new Promise((resolve, reject) => {
      const process = spawn(venvPython, [removeScript, imagePath, processedImagePath]);
      
      let stdout = '';
      let stderr = '';
      
      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      process.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Background removal completed using rembg');
          console.log(stdout.trim());
          resolve(processedImagePath);
        } else {
          console.error('❌ Background removal failed:', stderr);
          console.log('🔄 Using original image as fallback');
          resolve(imagePath);
        }
      });
      
      process.on('error', (error) => {
        console.error('❌ Error executing rembg:', error.message);
        console.log('🔄 Using original image as fallback');
        resolve(imagePath);
      });
    });
  } catch (error) {
    console.error('❌ Background removal failed:', error.message);
    console.log('🔄 Using original image as fallback');
    return imagePath;
  }
}

// Route to render video
app.post('/api/render-video', upload.single('userImage'), async (req, res) => {
  try {
    const { userName, sessionId } = req.body;
    const userImageFile = req.file;
    
    console.log(`🎬 RENDERIZAÇÃO INICIADA: ${userName}, Session: ${sessionId}`);
    
    // Função para enviar progresso REAL
    const sendRealProgress = (data) => {
      if (sessionId && progressConnections.has(sessionId)) {
        const connection = progressConnections.get(sessionId);
        try {
          connection.write(`data: ${JSON.stringify(data)}\n\n`);
          console.log(`🔥 PROGRESSO REAL ENVIADO: ${data.renderedFrames}/${data.totalFrames}`);
        } catch (error) {
          console.error('❌ Erro ao enviar progresso REAL:', error);
          progressConnections.delete(sessionId);
        }
      }
    };

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
          console.log(`🎬 PROGRESSO REAL: ${renderedFrames}/${totalFrames} (${progress}%)`);
          
          // 🔥 ENVIAR PROGRESSO REAL PARA FRONTEND
          sendRealProgress({
            type: 'progress',
            renderedFrames,
            totalFrames,
            progress,
            message: `Renderizando ${renderedFrames}/${totalFrames} frames`
          });
        } else {
          console.log(`🎬 FRAME: ${renderedFrames}`);
          
          // 🔥 ENVIAR FRAME INDIVIDUAL
          sendRealProgress({
            type: 'frame',
            renderedFrames,
            totalFrames: 300, // Padrão
            progress: Math.round((renderedFrames / 300) * 100),
            message: `Frame ${renderedFrames}/300`
          });
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