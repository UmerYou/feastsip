/**
 * State Module - Single source of truth with Observer / Pub-Sub pattern for reactive rendering.
 */

import { getHistory, getFavorites, getTheme, saveHistoryItem, toggleFavoriteItem, saveTheme } from './storage.js';

// Internal application state
const state = {
  source: 'meal', // 'meal' | 'cocktail'
  status: 'idle', // 'idle' | 'loading' | 'success' | 'error'
  currentItem: null,
  error: null,
  history: [],
  favorites: [],
  theme: 'system'
};

// Registered listener callbacks
const listeners = new Set();

/**
 * Subscribe a listener function to state changes
 * @param {Function} listener 
 * @returns {Function} Unsubscribe function
 */
export function subscribe(listener) {
  if (typeof listener === 'function') {
    listeners.add(listener);
  }
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Notify all subscribed listeners with current state
 */
function notify() {
  const stateCopy = getState();
  listeners.forEach(listener => {
    try {
      listener(stateCopy);
    } catch (err) {
      console.error('[State Observer Error]', err);
    }
  });
}

/**
 * Get read-only snapshot of current state
 * @returns {Object}
 */
export function getState() {
  return Object.freeze({
    ...state,
    history: [...state.history],
    favorites: [...state.favorites]
  });
}

/**
 * Initialize state from localStorage
 */
export function initState() {
  state.history = getHistory();
  state.favorites = getFavorites();
  state.theme = getTheme();
  notify();
}

/**
 * Change recipe source tab ('meal' or 'cocktail'). Resets card back to idle state without auto-fetching.
 * @param {'meal'|'cocktail'} newSource 
 */
export function setSource(newSource) {
  if (newSource !== 'meal' && newSource !== 'cocktail') return;
  if (state.source === newSource) return;

  state.source = newSource;
  state.status = 'idle';
  state.currentItem = null;
  state.error = null;
  notify();
}

/**
 * Set status to 'loading'
 */
export function setLoading() {
  state.status = 'loading';
  state.error = null;
  notify();
}

/**
 * Set status to 'success' with newly fetched or selected item
 * @param {Object} item 
 * @param {boolean} [saveToHist=true] 
 */
export function setSuccess(item, saveToHist = true) {
  state.status = 'success';
  state.currentItem = item;
  state.error = null;
  
  if (saveToHist && item) {
    state.history = saveHistoryItem(item);
  }
  notify();
}

/**
 * Set status to 'error' with error details
 * @param {Object} errorObj 
 */
export function setError(errorObj) {
  state.status = 'error';
  state.error = errorObj || { message: 'An unexpected error occurred.', errorType: 'UNKNOWN' };
  notify();
}

/**
 * Toggle favorite status of current or specified item
 * @param {Object} [item] 
 */
export function toggleFavorite(item = state.currentItem) {
  if (!item) return;
  state.favorites = toggleFavoriteItem(item);
  notify();
}

/**
 * Select item from history or favorites and view immediately
 * @param {Object} item 
 */
export function selectItem(item) {
  if (!item) return;
  
  // Update source matching item type if needed
  if (item.idMeal && state.source !== 'meal') {
    state.source = 'meal';
  } else if (item.idDrink && state.source !== 'cocktail') {
    state.source = 'cocktail';
  }

  state.status = 'success';
  state.currentItem = item;
  state.error = null;
  notify();
}

/**
 * Update application theme
 * @param {'light'|'dark'|'system'} newTheme 
 */
export function setTheme(newTheme) {
  if (!['light', 'dark', 'system'].includes(newTheme)) return;
  state.theme = newTheme;
  saveTheme(newTheme);
  notify();
}
