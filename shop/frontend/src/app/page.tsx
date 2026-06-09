import Link from 'next/link';

export default function Home() {
  

  return (
    <div className="max-w-7xl mx-auto px-4 py-20">
      <section className="flex flex-col items-center text-center mb-24">
        <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight text-[#1A1A1A] mb-6">
          Build Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1E6FE8] to-purple-500">Dream</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mb-12 font-medium">
          Premium hardware. Flawless compatibility. Minimalist design. Experience the future of custom PC building.
        </p>
        <div className="flex gap-6">
          <Link href="/configurator" className="bg-[#1E6FE8] hover:bg-[#1557BE] text-white px-8 py-4 rounded-full font-semibold text-lg transition-all shadow-[0_8px_30px_rgb(30,111,232,0.3)] hover:shadow-[0_12px_40px_rgb(30,111,232,0.4)] hover:-translate-y-1">
            Open PC Builder
          </Link>
          <Link href="/products" className="bg-white hover:bg-gray-50 text-[#1A1A1A] px-8 py-4 rounded-full font-semibold text-lg transition-all shadow-[0_4px_20px_rgb(0,0,0,0.04)] border border-gray-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
            Explore Shop
          </Link>
        </div>
      </section>
    </div>
  );
}
