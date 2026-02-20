import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { VaultItem, CategoryFilter } from './types';
import * as Storage from './storage';

interface VaultContextValue {
  items: VaultItem[];
  loading: boolean;
  searchQuery: string;
  categoryFilter: CategoryFilter;
  filteredItems: VaultItem[];
  setSearchQuery: (q: string) => void;
  setCategoryFilter: (f: CategoryFilter) => void;
  loadItems: () => Promise<void>;
  addItem: (item: Omit<VaultItem, 'id' | 'createdAt'>) => Promise<VaultItem>;
  updateItem: (id: string, updates: Partial<VaultItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}

const VaultContext = createContext<VaultContextValue | null>(null);

export function VaultProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<VaultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');

  const loadItems = useCallback(async () => {
    setLoading(true);
    const data = await Storage.getAllItems();
    setItems(data);
    setLoading(false);
  }, []);

  const addItem = useCallback(async (item: Omit<VaultItem, 'id' | 'createdAt'>) => {
    const newItem = await Storage.addItem(item);
    setItems(prev => [newItem, ...prev]);
    return newItem;
  }, []);

  const updateItem = useCallback(async (id: string, updates: Partial<VaultItem>) => {
    await Storage.updateItem(id, updates);
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    await Storage.deleteItem(id);
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const filteredItems = useMemo(() => {
    let result = items;
    if (categoryFilter !== 'all') {
      result = result.filter(i => i.type === categoryFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(i =>
        i.title.toLowerCase().includes(q) ||
        i.content.toLowerCase().includes(q) ||
        (i.tags && i.tags.some(t => t.toLowerCase().includes(q)))
      );
    }
    return result;
  }, [items, categoryFilter, searchQuery]);

  const value = useMemo(() => ({
    items,
    loading,
    searchQuery,
    categoryFilter,
    filteredItems,
    setSearchQuery,
    setCategoryFilter,
    loadItems,
    addItem,
    updateItem,
    deleteItem,
  }), [items, loading, searchQuery, categoryFilter, filteredItems, loadItems, addItem, updateItem, deleteItem]);

  return (
    <VaultContext.Provider value={value}>
      {children}
    </VaultContext.Provider>
  );
}

export function useVault() {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error('useVault must be used within VaultProvider');
  }
  return context;
}
