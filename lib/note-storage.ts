import { Note } from '@/types/note';

const STORAGE_KEY = 'quick-notes-data';

export const loadNotes = (): Note[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as Note[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch {
    return [];
  }
};

export const saveNotes = (notes: Note[]): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    return true;
  } catch {
    return false;
  }
};
