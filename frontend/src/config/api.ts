// Detectar si estamos en desarrollo local o en Ngrok
const getApiUrl = () => {
  // Si estamos en el navegador
  if (typeof window !== 'undefined') {
    const currentUrl = window.location.origin;
    
    // Si la URL contiene ngrok, usar la misma URL base para la API
    if (currentUrl.includes('ngrok')) {
      return currentUrl;
    }
  }
  
  // Fallback para desarrollo local
  return 'http://localhost:5000';
};

export const API_BASE_URL = getApiUrl();

// Funciones helper para las rutas de API
export const apiRoutes = {
  categories: `${API_BASE_URL}/api/categories`,
  commerces: (categoryId: string) => `${API_BASE_URL}/api/categories/${categoryId}/commerces`,
  favorites: `${API_BASE_URL}/api/users/favorites`,
  uploads: (filename: string) => `${API_BASE_URL}/uploads/${filename}`,
};