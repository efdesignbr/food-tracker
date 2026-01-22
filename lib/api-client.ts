import { triggerClientLogout } from '@/lib/auth-client';
const isMobile = process.env.NEXT_PUBLIC_IS_MOBILE === 'true';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://app.foodtracker.com.br'; // URL de Produção

interface FetchOptions extends RequestInit {
  token?: string;
  // Optional network timeout in milliseconds (default: 10000)
  timeoutMs?: number;
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
  const { token, timeoutMs, ...fetchOptions } = options;

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
    hasAuthToken: !!headers['Authorization'],
    allHeaders: Object.keys(headers),
    xAdCompleted: headers['x-ad-completed'] || 'not set',
  });

  try {
    // Apply a default timeout if none provided and no external signal is set
    const useTimeoutMs = typeof timeoutMs === 'number' ? timeoutMs : 10000;
    const useController = !fetchOptions.signal ? new AbortController() : null;
    const useSignal = useController?.signal ?? fetchOptions.signal;
    let timeoutId: any = null;

    if (useController) {
      timeoutId = setTimeout(() => {
        try {
          useController.abort();
        } catch {}
      }, useTimeoutMs);
    }

    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      credentials: 'include', // Important for cookies/sessions
      signal: useSignal,
    });

    if (timeoutId) clearTimeout(timeoutId);

    console.log(`[API Client] Response ${endpoint}:`, { status: response.status });

    // Handle 401 Unauthorized (Mobile): dispare logout client-side e deixe o layout redirecionar
    if (response.status === 401 && isMobile && typeof window !== 'undefined') {
      console.warn('401 Unauthorized - triggering client logout');
      try {
        triggerClientLogout();
      } catch {}
    }

    // Handle 404 tenant_not_found (Mobile): token antigo com tenant removido
    if (response.status === 404 && isMobile && typeof window !== 'undefined') {
      try {
        const cloned = response.clone();
        const data = await cloned.json().catch(() => null as any);
        const err = data?.error || '';
        if (typeof err === 'string' && err.toLowerCase().includes('tenant')) {
          console.warn('404 tenant_not_found - triggering client logout');
          try {
            triggerClientLogout();
          } catch {}
        }
      } catch {}
    }

    return response;
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      console.error('[API Client Error] Timeout');
      throw new Error('Tempo de rede esgotado');
    }
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
