const FAVORITES_STORAGE_KEY = 'cillii-favorites';

export class LocalStorageFavorites {
  private static getFavorites(): number[] {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored) as number[];
        if (Array.isArray(data)) {
          return data;
        }
      }
    } catch (error) {
      console.error('Error reading favorites from localStorage:', error);
    }
    return [];
  }

  private static saveFavorites(ids: number[]): void {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(ids));
    } catch (error) {
      console.error('Error saving favorites to localStorage:', error);
    }
  }

  static getIds(): number[] {
    return this.getFavorites();
  }

  static isFavorite(classId: number): boolean {
    return this.getFavorites().includes(classId);
  }

  static toggle(classId: number): void {
    const favorites = this.getFavorites();
    const index = favorites.indexOf(classId);
    if (index >= 0) {
      favorites.splice(index, 1);
    } else {
      favorites.push(classId);
    }
    this.saveFavorites(favorites);
  }
}


