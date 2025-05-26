// API Configuration
export const FASHN_API_URL = import.meta.env.VITE_FASHN_API_URL || 'https://api.fashn.ai';
export const FASHN_API_KEY = import.meta.env.VITE_FASHN_API_KEY || '';

// Default values
export const DEFAULT_PERFORMANCE_MODE = 'balanced';
export const DEFAULT_NUM_SAMPLES = 1;
export const DEFAULT_SEED = 42;

// Generation settings
export const MAX_SAMPLES = 5;
export const MIN_SAMPLES = 1;
export const GENERATION_POLL_INTERVAL = 2000; // 2 seconds
export const MAX_GENERATION_ATTEMPTS = 60; // 2 minutes total