const isMobile = process.env.NEXT_PUBLIC_IS_MOBILE === 'true';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://app.foodtracker.com.br'; // URL de Produção

interface FetchOptions extends RequestInit {
  token?: string;
}

// Lógica corrigida:
// Se for Mobile -> SEMPRE usa API_URL (absoluta)
// Se for Web Localhost -> Usa '' (relativa)
// Se for Web Produção -> Usa '' (relativa, mesmo domínio)
const baseUrl = isMobile 
  ? API_URL 
  : (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? '' : '');

export async function apiClient(
  endpoint: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { token, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    ...(fetchOptions.headers as Record<string, string>),
  };

  // Add token if exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else if (typeof window !== 'undefined') {
    // Try to get token from localStorage
    const storedToken = localStorage.getItem('auth_token');
    console.log('[API Client] localStorage auth_token:', storedToken ? 'exists' : 'null');
    if (storedToken) {
      headers['Authorization'] = `Bearer ${storedToken}`;
    }
  }

  // Add Content-Type if JSON
  if (fetchOptions.body && typeof fetchOptions.body === 'string' && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  // Determine full URL
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;

  console.log('[API Client]', { 
    isMobile, 
    baseUrl, 
    endpoint, 
    finalUrl: url,
    hasAuthToken: !!headers['Authorization']
  });

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      credentials: 'include', // Important for cookies/sessions
    });

    console.log(`[API Client] Response ${endpoint}:`, { status: response.status });

    // Handle 401 Unauthorized -> Redirect to login
    if (response.status === 401 && isMobile && typeof window !== 'undefined') {
      // Evita loop infinito se já estiver no login
      if (!window.location.pathname.includes('/login')) {
        console.warn('401 Unauthorized - Redirecting to login');
        // Limpa token inválido
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
      }
    }

    return response;
  } catch (error) {
    console.error('[API Client Error]', error);
    throw error;
  }
}

export const api = {
  get: (endpoint: string, token?: string) =>
    apiClient(endpoint, { method: 'GET', token }),

  post: (endpoint: string, body: any, token?: string) =>
    apiClient(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
      token,
    }),

  put: (endpoint: string, body: any, token?: string) =>
    apiClient(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
      token,
    }),

  patch: (endpoint: string, body: any, token?: string) =>
    apiClient(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
      token,
    }),

  delete: (endpoint: string, token?: string) =>
    apiClient(endpoint, { method: 'DELETE', token }),
};
