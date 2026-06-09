const mongoose = require('mongoose');

const blueprintSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  icon: { type: String },
  description: { type: String },
  productType: { type: String },
  specifications: [{
    label: { type: String },
    key: { type: String },
    type: { type: String, enum: ['Text', 'Number', 'Boolean', 'Select', 'Multi Select', 'Range', 'Color', 'Tag', 'List'], default: 'Text' },
    required: { type: Boolean, default: false },
    placeholder: { type: String },
    defaultValue: { type: mongoose.Schema.Types.Mixed },
    options: [{ type: String }],
    unit: { type: String },
    group: { type: String },
    children: [{
      label: { type: String },
      key: { type: String },
      type: { type: String, enum: ['Text', 'Number', 'Boolean', 'Select', 'Multi Select', 'Range', 'Color', 'Tag', 'List'], default: 'Text' },
      required: { type: Boolean, default: false },
      placeholder: { type: String },
      defaultValue: { type: mongoose.Schema.Types.Mixed },
      options: [{ type: String }],
      unit: { type: String }
    }]
  }],
  compatibilityCards: [{
    title: { type: String },
    icon: { type: String },
    type: { type: String },
    items: [{ type: String }],
    description: { type: String }
  }],
  fieldGroups: [{ type: String }],
  builderReady: { type: Boolean, default: false },
  status: { type: String, enum: ['Draft', 'Active', 'Deprecated', 'Experimental'], default: 'Active' },
  isArchived: { type: Boolean, default: false },
  version: { type: Number, default: 1 },
  createdBy: { type: String },
  updatedBy: { type: String }
}, { timestamps: true });

const CategoryBlueprint = mongoose.model('CategoryBlueprint', blueprintSchema, 'categoryBlueprints');
module.exports = CategoryBlueprint;
