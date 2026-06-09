module.exports = [
  { key: 'brand', label: 'Brand', type: 'checkbox', field: 'brand' },
  { key: 'price', label: 'Price', type: 'range', field: 'pricing.price' },
  { key: 'type', label: 'Type', type: 'checkbox', field: 'specifications.type' },
  { key: 'radiatorSize', label: 'Radiator Size', type: 'checkbox', field: 'specifications.radiatorSize' },
  { key: 'supportedSockets', label: 'Supported Sockets', type: 'multi-select', field: 'specifications.supportedSockets' },
];
