const CategoryBlueprint = require('../models/CategoryBlueprint');

const handleError = (res, error) => {
  console.error("[BLUEPRINT ERROR]", error);
  if (error.name === 'ValidationError') {
    return res.status(400).json({ 
      success: false, 
      message: 'Validation failed', 
      errors: error.errors 
    });
  }
  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      type: "DUPLICATE_BLUEPRINT",
      message: "Blueprint already exists"
    });
  }
  res.status(500).json({ success: false, message: error.message });
};

const getCategories = async (req, res) => {
  try {
    const categories = await CategoryBlueprint.find({}).sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    handleError(res, error);
  }
};

const getCategoryById = async (req, res) => {
  try {
    const category = await CategoryBlueprint.findById(req.params.id);
    if (category) {
      res.json(category);
    } else {
      res.status(404).json({ success: false, message: 'Blueprint not found' });
    }
  } catch (error) {
    handleError(res, error);
  }
};

const createCategory = async (req, res) => {
  try {
    console.log("[BACKEND BODY]", JSON.stringify(req.body, null, 2));
    const category = new CategoryBlueprint(req.body);
    const createdCategory = await category.save();
    res.status(201).json(createdCategory);
  } catch (error) {
    handleError(res, error);
  }
};

const createDemoGpuBlueprint = async (req, res) => {
  try {
    console.log("[BACKEND BODY] Generating Demo GPU Blueprint");
    
    let existing = await CategoryBlueprint.findOne({ slug: 'gpu-blueprint' });
    if (existing) {
      return res.status(200).json({
        success: true,
        alreadyExists: true,
        blueprint: existing
      });
    }

    const demoGpu = new CategoryBlueprint({
      name: "GPU Blueprint",
      slug: "gpu-blueprint",
      icon: "gpu",
      description: "GPU specification template",
      productType: "GPU",
      builderReady: true,
      specifications: [
        {
          label: "VRAM",
          key: "vram",
          type: "Text",
          required: true,
          placeholder: "12GB",
          options: [],
          unit: "GB",
          group: "Memory"
        }
      ],
      compatibilityCards: [
        {
          title: "Recommended PSU",
          icon: "zap",
          type: "tags",
          items: ["650W", "750W"],
          description: "Recommended PSU wattage"
        }
      ],
      fieldGroups: ["Memory", "Power"]
    });

    const createdCategory = await demoGpu.save();
    res.status(201).json(createdCategory);
  } catch (error) {
    handleError(res, error);
  }
};

const updateCategory = async (req, res) => {
  try {
    const category = await CategoryBlueprint.findById(req.params.id);

    if (category) {
      Object.assign(category, req.body);
      const updatedCategory = await category.save();
      res.json(updatedCategory);
    } else {
      res.status(404).json({ success: false, message: 'Blueprint not found' });
    }
  } catch (error) {
    handleError(res, error);
  }
};

const deleteCategory = async (req, res) => {
  try {
    const category = await CategoryBlueprint.findById(req.params.id);

    if (category) {
      await CategoryBlueprint.deleteOne({ _id: category._id });
      res.json({ success: true, message: 'Blueprint removed' });
    } else {
      res.status(404).json({ success: false, message: 'Blueprint not found' });
    }
  } catch (error) {
    handleError(res, error);
  }
};

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  createDemoGpuBlueprint,
  updateCategory,
  deleteCategory,
};
