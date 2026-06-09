const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String },
  icon: { type: String },
  specTemplates: [{
    name: { type: String, required: true },
    type: { type: String, enum: ['Text', 'Number', 'Boolean', 'Select', 'Multi Select', 'Range', 'Color', 'Tag', 'List'], default: 'Text' },
    required: { type: Boolean, default: false },
    options: [{ type: String }] // For Select/Multi Select
  }],
  compatibilityTemplates: [{
    title: { type: String, required: true },
    icon: { type: String },
    defaultDescription: { type: String }
  }]
}, { timestamps: true });

const Category = mongoose.model('Category', categorySchema);
module.exports = Category;
