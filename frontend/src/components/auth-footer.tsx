export function AuthFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="flex flex-col items-center py-6 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2 text-hcmus-gray text-xs">
          &copy; {year} HCMUS Faculty of Physics. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
