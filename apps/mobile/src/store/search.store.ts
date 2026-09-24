import { create } from 'zustand';

interface SearchState {
  currentSessionId: string | null;
  currentQuery: string;
  isSearching: boolean;

  setSession: (sessionId: string, query: string) => void;
  setSearching: (value: boolean) => void;
  clearSession: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  currentSessionId: null,
  currentQuery: '',
  isSearching: false,

  setSession: (sessionId, query) =>
    set({ currentSessionId: sessionId, currentQuery: query, isSearching: true }),

  setSearching: (value) => set({ isSearching: value }),

  clearSession: () =>
    set({ currentSessionId: null, currentQuery: '', isSearching: false }),
}));
