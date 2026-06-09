import React from 'react';
import Link from 'next/link';
import { Edit, Trash2, Eye, Copy } from 'lucide-react';
import { ProductStatusBadge } from './ProductStatusBadge';

export const ProductsTable = ({ products, onDelete }: { products: any[], onDelete: (id: string) => void }) => {
  return (
    <div className="overflow-x-auto w-full">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-100 text-sm text-gray-500 bg-gray-50/50">
            <th className="py-4 px-6 font-medium">Product</th>
            <th className="py-4 px-6 font-medium">Category</th>
            <th className="py-4 px-6 font-medium">Price</th>
            <th className="py-4 px-6 font-medium">Stock</th>
            <th className="py-4 px-6 font-medium">Status</th>
            <th className="py-4 px-6 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {products.map((product) => (
            <tr key={product._id} className="hover:bg-gray-50/50 transition-colors group">
              <td className="py-4 px-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex-shrink-0 border border-gray-200 overflow-hidden">
                    {product.images && product.images.length > 0 ? (
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No img</div>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 line-clamp-1">{product.name || product.title}</p>
                    <p className="text-xs text-gray-500">{product.slug}</p>
                  </div>
                </div>
              </td>
              <td className="py-4 px-6 text-sm text-gray-600">{product.category}</td>
              <td className="py-4 px-6">
                <p className="text-sm font-medium text-gray-900">${product.price}</p>
                {product.oldPrice && <p className="text-xs text-gray-400 line-through">${product.oldPrice}</p>}
              </td>
              <td className="py-4 px-6">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${product.stock > 10 ? 'bg-green-500' : product.stock > 0 ? 'bg-yellow-500' : 'bg-red-500'}`} />
                  <span className="text-sm text-gray-600">{product.stock} in stock</span>
                </div>
              </td>
              <td className="py-4 px-6">
                <ProductStatusBadge status={product.status || 'draft'} />
              </td>
              <td className="py-4 px-6 text-right">
                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link href={`/AWIS/products/edit/${product._id}`} className="p-2 text-gray-400 hover:text-[var(--color-primary)] transition-colors rounded-lg hover:bg-blue-50" title="Edit">
                    <Edit size={16} />
                  </Link>
                  <a href={`http://localhost:3000/products/${product.slug}`} target="_blank" rel="noreferrer" className="p-2 text-gray-400 hover:text-green-600 transition-colors rounded-lg hover:bg-green-50" title="Preview">
                    <Eye size={16} />
                  </a>
                  <button onClick={() => onDelete(product._id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50" title="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {products.length === 0 && (
            <tr>
              <td colSpan={6} className="py-12 text-center text-gray-500">No products found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
