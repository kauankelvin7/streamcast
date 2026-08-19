import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Navigate, useRouteError } from 'react-router-dom';

const CatalogPage     = lazy(() => import('@features/catalog/components/CatalogPanel'));
const PlayerPage      = lazy(() => import('@features/player/pages/PlayerPage'));
const EmbedPlayerPage = lazy(() => import('@features/player/pages/EmbedPlayerPage'));

function GlobalError() {
  const error = useRouteError() as Error;
  
  // Auto-reload para erros de chunks (Failed to fetch dynamically imported module)
  // Isso acontece quando um usuário está com o site aberto e o desenvolvedor faz um novo deploy
  if (error && error.message && error.message.includes('Failed to fetch dynamically imported module')) {
    if (!sessionStorage.getItem('chunk_reload')) {
      sessionStorage.setItem('chunk_reload', 'true');
      window.location.reload();
      return null;
    }
  }

  // Limpa o session storage se não for erro de chunk
  sessionStorage.removeItem('chunk_reload');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100vw', height: '100vh', background: '#0a0a0c', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Ops, algo deu errado!</h2>
      <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 24, textAlign: 'center', maxWidth: 400 }}>
        Parece que recebemos uma atualização no sistema ou ocorreu um problema inesperado.
      </p>
      <button 
        onClick={() => window.location.reload()}
        style={{ padding: '12px 24px', background: '#E5591D', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 600, cursor: 'pointer' }}
      >
        Recarregar Página
      </button>
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: '/',
    errorElement: <GlobalError />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={null}><CatalogPage /></Suspense>
        ),
      },
      {
        path: 'watch/:type/:tmdbId',
        element: (
          <Suspense fallback={null}><PlayerPage /></Suspense>
        ),
      },
      {
        path: 'embed',
        element: (
          <Suspense fallback={<div style={{ background: '#000', width: '100vw', height: '100vh' }} />}>
            <EmbedPlayerPage />
          </Suspense>
        ),
      },
      {
        path: 'embed-sync',
        element: (
          <Suspense fallback={<div style={{ background: '#000', width: '100vw', height: '100vh' }} />}>
            <EmbedPlayerPage />
          </Suspense>
        ),
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ]
  }
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
