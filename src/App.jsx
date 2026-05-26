import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from './components/Layout';
import Overview from './pages/Overview';
import Territorios from './pages/Territorios';

import Condominios from './pages/Condominios';
import GeoSampa from './pages/GeoSampa';
import S13 from './pages/S13';
import Analise from './pages/Analise';
import ImportarDados from './pages/ImportarDados';
import Dashboard from './pages/Dashboard';
import Etiquetas from './pages/Etiquetas';
import MapaInterativo from './pages/MapaInterativo';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Overview />} />
        <Route path="/territorios" element={<Territorios />} />

        <Route path="/condominios" element={<Condominios />} />
        <Route path="/geosampa" element={<GeoSampa />} />
        <Route path="/s13" element={<S13 />} />
        <Route path="/analise" element={<Analise />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/etiquetas" element={<Etiquetas />} />
        <Route path="/mapa" element={<MapaInterativo />} />
        <Route path="/importar" element={<ImportarDados />} />
        <Route path="*" element={<PageNotFound />} />
      </Route>
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App