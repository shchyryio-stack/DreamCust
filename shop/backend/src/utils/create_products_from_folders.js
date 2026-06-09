require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Product = require('../models/Product');

// Product data mapping based on folder name
const productSpecsMapping = {
  'AMD Ryzen 5 7500f': {
    brand: 'AMD',
    category: 'CPU',
    productType: 'CPU',
    description: 'Excellent budget gaming CPU on the AM5 socket without integrated graphics.',
    price: 159.99,
    specifications: {
      socket: 'AM5',
      cores: 6,
      threads: 12,
      tdp: 65,
      boostClock: 5000,
      integratedGraphics: false
    },
    compatibility: { socket: 'AM5' }
  },
  'AMD Ryzen 7 5700x': {
    brand: 'AMD',
    category: 'CPU',
    productType: 'CPU',
    description: 'High-performance 8-core CPU for socket AM4, ideal for upgrading older systems.',
    price: 179.99,
    specifications: {
      socket: 'AM4',
      cores: 8,
      threads: 16,
      tdp: 65,
      boostClock: 4600,
      integratedGraphics: false
    },
    compatibility: { socket: 'AM4' }
  },
  'ASRock B650M-HDVM.2': {
    brand: 'ASRock',
    category: 'MOTHERBOARD',
    productType: 'Motherboard',
    description: 'Budget-friendly AM5 motherboard with DDR5 support and robust power design.',
    price: 109.99,
    specifications: {
      socket: 'AM5',
      chipset: 'B650',
      formFactor: 'Micro ATX',
      memoryType: 'DDR5'
    },
    compatibility: { socket: 'AM5', formFactor: 'Micro-ATX', memoryType: 'DDR5' }
  },
  'Asus TUF GAMING B550M-PLUS': {
    brand: 'ASUS',
    category: 'MOTHERBOARD',
    productType: 'Motherboard',
    description: 'Reliable PCIe 4.0 AM4 motherboard with military-grade TUF components.',
    price: 129.99,
    specifications: {
      socket: 'AM4',
      chipset: 'B550',
      formFactor: 'Micro ATX',
      memoryType: 'DDR4'
    },
    compatibility: { socket: 'AM4', formFactor: 'Micro-ATX', memoryType: 'DDR4' }
  },
  'Asus GeForce RTX 5060 Dual OC 8GB': {
    brand: 'ASUS',
    category: 'GPU',
    productType: 'GPU',
    description: 'Next-generation NVIDIA architecture for fluid 1080p and 1440p gaming.',
    price: 349.99,
    specifications: {
      chipset: 'NVIDIA',
      vram: '8GB',
      boostClock: 2500,
      tdp: 130,
      length: 227
    },
    compatibility: { tdp: 130 }
  },
  'Asus Radeon RX 9070 XT Prime OC 16GB': {
    brand: 'ASUS',
    category: 'GPU',
    productType: 'GPU',
    description: 'Ultra high-performance AMD gaming graphics card with 16GB VRAM.',
    price: 699.99,
    specifications: {
      chipset: 'AMD',
      vram: '16GB',
      boostClock: 2600,
      tdp: 250,
      length: 280
    },
    compatibility: { tdp: 250 }
  },
  'Cougar MX600 RGB': {
    brand: 'Cougar',
    category: 'CASE',
    productType: 'Case',
    description: 'Premium airflow mid-tower case with pre-installed RGB fans and sleek design.',
    price: 119.99,
    specifications: {
      formFactor: 'Mid Tower',
      supportedMotherboards: ['ATX', 'Micro-ATX', 'Mini-ITX'],
      maxGpuLength: 400,
      color: 'Black',
      radiatorSupport: ['240mm', '280mm', '360mm']
    },
    compatibility: { supportedMotherboards: ['ATX', 'Micro-ATX', 'Mini-ITX'], maxGpuLength: 400 }
  },
  'Fractal Design Meshify 2': {
    brand: 'Fractal Design',
    category: 'CASE',
    productType: 'Case',
    description: 'High-performance modular mid-tower case featuring an iconic mesh front panel.',
    price: 159.99,
    specifications: {
      formFactor: 'Mid Tower',
      supportedMotherboards: ['ATX', 'Micro-ATX', 'Mini-ITX'],
      maxGpuLength: 450,
      color: 'Black',
      radiatorSupport: ['240mm', '280mm', '360mm']
    },
    compatibility: { supportedMotherboards: ['ATX', 'Micro-ATX', 'Mini-ITX'], maxGpuLength: 450 }
  },
  'Kingston Fury Beast DDR4 2x8GB': {
    brand: 'Kingston',
    category: 'RAM',
    productType: 'RAM',
    description: 'High-reliability DDR4 desktop memory kit for gaming and productivity.',
    price: 49.99,
    specifications: {
      capacity: '16GB',
      generation: 'DDR4',
      frequency: 3200,
      latency: 'CL16',
      rgb: false
    },
    compatibility: { memoryType: 'DDR4' }
  },
  'Kingston Fury Beast DDR5 2x16GB': {
    brand: 'Kingston',
    category: 'RAM',
    productType: 'RAM',
    description: 'Blazing fast DDR5 desktop memory kit with Intel XMP/AMD EXPO profiles.',
    price: 119.99,
    specifications: {
      capacity: '32GB',
      generation: 'DDR5',
      frequency: 6000,
      latency: 'CL30',
      rgb: false
    },
    compatibility: { memoryType: 'DDR5' }
  },
  'SSD Samsung 990 PRO MZ-V9P1T0BW': {
    brand: 'Samsung',
    category: 'STORAGE',
    productType: 'SSD',
    description: 'Extreme speeds PCIe 4.0 NVMe M.2 SSD for gaming and content creation.',
    price: 109.99,
    specifications: {
      type: 'SSD',
      interface: 'NVMe',
      capacity: '1TB',
      readSpeed: 7450,
      writeSpeed: 6900
    },
    compatibility: {}
  },
  'be quiet! Pure Power 13 M': {
    brand: 'be quiet!',
    category: 'PSU',
    productType: 'PSU',
    description: 'ATX 3.0 compatible fully modular power supply with 80 PLUS Gold efficiency.',
    price: 139.99,
    specifications: {
      wattage: 850,
      efficiency: '80+ Gold',
      modularity: 'Full'
    },
    compatibility: { wattage: 850 }
  },
  'be quiet! Pure Rock 3 Black': {
    brand: 'be quiet!',
    category: 'COOLING',
    productType: 'Cooler',
    description: 'Quiet and efficient tower CPU air cooler in a stealthy black finish.',
    price: 49.99,
    specifications: {
      type: 'Air',
      radiatorSize: 'N/A',
      supportedSockets: ['AM5', 'AM4', 'LGA1700', 'LGA1200']
    },
    compatibility: { supportedSockets: ['AM5', 'AM4', 'LGA1700', 'LGA1200'] }
  }
};

const getSlug = (text) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

const run = async () => {
  try {
    await connectDB();

    const imagesSourceDir = path.join(__dirname, '../../../Images');
    const storageImagesDir = path.join(__dirname, '../../../storage/products/images');

    // Create target dir if it doesn't exist
    if (!fs.existsSync(storageImagesDir)) {
      fs.mkdirSync(storageImagesDir, { recursive: true });
    }

    if (!fs.existsSync(imagesSourceDir)) {
      console.error(`Source images directory not found at: ${imagesSourceDir}`);
      process.exit(1);
    }

    const folders = fs.readdirSync(imagesSourceDir).filter(f => {
      const fullPath = path.join(imagesSourceDir, f);
      return fs.statSync(fullPath).isDirectory();
    });

    console.log(`Found ${folders.length} product folders in ${imagesSourceDir}`);

    for (const folderName of folders) {
      console.log(`\n--------------------------------------------`);
      console.log(`Processing folder: "${folderName}"`);

      const specs = productSpecsMapping[folderName];
      if (!specs) {
        console.warn(`WARNING: No specifications mapping found for "${folderName}". Skipping...`);
        continue;
      }

      const slug = getSlug(folderName);
      const productFolder = path.join(imagesSourceDir, folderName);
      const files = fs.readdirSync(productFolder).filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.webp', '.svg'].includes(ext);
      });

      console.log(`Found ${files.length} images inside the folder.`);

      const mediaImages = [];
      const timestamp = Date.now();

      // Copy images to storage
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = path.extname(file);
        const uniqueFileName = `${timestamp}-${slug}-${i}${ext}`;
        const sourcePath = path.join(productFolder, file);
        const destinationPath = path.join(storageImagesDir, uniqueFileName);

        fs.copyFileSync(sourcePath, destinationPath);
        
        // Frontend expects relative URL served from app
        const relativeUrl = `/storage/products/images/${uniqueFileName}`;
        mediaImages.push(relativeUrl);
      }

      console.log(`Copied images successfully. Stored URLs:`, mediaImages);

      const thumbnail = mediaImages[0] || '';

      const productData = {
        title: folderName,
        slug: slug,
        brand: specs.brand,
        description: specs.description,
        category: specs.category,
        productType: specs.productType,
        price: specs.price,
        pricing: {
          price: specs.price,
          discount: 0,
          currency: 'USD'
        },
        specifications: specs.specifications,
        compatibility: specs.compatibility,
        inventory: {
          quantity: 50,
          reserved: 0,
          incoming: 0,
          sold: 0
        },
        media: {
          images: mediaImages,
          thumbnail: thumbnail
        },
        images: mediaImages,
        thumbnail: thumbnail,
        builderReady: true,
        status: 'Published',
        computed: {
          inStock: true,
          totalQuantity: 50
        }
      };

      const result = await Product.findOneAndUpdate(
        { slug: slug },
        productData,
        { upsert: true, new: true }
      );

      console.log(`Product created/updated in DB: "${result.title}" (slug: ${result.slug})`);
    }

    console.log(`\n============================================`);
    console.log(`All products imported successfully!`);
    process.exit(0);
  } catch (error) {
    console.error(`Fatal error: ${error.message}`);
    process.exit(1);
  }
};

run();
