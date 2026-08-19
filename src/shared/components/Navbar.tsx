import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, User, Menu, X, LogOut, Settings, HelpCircle, Users, ChevronLeft } from 'lucide-react';
import { SearchBar } from './SearchBar';
import { Button } from './Button';

/**
 * Premium Navbar for Streamcast
 * Includes navigation, search, notifications, and profile
 */
export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<'notifications' | 'profile' | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Início', href: '/' },
    { label: 'Filmes', href: '/movies' },
    { label: 'Séries', href: '/series' },
    { label: 'Minha Lista', href: '/my-list' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-bg-main/95 backdrop-blur-md shadow-lg border-b border-white/5 py-2' : 'bg-transparent py-4'
      }`}
    >
      <div className="max-w-[1920px] mx-auto px-4 md:px-12 flex items-center justify-between">
        {/* Left: Logo & Nav Links */}
        <div className="flex items-center gap-10">
          <a href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center font-bold text-white italic">S</div>
            <span className="text-2xl font-bold tracking-tighter text-text-primary hidden md:block">STREAMCAST</span>
          </a>

          <div className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

        {/* Right: Search, Notifications, Profile */}
        <div className="flex items-center gap-4">
          <SearchBar className="hidden md:flex" />

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setActiveDropdown(activeDropdown === 'notifications' ? null : 'notifications')}
              className="p-2 text-text-secondary hover:text-text-primary transition-colors relative"
            >
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-status-error rounded-full border-2 border-bg-main" />
            </button>

            <AnimatePresence>
              {activeDropdown === 'notifications' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-80 bg-bg-card border border-border rounded-lg shadow-2xl overflow-hidden"
                >
                  <div className="p-4 border-b border-border flex justify-between items-center">
                    <h3 className="font-bold text-sm text-text-primary">Notificações</h3>
                    <button className="text-xs text-brand-primary hover:underline">Marcar todas como lidas</button>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="p-4 border-b border-border/50 hover:bg-bg-hover transition-colors cursor-pointer group">
                        <div className="flex gap-3">
                          <div className="w-10 h-10 rounded-md bg-brand-primary/10 flex items-center justify-center shrink-0">
                            <Users size={20} className="text-brand-primary" />
                          </div>
                          <div>
                            <p className="text-sm text-text-primary font-medium line-clamp-2">Nova série adicionada: The Continental</p>
                            <p className="text-xs text-text-muted mt-1">há 2 horas</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 text-center border-t border-border">
                    <button className="text-xs text-text-secondary hover:text-text-primary transition-colors">Ver todas</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => setActiveDropdown(activeDropdown === 'profile' ? null : 'profile')}
              className="flex items-center gap-2 p-1 pl-1 pr-2 rounded-full hover:bg-bg-hover transition-colors border border-transparent hover:border-border"
            >
              <div className="w-8 h-8 rounded-full bg-brand-primary/20 flex items-center justify-center overflow-hidden border border-brand-primary/40">
                <User size={18} className="text-brand-primary" />
              </div>
              <ChevronLeft className={`transition-transform duration-300 text-text-muted ${activeDropdown === 'profile' ? '-rotate-90' : 'rotate-0'}`} size={14} />
            </button>

            <AnimatePresence>
              {activeDropdown === 'profile' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-56 bg-bg-card border border-border rounded-lg shadow-2xl overflow-hidden"
                >
                  <div className="p-4 border-b border-border">
                    <p className="text-sm font-bold text-text-primary">Kauan</p>
                    <p className="text-xs text-text-muted truncate">kauan@example.com</p>
                  </div>
                  <div className="p-2">
                    <a href="/account" className="flex items-center gap-3 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded-md transition-colors">
                      <Settings size={16} /> Configurações
                    </a>
                    <a href="/help" className="flex items-center gap-3 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded-md transition-colors">
                      <HelpCircle size={16} /> Ajuda
                    </a>
                    <div className="h-px bg-border my-2" />
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-status-error hover:bg-status-error/10 rounded-md transition-colors">
                      <LogOut size={16} /> Sair
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-3/4 max-w-sm bg-bg-main z-50 lg:hidden p-6 flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between mb-10">
                <a href="/" className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center font-bold text-white italic">S</div>
                  <span className="text-2xl font-bold tracking-tighter text-text-primary">STREAMCAST</span>
                </a>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-text-muted">
                  <X size={24} />
                </button>
              </div>

              <div className="flex flex-col gap-6">
                {navLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="text-xl font-bold text-text-secondary hover:text-text-primary transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </div>

              <div className="mt-auto pt-10 border-t border-border space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-brand-primary/20 flex items-center justify-center border border-brand-primary/40">
                    <User size={24} className="text-brand-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-text-primary">Kauan</p>
                    <p className="text-sm text-text-muted">kauan@example.com</p>
                  </div>
                </div>
                <Button variant="secondary" className="w-full justify-start" leftIcon={<LogOut size={18} />}>
                  Sair da conta
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};
