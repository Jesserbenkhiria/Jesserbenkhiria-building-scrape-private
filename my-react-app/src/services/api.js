import axios from 'axios';

// Direct API URL to backend server on port 4000
const API_BASE_URL = 'http://localhost:4000/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout (increased for statistics)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'authentification à toutes les requêtes
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs d'authentification
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token invalide ou expiré, supprimer du localStorage
      localStorage.removeItem('token');
      // Rediriger vers la page de login si on est sur une page protégée
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Fetch construction companies with filters and pagination
 */
export async function fetchConstruction(limit = 20, offset = 0, city = null, query = null, keyword = null) {
  try {
    const params = {
      limit,
      offset,
    };
    
    if (city) {
      params.city = city;
    }
    
    if (query && query.trim()) {
      params.q = query.trim();
    }
    
    if (keyword && keyword.trim()) {
      params.keyword = keyword.trim();
    }
    
    const response = await apiClient.get('/construction', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching construction companies:', error);
    if (error.response) {
      throw new Error(`HTTP error! status: ${error.response.status}`);
    } else if (error.request) {
      throw new Error('Network error: No response from server');
    } else {
      throw error;
    }
  }
}

/**
 * Fetch fournisseur companies with filters and pagination
 */
export async function fetchFournisseur(limit = 20, offset = 0, city = null, query = null, keyword = null) {
  try {
    const params = {
      limit,
      offset,
    };
    
    if (city) {
      params.city = city;
    }
    
    if (query && query.trim()) {
      params.q = query.trim();
    }
    
    if (keyword && keyword.trim()) {
      params.keyword = keyword.trim();
    }
    
    const response = await apiClient.get('/fournisseur', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching fournisseur companies:', error);
    if (error.response) {
      throw new Error(`HTTP error! status: ${error.response.status}`);
    } else if (error.request) {
      throw new Error('Network error: No response from server');
    } else {
      throw error;
    }
  }
}

/**
 * Fetch usines with filters and pagination
 */
export async function fetchUsines(limit = 20, offset = 0, city = null, query = null, keyword = null) {
  try {
    const params = {
      limit,
      offset,
    };
    
    if (city) {
      params.city = city;
    }
    
    if (query && query.trim()) {
      params.q = query.trim();
    }
    
    if (keyword && keyword.trim()) {
      params.keyword = keyword.trim();
    }
    
    const response = await apiClient.get('/usine', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching usines:', error);
    if (error.response) {
      throw new Error(`HTTP error! status: ${error.response.status}`);
    } else if (error.request) {
      throw new Error('Network error: No response from server');
    } else {
      throw error;
    }
  }
}

/**
 * Get unique cities from companies endpoint (for filter dropdown)
 */
export async function getCities(category = 'construction') {
  try {
    // Fetch a large sample to get all cities
    const response = await apiClient.get(`/${category}`, {
      params: { limit: 1000, offset: 0 },
    });
    
    const cities = new Set();
    (response.data.items || []).forEach(company => {
      if (company.city) {
        cities.add(company.city);
      }
    });
    
    return Array.from(cities).sort();
  } catch (error) {
    console.error('Error fetching cities:', error);
    return [];
  }
}

/**
 * Get unique types from usines endpoint (for filter dropdown)
 */
export async function getUsineTypes() {
  try {
    const response = await apiClient.get('/usine/types');
    return response.data.types || [];
  } catch (error) {
    console.error('Error fetching usine types:', error);
    return [];
  }
}

/**
 * Get unique search keywords from usines endpoint
 */
export async function getUsineKeywords() {
  try {
    const response = await apiClient.get('/usine/keywords');
    return response.data.keywords || [];
  } catch (error) {
    console.error('Error fetching usine keywords:', error);
    return [];
  }
}

/**
 * Get Google Maps API key from backend
 */
export async function getGoogleMapsKey() {
  try {
    const response = await apiClient.get('/google-maps-key');
    return response.data.apiKey || '';
  } catch (error) {
    console.error('Error fetching Google Maps key:', error);
    return '';
  }
}

/**
 * Get statistics for dashboard
 */
export async function getStatistics() {
  try {
    const response = await apiClient.get('/statistics');
    return response.data;
  } catch (error) {
    console.error('Error fetching statistics:', error);
    throw error;
  }
}

/**
 * Get all unique keywords for a category
 */
export async function getKeywords(category = 'construction') {
  try {
    const response = await apiClient.get(`/keywords/${category}`);
    return response.data.keywords || [];
  } catch (error) {
    console.error('Error fetching keywords:', error);
    return [];
  }
}

/**
 * Get detailed statistics for a category
 */
export async function getCategoryStatistics(category = 'construction') {
  try {
    const response = await apiClient.get(`/statistics/${category}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching category statistics:', error);
    throw error;
  }
}

/**
 * Get usine statistics
 */
export async function getUsineStatistics() {
  try {
    const response = await apiClient.get('/search-usines/status');
    return response.data.statistics;
  } catch (error) {
    console.error('Error fetching usine statistics:', error);
    throw error;
  }
}
