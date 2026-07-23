import { useEffect, useRef, useState } from 'react';
import { Bell, ChevronDown, LogOut, Menu, Search, User } from 'lucide-react';

type Props = {
  title: string;
  subtitle?: string;
  onOpenSidebar: () => void;
};

export function Header({ title, subtitle, onOpenSidebar }: Props) {
  const [openDropdown, setOpenDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  return (
    <header className="sticky top-0 z-20 glass-header">
      <div className="flex items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold text-gray-900 sm:text-lg">
            {title}
          </h1>
          {subtitle && (
            <p className="truncate text-xs text-gray-500">{subtitle}</p>
          )}
        </div>

        <div className="hidden items-center gap-2 rounded-full glass-input px-3 py-1.5 md:flex">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            className="w-40 border-0 bg-transparent text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-0 lg:w-56"
            placeholder="Buscar em dashboards..."
          />
        </div>

        <button
          type="button"
          className="relative rounded-full glass-button p-2 text-gray-600"
          aria-label="Notificacoes"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-danger ring-2 ring-white" />
        </button>

        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            onClick={() => setOpenDropdown((v) => !v)}
            className="flex items-center gap-2 rounded-full glass-button py-1 pl-1 pr-2.5"
            aria-haspopup
            aria-expanded={openDropdown}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-fmp-light to-fmp text-2xs font-semibold text-white">
              FM
            </span>
            <span className="hidden text-xs font-medium text-gray-700 sm:inline">
              Equipe FMP
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
          </button>

          {openDropdown && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl glass-dropdown p-2 animate-slide-up">
              <div className="px-3 py-2">
                <p className="text-sm font-semibold text-gray-900">Equipe FMP</p>
                <p className="text-2xs text-gray-500">analytics@fmp.edu.br</p>
              </div>
              <div className="my-1 border-t border-gray-100" />
              <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-gray-700 hover:bg-gray-100">
                <User className="h-3.5 w-3.5" /> Meu perfil
              </button>
              <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-danger-dark hover:bg-danger-light">
                <LogOut className="h-3.5 w-3.5" /> Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
