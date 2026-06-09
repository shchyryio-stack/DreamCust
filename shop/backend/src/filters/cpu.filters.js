module.exports = [
  { key: 'brand', label: 'Brand', type: 'checkbox', field: 'brand' },
  { key: 'price', label: 'Price', type: 'range', field: 'pricing.price' },
  { key: 'socket', label: 'Socket', type: 'checkbox', field: 'specifications.socket' },
  { key: 'cores', label: 'Cores', type: 'checkbox', field: 'specifications.cores' },
  { key: 'threads', label: 'Threads', type: 'checkbox', field: 'specifications.threads' },
  { key: 'tdp', label: 'TDP', type: 'checkbox', field: 'specifications.tdp' },
  { key: 'integratedGraphics', label: 'Integrated Graphics', type: 'boolean', field: 'specifications.integratedGraphics' },
];
