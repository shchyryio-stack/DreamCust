require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Product = require('../models/Product');

const seedProducts = [
  // ─── CPU ───────────────────────────────────────────
  {
    title: 'AMD Ryzen 5 7600X',
    slug: 'amd-ryzen-5-7600x',
    brand: 'AMD',
    description: 'A great mid-range CPU for gaming on the AM5 platform.',
    category: 'CPU',
    pricing: { price: 249.99, discount: 0, currency: 'USD' },
    specifications: {
      socket: 'AM5',
      cores: 6,
      threads: 12,
      tdp: 105,
      integratedGraphics: true,
      boostClock: 5300
    },
    compatibility: { socket: 'AM5' },
    inventory: { quantity: 50, reserved: 0 },
    media: { images: ['/images/ryzen-7600x.jpg'] },
    builderReady: true,
  },
  {
    title: 'Intel Core i5-13600K',
    slug: 'intel-core-i5-13600k',
    brand: 'Intel',
    description: 'Excellent performance for gaming and productivity.',
    category: 'CPU',
    pricing: { price: 319.99, discount: 0, currency: 'USD' },
    specifications: {
      socket: 'LGA1700',
      cores: 14,
      threads: 20,
      tdp: 125,
      integratedGraphics: true,
      boostClock: 5100
    },
    compatibility: { socket: 'LGA1700' },
    inventory: { quantity: 45, reserved: 0 },
    media: { images: ['/images/i5-13600k.jpg'] },
    builderReady: true,
  },
  {
    title: 'AMD Ryzen 9 7950X',
    slug: 'amd-ryzen-9-7950x',
    brand: 'AMD',
    description: 'Flagship 16-core desktop processor for ultimate performance.',
    category: 'CPU',
    pricing: { price: 699.99, discount: 0, currency: 'USD' },
    specifications: {
      socket: 'AM5',
      cores: 16,
      threads: 32,
      tdp: 170,
      integratedGraphics: true,
      boostClock: 5700
    },
    compatibility: { socket: 'AM5' },
    inventory: { quantity: 20, reserved: 0 },
    media: { images: ['/images/ryzen-7950x.jpg'] },
    builderReady: true,
  },

  // ─── MOTHERBOARD ───────────────────────────────────
  {
    title: 'ASUS ROG Strix B650E-F',
    slug: 'asus-rog-strix-b650e-f',
    brand: 'ASUS',
    description: 'Feature-rich ATX motherboard for AM5 processors.',
    category: 'MOTHERBOARD',
    pricing: { price: 269.99, discount: 0, currency: 'USD' },
    specifications: {
      socket: 'AM5',
      chipset: 'B650E',
      formFactor: 'ATX',
      memoryType: 'DDR5'
    },
    compatibility: { socket: 'AM5', formFactor: 'ATX', memoryType: 'DDR5' },
    inventory: { quantity: 30, reserved: 0 },
    media: { images: ['/images/b650e-f.jpg'] },
    builderReady: true,
  },
  {
    title: 'MSI PRO Z790-P WIFI',
    slug: 'msi-pro-z790-p',
    brand: 'MSI',
    description: 'Solid foundation for Intel 13th-gen LGA1700 processors.',
    category: 'MOTHERBOARD',
    pricing: { price: 199.99, discount: 0, currency: 'USD' },
    specifications: {
      socket: 'LGA1700',
      chipset: 'Z790',
      formFactor: 'ATX',
      memoryType: 'DDR5'
    },
    compatibility: { socket: 'LGA1700', formFactor: 'ATX', memoryType: 'DDR5' },
    inventory: { quantity: 25, reserved: 0 },
    media: { images: ['/images/z790-p.jpg'] },
    builderReady: true,
  },

  // ─── RAM ───────────────────────────────────────────
  {
    title: 'Corsair Vengeance 32GB (2x16GB) DDR5-6000',
    slug: 'corsair-vengeance-32gb-ddr5-6000',
    brand: 'Corsair',
    description: 'Fast and reliable DDR5 memory.',
    category: 'RAM',
    pricing: { price: 114.99, discount: 0, currency: 'USD' },
    specifications: {
      capacity: '32GB',
      generation: 'DDR5',
      frequency: 6000,
      latency: 'CL30',
      rgb: true
    },
    compatibility: { memoryType: 'DDR5' },
    inventory: { quantity: 100, reserved: 0 },
    media: { images: ['/images/vengeance-ddr5.jpg'] },
    builderReady: true,
  },
  {
    title: 'G.Skill Trident Z5 Neo 32GB DDR5-6000 CL30',
    slug: 'gskill-trident-z5-32gb-ddr5-6000',
    brand: 'G.Skill',
    description: 'High performance AMD EXPO DDR5 kit.',
    category: 'RAM',
    pricing: { price: 124.99, discount: 0, currency: 'USD' },
    specifications: {
      capacity: '32GB',
      generation: 'DDR5',
      frequency: 6000,
      latency: 'CL30',
      rgb: true
    },
    compatibility: { memoryType: 'DDR5' },
    inventory: { quantity: 80, reserved: 0 },
    media: { images: ['/images/trident-z5.jpg'] },
    builderReady: true,
  },
  {
    title: 'Kingston FURY Beast 16GB DDR4-3200',
    slug: 'kingston-fury-beast-16gb-ddr4-3200',
    brand: 'Kingston',
    description: 'Reliable DDR4 kit for budget and mid-range builds.',
    category: 'RAM',
    pricing: { price: 44.99, discount: 0, currency: 'USD' },
    specifications: {
      capacity: '16GB',
      generation: 'DDR4',
      frequency: 3200,
      latency: 'CL16',
      rgb: false
    },
    compatibility: { memoryType: 'DDR4' },
    inventory: { quantity: 120, reserved: 0 },
    media: { images: ['/images/fury-beast.jpg'] },
    builderReady: true,
  },

  // ─── GPU ───────────────────────────────────────────
  {
    title: 'NVIDIA GeForce RTX 4070',
    slug: 'nvidia-geforce-rtx-4070',
    brand: 'NVIDIA',
    description: 'Outstanding 1440p gaming performance.',
    category: 'GPU',
    pricing: { price: 599.99, discount: 0, currency: 'USD' },
    specifications: {
      chipset: 'NVIDIA',
      vram: '12GB',
      boostClock: 2475,
      tdp: 200,
      length: 242
    },
    compatibility: { tdp: 200 },
    inventory: { quantity: 20, reserved: 0 },
    media: { images: ['/images/rtx-4070.jpg'] },
    builderReady: true,
  },
  {
    title: 'AMD Radeon RX 7800 XT',
    slug: 'amd-radeon-rx-7800-xt',
    brand: 'AMD',
    description: 'High-end 1440p and 4K entry gaming GPU.',
    category: 'GPU',
    pricing: { price: 499.99, discount: 0, currency: 'USD' },
    specifications: {
      chipset: 'AMD',
      vram: '16GB',
      boostClock: 2430,
      tdp: 263,
      length: 267
    },
    compatibility: { tdp: 263 },
    inventory: { quantity: 15, reserved: 0 },
    media: { images: ['/images/rx-7800-xt.jpg'] },
    builderReady: true,
  },

  // ─── STORAGE ───────────────────────────────────────
  {
    title: 'Samsung 990 Pro 2TB NVMe SSD',
    slug: 'samsung-990-pro-2tb',
    brand: 'Samsung',
    description: 'Flagship PCIe 4.0 NVMe M.2 SSD with blazing speeds.',
    category: 'STORAGE',
    pricing: { price: 169.99, discount: 0, currency: 'USD' },
    specifications: {
      type: 'SSD',
      interface: 'NVMe',
      capacity: '2TB',
      readSpeed: 7450,
      writeSpeed: 6900
    },
    compatibility: {},
    inventory: { quantity: 80, reserved: 0 },
    media: { images: ['/images/990-pro.jpg'] },
    builderReady: true,
  },
  {
    title: 'Crucial MX500 1TB SATA SSD',
    slug: 'crucial-mx500-1tb',
    brand: 'Crucial',
    description: 'Reliable and fast SATA 2.5-inch Internal SSD.',
    category: 'STORAGE',
    pricing: { price: 79.99, discount: 0, currency: 'USD' },
    specifications: {
      type: 'SSD',
      interface: 'SATA',
      capacity: '1TB',
      readSpeed: 560,
      writeSpeed: 510
    },
    compatibility: {},
    inventory: { quantity: 75, reserved: 0 },
    media: { images: ['/images/mx500.jpg'] },
    builderReady: true,
  },

  // ─── CASE ──────────────────────────────────────────
  {
    title: 'NZXT H5 Flow',
    slug: 'nzxt-h5-flow',
    brand: 'NZXT',
    description: 'Compact mid-tower with excellent airflow.',
    category: 'CASE',
    pricing: { price: 94.99, discount: 0, currency: 'USD' },
    specifications: {
      formFactor: 'Mid Tower',
      supportedMotherboards: ['ATX', 'Micro-ATX', 'Mini-ITX'],
      maxGpuLength: 365,
      color: 'Black',
      radiatorSupport: ['240mm', '280mm']
    },
    compatibility: { supportedMotherboards: ['ATX', 'Micro-ATX', 'Mini-ITX'], maxGpuLength: 365 },
    inventory: { quantity: 40, reserved: 0 },
    media: { images: ['/images/nzxt-h5.jpg'] },
    builderReady: true,
  },
  {
    title: 'Corsair 4000D Airflow',
    slug: 'corsair-4000d-airflow',
    brand: 'Corsair',
    description: 'Minimalist mid-tower case with optimized front mesh panel.',
    category: 'CASE',
    pricing: { price: 104.99, discount: 0, currency: 'USD' },
    specifications: {
      formFactor: 'Mid Tower',
      supportedMotherboards: ['ATX', 'Micro-ATX', 'Mini-ITX'],
      maxGpuLength: 360,
      color: 'White',
      radiatorSupport: ['120mm', '240mm', '360mm']
    },
    compatibility: { supportedMotherboards: ['ATX', 'Micro-ATX', 'Mini-ITX'], maxGpuLength: 360 },
    inventory: { quantity: 35, reserved: 0 },
    media: { images: ['/images/4000d.jpg'] },
    builderReady: true,
  },

  // ─── PSU ───────────────────────────────────────────
  {
    title: 'Corsair RM850x (2021)',
    slug: 'corsair-rm850x',
    brand: 'Corsair',
    description: '850 Watt 80 PLUS Gold Fully Modular ATX Power Supply.',
    category: 'PSU',
    pricing: { price: 149.99, discount: 0, currency: 'USD' },
    specifications: {
      wattage: 850,
      efficiency: '80+ Gold',
      modularity: 'Full'
    },
    compatibility: { wattage: 850 },
    inventory: { quantity: 60, reserved: 0 },
    media: { images: ['/images/rm850x.jpg'] },
    builderReady: true,
  },
  {
    title: 'EVGA SuperNOVA 750 GT',
    slug: 'evga-supernova-750-gt',
    brand: 'EVGA',
    description: '750 Watt 80 PLUS Gold Compact Fully Modular Power Supply.',
    category: 'PSU',
    pricing: { price: 119.99, discount: 0, currency: 'USD' },
    specifications: {
      wattage: 750,
      efficiency: '80+ Gold',
      modularity: 'Full'
    },
    compatibility: { wattage: 750 },
    inventory: { quantity: 50, reserved: 0 },
    media: { images: ['/images/750gt.jpg'] },
    builderReady: true,
  },

  // ─── COOLING ───────────────────────────────────────
  {
    title: 'NZXT Kraken 240 Liquid Cooler',
    slug: 'nzxt-kraken-240',
    brand: 'NZXT',
    description: 'All-in-one liquid cooler with customizable LCD display.',
    category: 'COOLING',
    pricing: { price: 139.99, discount: 0, currency: 'USD' },
    specifications: {
      type: 'Liquid',
      radiatorSize: '240mm',
      supportedSockets: ['AM5', 'AM4', 'LGA1700', 'LGA1200']
    },
    compatibility: { supportedSockets: ['AM5', 'AM4', 'LGA1700', 'LGA1200'] },
    inventory: { quantity: 25, reserved: 0 },
    media: { images: ['/images/kraken-240.jpg'] },
    builderReady: true,
  },
  {
    title: 'Noctua NH-D15 chromax.black',
    slug: 'noctua-nh-d15',
    brand: 'Noctua',
    description: 'Premium dual-tower air cooler for maximum cooling.',
    category: 'COOLING',
    pricing: { price: 109.99, discount: 0, currency: 'USD' },
    specifications: {
      type: 'Air',
      radiatorSize: 'N/A',
      supportedSockets: ['AM5', 'AM4', 'LGA1700', 'LGA1200']
    },
    compatibility: { supportedSockets: ['AM5', 'AM4', 'LGA1700', 'LGA1200'] },
    inventory: { quantity: 30, reserved: 0 },
    media: { images: ['/images/nh-d15.jpg'] },
    builderReady: true,
  },

  // ─── MONITOR ───────────────────────────────────────
  {
    title: 'ASUS ROG Swift PG279QM 27"',
    slug: 'asus-rog-swift-pg279qm',
    brand: 'ASUS',
    description: '27-inch WQHD Fast IPS 240Hz Gaming Monitor.',
    category: 'MONITOR',
    pricing: { price: 699.99, discount: 0, currency: 'USD' },
    specifications: {
      size: '27"',
      resolution: '2560x1440',
      refreshRate: 240,
      panelType: 'IPS'
    },
    compatibility: {},
    inventory: { quantity: 12, reserved: 0 },
    media: { images: ['/images/pg279qm.jpg'] },
    builderReady: true,
  },
  {
    title: 'LG UltraGear 34GP950G-B 34"',
    slug: 'lg-ultragear-34gp950g',
    brand: 'LG',
    description: '34-inch curved WQHD Nano IPS 144Hz HDR gaming monitor.',
    category: 'MONITOR',
    pricing: { price: 899.99, discount: 0, currency: 'USD' },
    specifications: {
      size: '34"',
      resolution: '3440x1440',
      refreshRate: 144,
      panelType: 'Nano IPS'
    },
    compatibility: {},
    inventory: { quantity: 8, reserved: 0 },
    media: { images: ['/images/34gp950g.jpg'] },
    builderReady: true,
  },

  // ─── KEYBOARD ──────────────────────────────────────
  {
    title: 'Logitech G915 TKL Wireless',
    slug: 'logitech-g915-tkl',
    brand: 'Logitech',
    description: 'Lightspeed wireless mechanical keyboard with low profile switches.',
    category: 'KEYBOARD',
    pricing: { price: 229.99, discount: 0, currency: 'USD' },
    specifications: {
      switchType: 'Tactile',
      layout: 'TKL',
      wireless: true,
      rgb: true
    },
    compatibility: {},
    inventory: { quantity: 20, reserved: 0 },
    media: { images: ['/images/g915-tkl.jpg'] },
    builderReady: true,
  },
  {
    title: 'Keychron K2 Mechanical RGB Wireless',
    slug: 'keychron-k2-wireless',
    brand: 'Keychron',
    description: 'Compact 75% layout keyboard with hot-swappable switches.',
    category: 'KEYBOARD',
    pricing: { price: 89.99, discount: 0, currency: 'USD' },
    specifications: {
      switchType: 'Linear',
      layout: '75%',
      wireless: true,
      rgb: true
    },
    compatibility: {},
    inventory: { quantity: 45, reserved: 0 },
    media: { images: ['/images/keychron-k2.jpg'] },
    builderReady: true,
  },

  // ─── MOUSE ─────────────────────────────────────────
  {
    title: 'Logitech G502 LIGHTSPEED Wireless',
    slug: 'logitech-g502-lightspeed',
    brand: 'Logitech',
    description: 'Legendary wireless gaming mouse with HERO 25K sensor.',
    category: 'MOUSE',
    pricing: { price: 149.99, discount: 0, currency: 'USD' },
    specifications: {
      dpi: 25600,
      wireless: true,
      weight: 114,
      sensor: 'HERO 25K'
    },
    compatibility: {},
    inventory: { quantity: 50, reserved: 0 },
    media: { images: ['/images/g502.jpg'] },
    builderReady: true,
  },
  {
    title: 'Razer DeathAdder V3 Wired',
    slug: 'razer-deathadder-v3',
    brand: 'Razer',
    description: 'Ultra-lightweight ergonomic wired gaming mouse.',
    category: 'MOUSE',
    pricing: { price: 69.99, discount: 0, currency: 'USD' },
    specifications: {
      dpi: 30000,
      wireless: false,
      weight: 59,
      sensor: 'Focus Pro 30K'
    },
    compatibility: {},
    inventory: { quantity: 40, reserved: 0 },
    media: { images: ['/images/deathadder-v3.jpg'] },
    builderReady: true,
  },

  // ─── HEADPHONES ────────────────────────────────────
  {
    title: 'SteelSeries Arctis Nova Pro Wireless',
    slug: 'steelseries-arctis-nova-pro',
    brand: 'SteelSeries',
    description: 'Premium multi-system wireless gaming headset with ANC.',
    category: 'HEADPHONES',
    pricing: { price: 349.99, discount: 0, currency: 'USD' },
    specifications: {
      wireless: true,
      microphone: true,
      surround: true,
      impedance: 38
    },
    compatibility: {},
    inventory: { quantity: 15, reserved: 0 },
    media: { images: ['/images/arctis-nova-pro.jpg'] },
    builderReady: true,
  },
  {
    title: 'HyperX Cloud II Wired',
    slug: 'hyperx-cloud-ii',
    brand: 'HyperX',
    description: 'Classic gaming headset with virtual 7.1 surround sound.',
    category: 'HEADPHONES',
    pricing: { price: 79.99, discount: 0, currency: 'USD' },
    specifications: {
      wireless: false,
      microphone: true,
      surround: true,
      impedance: 60
    },
    compatibility: {},
    inventory: { quantity: 65, reserved: 0 },
    media: { images: ['/images/cloud-ii.jpg'] },
    builderReady: true,
  }
];

const importData = async () => {
  try {
    await connectDB();

    console.log('Clearing old product data...');
    await Product.deleteMany();

    console.log('Inserting new seed data...');
    await Product.insertMany(seedProducts);

    console.log(`Data Imported Successfully! (${seedProducts.length} products)`);
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

importData();
