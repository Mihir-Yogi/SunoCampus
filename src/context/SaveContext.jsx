import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../services/api';

const SaveContext = createContext();

export function SaveProvider({ children }) {
  const [savedCount, setSavedCount] = useState(0);
  const [savedItems, setSavedItems] = useState(new Set());

  // Fetch all saved item IDs (no pagination limit)
  const fetchSavedCount = useCallback(async () => {
    try {
      // Get all saved IDs without limit
      const res = await api.get('/saves/all-ids');
      if (res.data.success) {
        setSavedCount(res.data.total);
        // Store saved item IDs for quick lookup
        const ids = new Set(res.data.data);
        setSavedItems(ids);
      }
    } catch (error) {
      console.error('Failed to fetch saved count:', error);
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    fetchSavedCount();
  }, [fetchSavedCount]);

  const toggleSave = useCallback(async (contentType, contentId) => {
    const key = `${contentType}-${contentId}`;
    const isSaved = savedItems.has(key);

    try {
      if (isSaved) {
        await api.delete('/saves', {
          data: { contentType, contentId },
        });
        setSavedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(key);
          return newSet;
        });
        setSavedCount(prev => Math.max(0, prev - 1));
      } else {
        await api.post('/saves', {
          contentType,
          contentId,
        });
        setSavedItems(prev => new Set(prev).add(key));
        setSavedCount(prev => prev + 1);
      }
      return !isSaved;
    } catch (error) {
      console.error('Failed to toggle save:', error);
      return isSaved;
    }
  }, [savedItems]);

  const isSavedItem = useCallback((contentType, contentId) => {
    return savedItems.has(`${contentType}-${contentId}`);
  }, [savedItems]);

  return (
    <SaveContext.Provider value={{ savedCount, toggleSave, isSavedItem, fetchSavedCount }}>
      {children}
    </SaveContext.Provider>
  );
}

export function useSaveContext() {
  const context = useContext(SaveContext);
  if (!context) {
    throw new Error('useSaveContext must be used within SaveProvider');
  }
  return context;
}
