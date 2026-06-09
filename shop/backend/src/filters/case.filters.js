module.exports = [
  { key: 'brand', label: 'Brand', type: 'checkbox', field: 'brand' },
  { key: 'price', label: 'Price', type: 'range', field: 'pricing.price' },
  { key: 'formFactor', label: 'Form Factor', type: 'checkbox', field: 'specifications.formFactor' },
  { key: 'supportedMotherboards', label: 'Supported Motherboards', type: 'multi-select', field: 'specifications.supportedMotherboards' },
  { key: 'maxGpuLength', label: 'Max GPU Length', type: 'checkbox', field: 'specifications.maxGpuLength' },
  { key: 'color', label: 'Color', type: 'checkbox', field: 'specifications.color' },
  { key: 'radiatorSupport', label: 'Radiator Support', type: 'multi-select', field: 'specifications.radiatorSupport' },
];
