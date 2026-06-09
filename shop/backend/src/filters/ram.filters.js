module.exports = [
  { key: 'brand', label: 'Brand', type: 'checkbox', field: 'brand' },
  { key: 'price', label: 'Price', type: 'range', field: 'pricing.price' },
  { key: 'capacity', label: 'Capacity', type: 'checkbox', field: 'specifications.capacity' },
  { key: 'generation', label: 'Generation', type: 'checkbox', field: 'specifications.generation' },
  { key: 'frequency', label: 'Frequency', type: 'checkbox', field: 'specifications.frequency' },
  { key: 'latency', label: 'Latency', type: 'checkbox', field: 'specifications.latency' },
  { key: 'rgb', label: 'RGB', type: 'boolean', field: 'specifications.rgb' },
];
