import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '@/api/entities';
import { createPageUrl } from '@/utils';

export default function ProtectedRoute({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await User.me();
        setIsAuthenticated(true);
        setIsLoading(false);
      } catch (error) {
        // Redireciona para home em vez de mostrar login
        navigate(createPageUrl("Home"));
      }
    };

    checkAuth();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F4F1EC] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B1F3A]"></div>
      </div>
    );
  }

  return isAuthenticated ? children : null;
}