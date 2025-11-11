import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Tabs, Alert, Button } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';
import axios from 'axios';
import CompanyList from './components/CompanyList';
import UsineList from './components/UsineList';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import { fetchConstruction, fetchFournisseur, fetchUsines } from './services/api';
import './App.css';

function AppContent() {
  const [isBackendOnline, setIsBackendOnline] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const { logout } = useAuth();

  useEffect(() => {
    checkBackend();
    // Check backend status every 5 seconds
    const interval = setInterval(checkBackend, 5000);
    return () => clearInterval(interval);
  }, []);

  const checkBackend = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://51.68.172.145:4000';
      const response = await axios.get(`${apiUrl}/health`, {
        timeout: 3000,
      });
      setIsBackendOnline(response.status === 200);
    } catch (error) {
      setIsBackendOnline(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
          <div>
            <h1>🏗️ Recherche d'Entreprises de Construction en Tunisie</h1>
            <p className="subtitle">Trouvez des entreprises de construction et des fournisseurs en Tunisie</p>
          </div>
          <Button
            type="primary"
            danger
            icon={<LogoutOutlined />}
            onClick={logout}
            style={{ marginLeft: '20px' }}
          >
            Déconnexion
          </Button>
        </div>
        {isBackendOnline === false && (
          <Alert
            message="Le serveur backend n'est pas en cours d'exécution"
            description="Veuillez démarrer le serveur sur le port 4000"
            type="warning"
            showIcon
            style={{ marginTop: 16, maxWidth: 600, margin: '16px auto 0' }}
          />
        )}
        {isBackendOnline === true && (
          <Alert
            message="Le serveur backend est connecté"
            type="success"
            showIcon
            style={{ marginTop: 16, maxWidth: 600, margin: '16px auto 0' }}
          />
        )}
      </header>

      <main className="app-main">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          type="card"
          size="large"
          style={{
            background: 'transparent',
          }}
          items={[
            {
              key: 'dashboard',
              label: (
                <span style={{ fontSize: '16px', fontWeight: 500 }}>
                  📊 Dashboard
                </span>
              ),
              children: <Dashboard active={activeTab === 'dashboard'} />,
            },
            {
              key: 'construction',
              label: (
                <span style={{ fontSize: '16px', fontWeight: 500 }}>
                  🏗️ Entreprises de Construction
                </span>
              ),
              children: (
                <CompanyList
                  fetchFunction={fetchConstruction}
                  category="construction"
                  active={activeTab === 'construction'}
                />
              ),
            },
            {
              key: 'fournisseur',
              label: (
                <span style={{ fontSize: '16px', fontWeight: 500 }}>
                  📦 Entreprises Fournisseurs
                </span>
              ),
              children: (
                <CompanyList
                  fetchFunction={fetchFournisseur}
                  category="fournisseur"
                  active={activeTab === 'fournisseur'}
                />
              ),
            },
            {
              key: 'usine',
              label: (
                <span style={{ fontSize: '16px', fontWeight: 500 }}>
                  🏭 Usines
                </span>
              ),
              children: (
                <UsineList
                  fetchFunction={fetchUsines}
                  active={activeTab === 'usine'}
                />
              ),
            },
          ]}
        />
      </main>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppContent />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
