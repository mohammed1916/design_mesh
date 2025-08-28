import { useState } from 'react';

// Use environment variable for Unsplash API key
// dotenv-webpack makes environment variables available via process.env
const UNSPLASH_ACCESS_KEY = process.env.REACT_APP_UNSPLASH_ACCESS_KEY ||
                           'ygLFKTLUmnVK8KJluJI5L0aaopuwKsmCL5XDrPrqZ3U'; // Fallback to the value from .env

export function useUnsplashSearch() {
  const [images, setImages] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function searchUnsplash(query: string) {
    if (!query || !query.trim()) {
      setImages([]);
      setError(null);
      return;
    }

    setError(null);
    try {
      const res = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&client_id=${UNSPLASH_ACCESS_KEY}`
      );

      if (!res.ok) {
        throw new Error(`Unsplash API error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      setImages(data.results || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch images';
      setError(errorMessage);
      setImages([]);
    }
  }

  return { images, error, searchUnsplash };
}
