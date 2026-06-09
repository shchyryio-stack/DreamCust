import Link from 'next/link';

export default function OrderSuccessPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-32 flex flex-col items-center text-center">
      <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(34,197,94,0.3)]">
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
      </div>
      
      <h1 className="text-4xl sm:text-5xl font-extrabold text-[#1A1A1A] mb-4">Order Successful!</h1>
      <p className="text-xl text-gray-600 mb-8 font-medium">Thank you for your purchase. Your hardware is getting ready for shipment.</p>
      
      <div className="bg-white border border-gray-200 p-6 rounded-2xl w-full max-w-md shadow-sm mb-10">
        <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-2">Order Number</p>
        <p className="text-2xl font-mono font-bold text-[#1E6FE8]">#{Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link href="/account" className="bg-[#1A1A1A] hover:bg-black text-white px-8 py-4 rounded-xl font-bold transition-all shadow-md">
          Go to Profile
        </Link>
        <Link href="/products" className="bg-white border border-gray-200 text-[#1A1A1A] hover:border-[#1E6FE8] hover:text-[#1E6FE8] px-8 py-4 rounded-xl font-bold transition-all shadow-sm">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
