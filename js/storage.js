/**
 * Storage Module - Manages application persistence with robust error handling for corrupt state.
 */

const KEYS = {
  HISTORY: 'recipe_app_history',
  FAVORITES: 'recipe_app_favorites',
  THEME: 'recipe_app_theme'
};

/**
 * Safely parse JSON from localStorage with fallback
 * @param {string} key 
 * @param {*} fallback 
 * @returns {*}
 */
function safeGetJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed !== null && parsed !== undefined ? parsed : fallback;
  } catch (error) {
    console.error(`[Storage] Corrupt JSON encountered for key "${key}". Resetting to fallback.`, error);
    try {
      localStorage.removeItem(key);
    } catch (e) {
      // Ignore quota or security errors on removeItem
    }
    return fallback;
  }
}

/**
 * Safely set JSON in localStorage
 * @param {string} key 
 * @param {*} value 
 */
function safeSetJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`[Storage] Failed to save key "${key}" to localStorage.`, error);
  }
}

/**
 * Helper to get item unique ID (works for both Meals and Drinks)
 * @param {Object} item 
 * @returns {string|null}
 */
export function getItemId(item) {
  if (!item) return null;
  return item.idMeal || item.idDrink || null;
}

/**
 * Retrieve stored history array (max 5 items, newest first)
 * @returns {Array}
 */
export function getHistory() {
  const history = safeGetJSON(KEYS.HISTORY, []);
  return Array.isArray(history) ? history : [];
}

/**
 * Add item to history. Keeps max 5 items, deduped by ID, newest first.
 * @param {Object} item 
 * @returns {Array} Updated history array
 */
export function saveHistoryItem(item) {
  const itemId = getItemId(item);
  if (!itemId) return getHistory();

  let history = getHistory();
  // Filter out any existing item with the same ID
  history = history.filter(existing => getItemId(existing) !== itemId);
  // Unshift new item to start
  history.unshift(item);
  // Cap at max 5 items
  if (history.length > 5) {
    history = history.slice(0, 5);
  }

  safeSetJSON(KEYS.HISTORY, history);
  return history;
}

/**
 * Retrieve saved favorites array
 * @returns {Array}
 */
export function getFavorites() {
  const favorites = safeGetJSON(KEYS.FAVORITES, []);
  return Array.isArray(favorites) ? favorites : [];
}

/**
 * Toggle favorite item (add if absent, remove if present)
 * @param {Object} item 
 * @returns {Array} Updated favorites array
 */
export function toggleFavoriteItem(item) {
  const itemId = getItemId(item);
  if (!itemId) return getFavorites();

  let favorites = getFavorites();
  const exists = favorites.some(existing => getItemId(existing) === itemId);

  if (exists) {
    favorites = favorites.filter(existing => getItemId(existing) !== itemId);
  } else {
    favorites.unshift(item);
  }

  safeSetJSON(KEYS.FAVORITES, favorites);
  return favorites;
}

/**
 * Check if item is currently in favorites
 * @param {Object} item 
 * @returns {boolean}
 */
export function isItemFavorited(item) {
  const itemId = getItemId(item);
  if (!itemId) return false;
  const favorites = getFavorites();
  return favorites.some(existing => getItemId(existing) === itemId);
}

/**
 * Retrieve theme setting ('light' | 'dark' | 'system')
 * @returns {string}
 */
export function getTheme() {
  const theme = safeGetJSON(KEYS.THEME, 'system');
  if (['light', 'dark', 'system'].includes(theme)) {
    return theme;
  }
  return 'system';
}

/**
 * Persist theme preference ('light' | 'dark' | 'system')
 * @param {string} theme 
 */
export function saveTheme(theme) {
  if (['light', 'dark', 'system'].includes(theme)) {
    safeSetJSON(KEYS.THEME, theme);
  }
}
