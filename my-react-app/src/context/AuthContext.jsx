import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

// Use environment variable or fallback to production server
const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api`
  : 'http://51.68.172.145:4000/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Vérifier si l'utilisateur est authentifié au chargement
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          // Vérifier si le token est toujours valide
          const response = await axios.get(`${API_BASE_URL}/auth/verify`, {
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
          });
          
          if (response.data.success) {
            setToken(storedToken);
            setUser(response.data.user);
          } else {
            // Token invalide, supprimer du localStorage
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
          }
        } catch (error) {
          // Token invalide ou expiré
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (username, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        username,
        password,
      });

      if (response.data.success && response.data.token) {
        const newToken = response.data.token;
        setToken(newToken);
        setUser(response.data.user);
        localStorage.setItem('token', newToken);
        return { success: true };
      } else {
        return { success: false, error: 'Erreur lors de la connexion' };
      }
    } catch (error) {
      if (error.response) {
        return {
          success: false,
          error: error.response.data.message || 'Erreur lors de la connexion',
        };
      }
      return {
        success: false,
        error: 'Erreur de connexion au serveur',
      };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  const value = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!token,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};

