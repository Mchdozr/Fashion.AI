// API Configuration
export const FASHN_API_URL = import.meta.env.VITE_FASHN_API_URL || 'https://api.fashn.ai/v1';
export const FASHN_API_KEY = import.meta.env.VITE_FASHN_API_KEY;

if (!FASHN_API_KEY) {
  console.error('VITE_FASHN_API_KEY environment variable is not set');
}