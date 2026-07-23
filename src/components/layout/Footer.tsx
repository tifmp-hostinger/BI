export function Footer() {
  return (
    <footer className="border-t border-gray-200/70 bg-white/40 px-4 py-4 text-center sm:px-6 lg:px-8">
      <p className="text-2xs text-gray-500">
        FMP Analytics &middot; Central de Dashboards &middot;{' '}
        {new Date().getFullYear()}
      </p>
    </footer>
  );
}
