import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Film, 
  Upload, 
  Users, 
  TrendingUp, 
  PlayCircle, 
  Database,
  Search,
  Plus,
  MoreVertical,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Badge } from '@shared/components';

/**
 * Premium Admin Panel for Streamcast
 * Features: Dashboard, Content Management, Upload, User Management
 */
export const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'content' | 'upload' | 'users'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'content', label: 'Conteúdo', icon: Film },
    { id: 'upload', label: 'Upload', icon: Upload },
    { id: 'users', label: 'Usuários', icon: Users },
  ];

  const stats = [
    { label: 'Total de Vídeos', value: '1,284', icon: PlayCircle, trend: '+12%', color: 'text-brand-primary' },
    { label: 'Usuários Ativos', value: '45.2k', icon: Users, trend: '+5.4%', color: 'text-status-success' },
    { label: 'Horas Assistidas', value: '12.8k', icon: TrendingUp, trend: '+18%', color: 'text-brand-secondary' },
    { label: 'Armazenamento', value: '1.2 TB', icon: Database, trend: '85%', color: 'text-status-warning' },
  ];

  return (
    <div className="min-h-screen bg-bg-main text-text-primary flex">
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -240 }}
            animate={{ x: 0 }}
            exit={{ x: -240 }}
            className="fixed lg:relative z-40 w-64 h-screen bg-bg-card border-r border-border flex flex-col"
          >
            <div className="p-6 flex items-center gap-3">
              <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center font-bold italic">S</div>
              <span className="font-bold tracking-tighter text-xl">STREAMCAST</span>
              <Badge variant="info" size="sm" className="ml-auto">ADMIN</Badge>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-2">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    activeTab === item.id 
                      ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20' 
                      : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary border border-transparent'
                  }`}
                >
                  <item.icon size={20} />
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="p-4 border-t border-border">
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-text-muted hover:text-status-error hover:bg-status-error/5 transition-all">
                <LogOut size={20} />
                Sair do Painel
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto custom-scrollbar">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-bg-main/80 backdrop-blur-md border-b border-border px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-text-secondary hover:text-text-primary transition-colors lg:hidden"
            >
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h1 className="text-xl font-bold capitalize">{activeTab}</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
              <input 
                type="text" 
                placeholder="Buscar no painel..." 
                className="bg-bg-hover border border-border rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:border-brand-primary/50 transition-colors w-64"
              />
            </div>
            <Button variant="primary" size="sm" leftIcon={<Plus size={16} />}>
              Novo Item
            </Button>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-8">
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                  <div key={stat.label} className="bg-bg-card border border-border p-6 rounded-xl hover:border-brand-primary/30 transition-all group">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-lg bg-bg-hover ${stat.color} group-hover:scale-110 transition-transform`}>
                        <stat.icon size={24} />
                      </div>
                      <span className="text-status-success text-xs font-bold">{stat.trend}</span>
                    </div>
                    <p className="text-text-muted text-sm font-medium">{stat.label}</p>
                    <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                  </div>
                ))}
              </div>

              {/* Chart Placeholder */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-bg-card border border-border rounded-xl p-6 min-h-[400px]">
                  <h3 className="font-bold mb-6">Visualizações por Dia (Últimos 7 dias)</h3>
                  <div className="w-full h-full flex items-center justify-center text-text-muted italic">
                    Área reservada para o gráfico (Recharts)
                  </div>
                </div>
                <div className="bg-bg-card border border-border rounded-xl p-6">
                  <h3 className="font-bold mb-6">Principais Gêneros</h3>
                  <div className="space-y-4">
                    {['Ação', 'Drama', 'Comédia', 'Documentário'].map((genre, i) => (
                      <div key={genre} className="space-y-2">
                        <div className="flex justify-between text-xs font-bold">
                          <span>{genre}</span>
                          <span className="text-text-muted">{85 - i * 15}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-bg-hover rounded-full overflow-hidden">
                          <div className="h-full bg-brand-primary" style={{ width: `${85 - i * 15}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Activity Table Placeholder */}
              <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
                <div className="p-6 border-b border-border flex justify-between items-center">
                  <h3 className="font-bold">Uploads Recentes</h3>
                  <Button variant="ghost" size="sm">Ver todos</Button>
                </div>
                <table className="w-full text-left">
                  <thead className="bg-bg-hover/50 text-text-muted text-xs uppercase tracking-widest font-bold">
                    <tr>
                      <th className="px-6 py-4">Conteúdo</th>
                      <th className="px-6 py-4">Tamanho</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Data</th>
                      <th className="px-6 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <tr key={i} className="hover:bg-bg-hover/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-bg-hover rounded border border-border" />
                            <span className="text-sm font-medium">Filme Exemplo #{i}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-text-muted">1.2 GB</td>
                        <td className="px-6 py-4">
                          <Badge variant="success" size="sm">Processado</Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-text-muted">há {i} horas</td>
                        <td className="px-6 py-4 text-right">
                          <button className="p-2 text-text-muted hover:text-text-primary transition-colors">
                            <MoreVertical size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'content' && (
            <div className="text-center py-20 text-text-muted animate-in fade-in duration-500">
              Gerenciamento de Conteúdo em desenvolvimento...
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="text-center py-20 text-text-muted animate-in fade-in duration-500">
              Upload em desenvolvimento...
            </div>
          )}

          {activeTab === 'users' && (
            <div className="text-center py-20 text-text-muted animate-in fade-in duration-500">
              Gerenciamento de Usuários em desenvolvimento...
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
