'use client';

import { useState, useEffect } from 'react';
import { LuHeart } from 'react-icons/lu';

interface FavoriteButtonProps {
  productId: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function FavoriteButton({ productId, size = 'md', showLabel = false }: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  useEffect(() => {
    const mockUserId = localStorage.getItem('userId') || 'guest-user-' + Date.now();
    setUserId(mockUserId);
    localStorage.setItem('userId', mockUserId);

    // Check if product is in favorites
    fetch(`/api/favorites?userId=${mockUserId}`)
      .then((res) => res.json())
      .then((data) => {
        const isFav = Array.isArray(data) && data.some((fav: any) => fav.productId === productId);
        setIsFavorite(isFav);
      })
      .catch(() => {});
  }, [productId]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userId || loading) return;

    setLoading(true);

    try {
      const method = isFavorite ? 'DELETE' : 'POST';
      const res = await fetch('/api/favorites', {
        method,
        headers: { 'Content-Type': 'application/json' },
        ...(method === 'POST' && { body: JSON.stringify({ userId, productId }) }),
        ...(method === 'DELETE' && {
          url: `/api/favorites?userId=${userId}&productId=${productId}`,
        }),
      });

      if (method === 'DELETE') {
        // For DELETE, use the query string approach
        await fetch(`/api/favorites?userId=${userId}&productId=${productId}`, {
          method: 'DELETE',
        });
      }

      setIsFavorite(!isFavorite);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`${sizeClasses[size]} flex items-center justify-center rounded-lg transition ${
          isFavorite
            ? 'bg-red-100 hover:bg-red-200 text-red-600'
            : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        title={isFavorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
      >
        <LuHeart size={size === 'sm' ? 14 : size === 'md' ? 18 : 22} fill={isFavorite ? 'currentColor' : 'none'} />
      </button>

      {showLabel && (
        <span className="text-xs font-medium text-gray-600 mt-1 block">
          {isFavorite ? '❤️ Favoride' : '🤍 Favorilere Ekle'}
        </span>
      )}

      {showToast && (
        <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-4 py-3 rounded-lg text-sm z-50">
          {isFavorite ? '❤️ Favorilere eklendi' : '🤍 Favorilerden çıkarıldı'}
        </div>
      )}
    </>
  );
}
