import React, { useEffect } from 'react';
import { useUnsplashSearch } from '../hooks/useUnsplashSearch';
import './UnsplashImageGallery.css';

interface UnsplashImageGalleryProps {
  query: string;
}

export function UnsplashImageGallery({ query }: UnsplashImageGalleryProps) {
  const { images, error, searchUnsplash } = useUnsplashSearch();

  useEffect(() => {
    if (query && query.trim()) {
      searchUnsplash(query);
    }
  }, [query, searchUnsplash]);

  if (error) {
    return (
      <div className="unsplash-error">
        <p>Error loading images: {error}</p>
      </div>
    );
  }

  if (!images || images.length === 0) {
    return (
      <div className="unsplash-no-results">
        <p>No images found for "{query}"</p>
      </div>
    );
  }

  return (
    <div className="unsplash-gallery">
      {images.map((img: any) => {
        // Safe property access
        const imageUrl = img?.urls?.small;
        const altText = img?.alt_description || img?.description || 'Unsplash image';
        const userName = img?.user?.name || 'Unknown';
        const userLink = img?.user?.links?.html;
        const unsplashLink = 'https://unsplash.com';

        if (!imageUrl) return null;

        return (
          <div key={img?.id || Math.random()} className="unsplash-image-card">
            <img
              src={imageUrl}
              alt={altText}
              onError={(e) => {
                // Hide broken images
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="unsplash-attribution">
              Photo by{' '}
              {userLink ? (
                <a
                  href={userLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {userName}
                </a>
              ) : (
                userName
              )}{' '}
              on{' '}
              <a
                href={unsplashLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                Unsplash
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}
