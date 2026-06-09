const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// Base storage path: c:/Users/Admin/Desktop/My_Site/shop/storage/products
const baseStoragePath = path.join(__dirname, '../../../../shop/storage/products');

// Ensure directories exist
const directories = ['images', 'models', 'videos', 'textures', 'documents'];
directories.forEach(dir => {
  const dirPath = path.join(baseStoragePath, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination(req, file, cb) {
    let folder = 'documents';
    
    // Determine folder based on file type
    if (file.mimetype.startsWith('image/')) folder = 'images';
    else if (file.mimetype.startsWith('video/')) folder = 'videos';
    else if (file.originalname.endsWith('.glb') || file.originalname.endsWith('.gltf') || file.originalname.endsWith('.obj') || file.originalname.endsWith('.fbx')) {
      folder = 'models';
    } else if (file.originalname.endsWith('.png') || file.originalname.endsWith('.jpg')) {
      folder = 'textures'; // Or handle via frontend sending a specific fieldname
    }

    cb(null, path.join(baseStoragePath, folder));
  },
  filename(req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname.replace(/\\s+/g, '-')}`);
  },
});

const checkFileType = (file, cb) => {
  // Allow almost anything since it's an enterprise admin
  // But we can restrict execution files
  if (file.originalname.endsWith('.exe') || file.originalname.endsWith('.bat')) {
    return cb(new Error('Executable files are not allowed'), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
  limits: { fileSize: 500000000 }, // 500MB max for 3D models
});

// @route   POST /api/upload
// @desc    Upload media
// @access  Private/Admin
router.post('/', protect, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  
  // Return the relative path that the shop frontend can use
  // Assuming shop frontend serves /storage as static or just saves absolute
  // Best practice is to save relative to shop root: `/storage/products/${folder}/${filename}`
  
  let folder = 'documents';
  if (req.file.mimetype.startsWith('image/')) folder = 'images';
  else if (req.file.mimetype.startsWith('video/')) folder = 'videos';
  else if (req.file.originalname.endsWith('.glb') || req.file.originalname.endsWith('.gltf') || req.file.originalname.endsWith('.obj') || req.file.originalname.endsWith('.fbx')) {
    folder = 'models';
  }

  const fileUrl = `/storage/products/${folder}/${req.file.filename}`;

  res.json({
    message: 'File uploaded successfully',
    url: fileUrl,
    filename: req.file.filename,
    mimetype: req.file.mimetype,
    size: req.file.size
  });
});

module.exports = router;
