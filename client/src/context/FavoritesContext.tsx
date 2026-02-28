import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { ClassRecord } from '../types';
import { LocalStorageFavorites } from '../api/localStorage-favorites';
import { useClasses } from '../hooks/useClasses';

interface FavoritesContextValue {
  favoriteIds: number[];
  favoriteItems: ClassRecord[];
  toggleFavorite: (classId: number) => void;
  isFavorite: (classId: number) => boolean;
}

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const { data: allClasses = [] } = useClasses();

  useEffect(() => {
    setFavoriteIds(LocalStorageFavorites.getIds());
  }, []);

  const toggleFavorite = useCallback((classId: number) => {
    LocalStorageFavorites.toggle(classId);
    setFavoriteIds(LocalStorageFavorites.getIds());
  }, []);

  const isFavorite = useCallback(
    (classId: number) => favoriteIds.includes(classId),
    [favoriteIds],
  );

  const favoriteItems = useMemo<ClassRecord[]>(
    () => allClasses.filter((item) => favoriteIds.includes(item.id)),
    [allClasses, favoriteIds],
  );

  const value: FavoritesContextValue = {
    favoriteIds,
    favoriteItems,
    toggleFavorite,
    isFavorite,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = (): FavoritesContextValue => {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return ctx;
};


