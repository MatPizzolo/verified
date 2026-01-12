import { createClient } from '@/lib/supabase/client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * Make an authenticated API request
 * Automatically adds Authorization header with Supabase session token
 */
export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const supabase = createClient();
  
  // Get current session
  const { data: { session } } = await supabase.auth.getSession();
  
  // Add Authorization header if session exists
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  
  return fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });
}

/**
 * GET request helper
 */
export async function apiGet(endpoint: string) {
  return apiRequest(endpoint, { method: 'GET' });
}

/**
 * POST request helper
 */
export async function apiPost(endpoint: string, data?: any) {
  return apiRequest(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * PUT request helper
 */
export async function apiPut(endpoint: string, data?: any) {
  return apiRequest(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * DELETE request helper
 */
export async function apiDelete(endpoint: string) {
  return apiRequest(endpoint, { method: 'DELETE' });
}
