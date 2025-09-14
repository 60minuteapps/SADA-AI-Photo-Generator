import { useState, useEffect } from 'react';
import { PhotoPackage } from '../types';
import { supabaseService } from '../services/supabase';

interface UsePhotoPackagesReturn {
  packages: PhotoPackage[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const usePhotoPackages = (): UsePhotoPackagesReturn => {
  const [packages, setPackages] = useState<PhotoPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPackages = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { packages: fetchedPackages, error: fetchError } = await supabaseService.getPhotoPackages();
      
      if (fetchError) {
        setError(fetchError);
      } else {
        setPackages(fetchedPackages);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch photo packages';
      setError(errorMessage);
      console.error('Error fetching photo packages:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  return {
    packages,
    isLoading,
    error,
    refetch: fetchPackages,
  };
};
