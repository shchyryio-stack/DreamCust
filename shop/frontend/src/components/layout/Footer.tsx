export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 mt-12 py-8">
      <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
        <p>&copy; {new Date().getFullYear()} RigCraft. All rights reserved.</p>
      </div>
    </footer>
  );
}
