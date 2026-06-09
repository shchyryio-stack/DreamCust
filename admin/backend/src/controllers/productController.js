const mongoose = require('mongoose');
const { getShopDb } = require('../config/db');
const productSchema = require('../models/ProductSchema');

const getProductModel = () => {
  const shopDb = getShopDb();
  return shopDb.model('Product', productSchema);
};

// ── Slugify Color Suffix Helper ──
const generateVariantSlug = (baseSlug, colorName) => {
  if (!baseSlug) return '';
  const cleanColor = (colorName || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${baseSlug}-${cleanColor}`;
};

// ── Payload Validator Helper ──
const validatePayload = (body) => {
  const { title, slug, description, category, variants } = body;
  if (!title || !slug || !description || !category) {
    return 'Title, slug, description, and category are required.';
  }
  if (!variants || !Array.isArray(variants) || variants.length === 0) {
    return 'At least one variant is required.';
  }
  for (const variant of variants) {
    if (!variant.colorName || !variant.colorHex) {
      return 'Each variant must have a colorName and colorHex.';
    }
  }
  return null;
};

// ── Specifications Normalizer Helper ──
const normalizeSpecsForProductType = (specs = {}, productType = '') => {
  const type = productType.toLowerCase();
  const normalized = { ...specs };

  // Helper to extract a number from a string (e.g. "491 mm" -> 491, "65 W" -> 65)
  const parseNum = (val) => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      const match = val.match(/([\d.]+)/);
      if (match) return parseFloat(match[1]);
    }
    return undefined;
  };

  // Helper to extract boolean
  const parseBool = (val) => {
    if (typeof val === 'boolean') return val;
    if (typeof val === 'string') return val.toLowerCase() === 'yes' || val.toLowerCase() === 'true';
    return false;
  };

  // Helper to map checklist objects to arrays of strings
  const mapChecklistToArray = (obj, mapping) => {
    if (Array.isArray(obj)) return obj;
    if (obj && typeof obj === 'object') {
      const arr = [];
      Object.keys(obj).forEach(key => {
        if (obj[key] === 'Yes' || obj[key] === true || obj[key] === 'true') {
          const mapped = mapping[key] || key;
          arr.push(mapped);
        }
      });
      return arr;
    }
    return [];
  };

  if (type === 'cpu') {
    normalized.cores = parseNum(specs.cores || specs.physicalSpecifications?.cores || specs.performanceSpecifications?.cores);
    normalized.threads = parseNum(specs.threads || specs.performanceSpecifications?.threads);
    normalized.tdp = parseNum(specs.tdp || specs.powerSpecifications?.tdp || specs.powerSpecifications?.thermalDesignPower);
    normalized.integratedGraphics = parseBool(specs.integratedGraphics || specs.graphicsSpecifications?.integratedGraphics || specs.integratedGraphicsEnabled);
    normalized.socket = specs.socket || specs.compatibilitySpecifications?.socket || specs.socketType;
  }
  else if (type === 'gpu') {
    normalized.chipset = specs.chipset || specs.gpuSpecifications?.chipset || specs.gpuSpecifications?.gpuChipset;
    normalized.vram = specs.vram || specs.memorySpecifications?.vram || specs.memorySpecifications?.memorySize;
    normalized.boostClock = parseNum(specs.boostClock || specs.performanceSpecifications?.boostClock || specs.clockSpeeds?.boostClock);
    normalized.tdp = parseNum(specs.tdp || specs.powerSpecifications?.tdp || specs.powerSpecifications?.totalBoardPower);
  }
  else if (type === 'motherboard') {
    normalized.socket = specs.socket || specs.cpuSupport?.socketType || specs.cpuSupport?.socket;
    normalized.chipset = specs.chipset || specs.chipsetSpecifications?.chipset || specs.chipset;
    normalized.formFactor = specs.formFactor || specs.generalSpecifications?.formFactor || specs.generalSpecifications?.caseType;
    normalized.memoryType = specs.memoryType || specs.memorySupport?.memoryType || specs.memorySupport?.generation;
  }
  else if (type === 'ram') {
    normalized.capacity = specs.capacity || specs.generalSpecifications?.capacity || specs.memorySpecifications?.capacity;
    normalized.generation = specs.generation || specs.generalSpecifications?.memoryType || specs.generalSpecifications?.generation;
    normalized.frequency = parseNum(specs.frequency || specs.generalSpecifications?.frequency || specs.speedSpecifications?.frequency);
    normalized.latency = specs.latency || specs.timingSpecifications?.casLatency || specs.casLatency;
    normalized.rgb = parseBool(specs.rgb || specs.aesthetics?.rgb || specs.rgbLighting);
  }
  else if (type === 'storage') {
    normalized.type = specs.type || specs.generalSpecifications?.driveType || specs.driveType;
    normalized.interface = specs.interface || specs.performanceSpecifications?.interface || specs.interfaceType;
    normalized.capacity = specs.capacity || specs.generalSpecifications?.capacity;
    normalized.readSpeed = parseNum(specs.readSpeed || specs.performanceSpecifications?.sequentialReadSpeed || specs.readSpeed);
    normalized.writeSpeed = parseNum(specs.writeSpeed || specs.performanceSpecifications?.sequentialWriteSpeed || specs.writeSpeed);
  }
  else if (type === 'case') {
    normalized.formFactor = specs.formFactor || specs.generalSpecifications?.caseType || specs.generalSpecifications?.formFactor || 'Mid Tower';
    normalized.color = specs.color || specs.generalSpecifications?.color || 'Black';
    normalized.maxGpuLength = parseNum(specs.maxGpuLength || specs.graphicsCardSupport?.maximumGpuLength);
    
    normalized.supportedMotherboards = mapChecklistToArray(
      specs.supportedMotherboards,
      {
        eatxSupport: 'E-ATX',
        atxSupport: 'ATX',
        microatxSupport: 'Micro-ATX',
        miniitxSupport: 'Mini-ITX'
      }
    );
    
    normalized.radiatorSupport = mapChecklistToArray(
      specs.radiatorSupport || specs.coolingSupport?.radiatorSupport || {},
      {
        rad120: '120mm',
        rad140: '140mm',
        rad240: '240mm',
        rad280: '280mm',
        rad360: '360mm',
        rad420: '420mm'
      }
    );
  }
  else if (type === 'psu') {
    normalized.wattage = parseNum(specs.wattage || specs.powerSpecifications?.wattage || specs.generalSpecifications?.wattage);
    normalized.efficiency = specs.efficiency || specs.generalSpecifications?.efficiencyRating || specs.efficiencyRating;
    normalized.modularity = specs.modularity || specs.generalSpecifications?.modularity || specs.modularityType;
  }
  else if (type === 'cooling') {
    normalized.type = specs.type || specs.generalSpecifications?.coolerType || specs.coolerType;
    normalized.radiatorSize = specs.radiatorSize || specs.generalSpecifications?.radiatorSize;
    normalized.supportedSockets = mapChecklistToArray(
      specs.supportedSockets || specs.compatibility?.supportedSockets || {},
      {
        lga1700: 'LGA1700',
        lga1200: 'LGA1200',
        lga115x: 'LGA115x',
        am5: 'AM5',
        am4: 'AM4',
        str5: 'sTR5'
      }
    );
  }
  else if (type === 'keyboard') {
    normalized.switchType = specs.switchType || specs.keySpecifications?.switchType;
    normalized.layout = specs.layout || specs.generalSpecifications?.layout;
    normalized.wireless = parseBool(specs.wireless || specs.connectivity?.wireless);
    normalized.rgb = parseBool(specs.rgb || specs.aesthetics?.rgbLighting || specs.rgb);
  }
  else if (type === 'mouse') {
    normalized.dpi = parseNum(specs.dpi || specs.sensorSpecifications?.maximumDpi || specs.maximumDpi);
    normalized.wireless = parseBool(specs.wireless || specs.connectivity?.wireless);
    normalized.weight = parseNum(specs.weight || specs.physicalSpecifications?.weightWithoutCable || specs.weight);
    normalized.sensor = specs.sensor || specs.sensorSpecifications?.sensorModel || specs.sensor;
  }
  else if (type === 'headphones') {
    normalized.wireless = parseBool(specs.wireless || specs.connectivity?.wireless);
    normalized.microphone = parseBool(specs.microphone || specs.generalSpecifications?.microphoneIncluded || specs.microphone);
    normalized.surround = parseBool(specs.surround || specs.audioSpecifications?.surroundSoundSupport || specs.surroundSound);
    normalized.impedance = parseNum(specs.impedance || specs.audioSpecifications?.impedance || specs.impedance);
  }

  return normalized;
};

// ── Payload Normalizer Helper ──
const normalizeProductPayload = async (body) => {
  const CategoryBlueprint = require('../models/CategoryBlueprint');
  
  // Resolve productType from CategoryBlueprint if blueprintId exists & is valid
  let resolvedProductType = '';
  if (body.blueprintId && mongoose.Types.ObjectId.isValid(body.blueprintId)) {
    const blueprint = await CategoryBlueprint.findById(body.blueprintId);
    if (blueprint) {
      resolvedProductType = blueprint.productType || '';
    }
  }

  // Base fields
  const title = (body.title || '').trim();
  const slug = (body.slug || '').trim().toLowerCase().replace(/[^a-z0-9-_]+/g, '-');
  const description = (body.description || '').trim();
  const category = (body.category || '').trim();
  const blueprintId = body.blueprintId && mongoose.Types.ObjectId.isValid(body.blueprintId) ? body.blueprintId : null;

  // Status & scheduling
  const status = body.status || 'Draft';
  const isScheduled = !!body.publishing?.publishAt;
  const publishAt = body.publishing?.publishAt ? new Date(body.publishing.publishAt) : null;

  // Specifications (Mixed object)
  const specifications = normalizeSpecsForProductType(body.specifications || {}, resolvedProductType || category);

  // Highlights
  const highlights = (body.highlights || []).map((h, i) => ({
    id: h.id || `hl-${Date.now()}-${i}`,
    title: (h.title || '').trim(),
    description: (h.description || '').trim(),
    icon: (h.icon || '').trim()
  }));

  // Compatibility
  const compatibility = (body.compatibility || []).map((c, i) => ({
    id: c.id || `card-${Date.now()}-${i}`,
    title: (c.title || '').trim(),
    tags: (c.tags || []).map((t, ti) => ({
      id: t.id || `tag-${Date.now()}-${ti}`,
      label: (t.label || '').trim(),
      color: (t.color || '').trim()
    }))
  }));

  // Global Media
  const media = {
    models: (body.media?.models || []).map(m => String(m).trim()),
    videos: (body.media?.videos || []).map(v => String(v).trim()),
    documents: (body.media?.documents || []).map(d => String(d).trim())
  };

  // Color Variants
  const variants = (body.variants || []).map((v, i) => {
    const colorNameClean = (v.colorName || '').trim();
    const variantSlug = generateVariantSlug(slug, colorNameClean);

    // Map gallery images
    const rawImages = v.gallery || v.images || [];
    const gallery = rawImages.map((img, orderIndex) => ({
      url: (img.url || '').trim(),
      isPrimary: img.isPrimary === true || img.isPrimary === 'true',
      order: typeof img.order === 'number' ? img.order : orderIndex
    }));

    // Map warehouses
    const warehouses = (v.inventory?.warehouses || []).map((w, wi) => ({
      id: w.id || `wh-${Date.now()}-${wi}`,
      name: (w.name || '').trim(),
      quantity: Math.max(0, parseInt(w.quantity, 10) || 0),
      reserved: Math.max(0, parseInt(w.reserved, 10) || 0)
    }));

    const variantQty = warehouses.reduce((sum, w) => sum + w.quantity, 0);

    // Map discounts
    const discounts = (v.discounts || []).map((d, di) => {
      const discountVal = Math.min(99, Math.max(0, parseFloat(d.value) || 0));
      return {
        id: d.id || `disc-${Date.now()}-${di}`,
        name: (d.name || '').trim(),
        value: discountVal,
        startDate: d.startDate ? new Date(d.startDate) : null,
        endDate: d.endDate ? new Date(d.endDate) : null,
        isEnabled: d.isEnabled === true || d.isEnabled === 'true'
      };
    });

    return {
      id: v.id || `var-${Date.now()}-${i}`,
      colorName: colorNameClean,
      colorHex: (v.colorHex || '#000000').trim(),
      slug: variantSlug,
      gallery,
      pricing: {
        price: Math.max(0, parseFloat(v.pricing?.price) || 0)
      },
      inventory: {
        quantity: variantQty,
        warehouses
      },
      discounts
    };
  });

  // Preserve default / passthrough metadata
  const rating = typeof body.rating === 'number' ? body.rating : 0;
  const numReviews = typeof body.numReviews === 'number' ? body.numReviews : 0;
  const featured = body.featured === true || body.featured === 'true';
  const badges = (body.badges || []).map(b => String(b).trim());

  // ─── DERIVED COMPATIBILITY FIELDS FOR SHOP BACKEND ───
  // Derive brand from specifications or fallback to brand/Manufacturer/category
  const brand = (
    specifications.brand ||
    specifications.manufacturer ||
    specifications.Manufacturer ||
    specifications.brandName ||
    body.brand ||
    ''
  ).trim();

  // Derive pricing from the first variant
  const firstVariant = variants[0];
  const basePrice = firstVariant?.pricing?.price || 0;
  const activeDiscount = firstVariant?.discounts?.find(d => {
    if (!d.isEnabled) return false;
    const now = new Date();
    if (d.startDate && new Date(d.startDate) > now) return false;
    if (d.endDate && new Date(d.endDate) < now) return false;
    return true;
  });
  const discountVal = activeDiscount ? activeDiscount.value : 0;
  const finalPrice = discountVal > 0 ? basePrice * (1 - discountVal / 100) : basePrice;
  const oldPriceVal = discountVal > 0 ? basePrice : undefined;

  // Derive global media images and thumbnail
  const primaryVariant = variants.find(v => v.gallery?.some(img => img.isPrimary)) || firstVariant;
  const variantImages = (primaryVariant?.gallery || []).map(img => img.url).filter(Boolean);
  const globalImages = variantImages.length > 0 ? variantImages : (body.images || []);
  const thumbnail = primaryVariant?.gallery?.find(img => img.isPrimary)?.url || globalImages[0] || '';

  // Derive total inventory
  let totalQuantity = 0;
  let totalReserved = 0;
  variants.forEach(v => {
    (v.inventory?.warehouses || []).forEach(w => {
      totalQuantity += w.quantity || 0;
      totalReserved += w.reserved || 0;
    });
  });

  const inStock = variants.some(v => v.inventory.quantity > 0);

  return {
    title,
    slug,
    description,
    category,
    blueprintId,
    productType: resolvedProductType,
    status,
    publishing: {
      isScheduled,
      publishAt
    },
    specifications,
    highlights,
    compatibility,
    variants,
    rating,
    numReviews,
    featured,
    badges,
    // Add derived fields for shop compatibility
    brand,
    price: finalPrice,
    oldPrice: oldPriceVal,
    pricing: {
      price: finalPrice,
      discount: discountVal,
      currency: 'USD'
    },
    images: globalImages,
    thumbnail,
    media: {
      ...media,
      images: globalImages,
      thumbnail
    },
    inventory: {
      quantity: totalQuantity,
      reserved: totalReserved,
      incoming: 0,
      sold: 0,
      warehouseLocation: ''
    },
    computed: {
      inStock,
      totalQuantity
    }
  };
};

// ── Create Product ──
const createProduct = async (req, res) => {
  try {
    const Product = getProductModel();

    // Validate payload
    const valError = validatePayload(req.body);
    if (valError) {
      return res.status(400).json({ message: valError });
    }

    const { slug } = req.body;

    // Check slug uniqueness
    const existingProduct = await Product.findOne({ slug: slug.trim().toLowerCase() });
    if (existingProduct) {
      return res.status(400).json({ message: `A product with slug "${slug}" already exists.` });
    }

    // Build complete normalized product structure
    const normalizedPayload = await normalizeProductPayload(req.body);

    const product = new Product(normalizedPayload);
    const savedProduct = await product.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Server error while creating product.', error: error.message });
  }
};

// ── Update Product ──
const updateProduct = async (req, res) => {
  try {
    const Product = getProductModel();
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    // Validate payload
    const valError = validatePayload(req.body);
    if (valError) {
      return res.status(400).json({ message: valError });
    }

    // Check slug uniqueness (excluding current ID)
    const slugClean = (req.body.slug || '').trim().toLowerCase();
    if (slugClean && slugClean !== product.slug) {
      const existingProduct = await Product.findOne({
        slug: slugClean,
        _id: { $ne: product._id }
      });
      if (existingProduct) {
        return res.status(400).json({ message: `A product with slug "${req.body.slug}" already exists.` });
      }
    }

    // Build complete normalized product structure
    const normalizedPayload = await normalizeProductPayload(req.body);

    // Overwrite the existing document with the complete new structure
    product.overwrite(normalizedPayload);
    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Server error while updating product.', error: error.message });
  }
};

// ── Delete Product ──
const deleteProduct = async (req, res) => {
  try {
    const Product = getProductModel();
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    await Product.deleteOne({ _id: product._id });
    res.json({ message: 'Product deleted successfully.' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Server error while deleting product.', error: error.message });
  }
};

// ── Get All Products ──
const getProducts = async (req, res) => {
  try {
    const Product = getProductModel();
    const products = await Product.find({}).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Server error while fetching products.', error: error.message });
  }
};

// ── Get Product By ID ──
const getProductById = async (req, res) => {
  try {
    const Product = getProductModel();
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Server error while fetching product.', error: error.message });
  }
};

module.exports = {
  createProduct,
  updateProduct,
  deleteProduct,
  getProducts,
  getProductById
};
