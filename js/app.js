/**
 * App Module - Application Bootstrapper and Global Event Wiring.
 */

import { 
  initState, 
  getState, 
  subscribe, 
  setSource, 
  setLoading, 
  setSuccess, 
  setError, 
  toggleFavorite, 
  selectItem, 
  setTheme 
} from './state.js';
import { fetchRandomMeal, fetchRandomCocktail, parseIngredients } from './api.js';
import { renderApp, showToast } from './render.js';
import { getItemId } from './storage.js';

/**
 * Initialize application on DOM ready
 */
document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize State & Observers
  initState();
  subscribe(renderApp);

  // Initial render
  renderApp(getState());

  // 2. Attach Media Query Listener for Live OS Dark Mode Changes
  const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
  darkQuery.addEventListener('change', () => {
    const { theme } = getState();
    if (theme === 'system') {
      renderApp(getState());
    }
  });

  // 3. Delegate UI Event Handlers
  setupTabToggles();
  setupThemeButtons();
  setupSurpriseButton();
  setupRecipeCardActions();
  setupSidebarActions();
});

/**
 * Source Segmented Toggle Setup
 */
function setupTabToggles() {
  const mealTab = document.getElementById('tab-meal');
  const cocktailTab = document.getElementById('tab-cocktail');

  if (mealTab) {
    mealTab.addEventListener('click', () => setSource('meal'));
  }
  if (cocktailTab) {
    cocktailTab.addEventListener('click', () => setSource('cocktail'));
  }
}

/**
 * Theme Button Switchers Setup
 */
function setupThemeButtons() {
  const themeContainer = document.getElementById('theme-selector');
  if (themeContainer) {
    themeContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-theme-choice]');
      if (btn) {
        const choice = btn.getAttribute('data-theme-choice');
        setTheme(choice);
      }
    });
  }
}

/**
 * Surprise Me Button Handler with Coordinate-based Click Ripple Origin
 */
function setupSurpriseButton() {
  const btn = document.getElementById('surprise-btn');
  if (!btn) return;

  btn.addEventListener('click', (e) => {
    // Prevent double fetch if already loading
    const { status } = getState();
    if (status === 'loading') return;

    // Trigger ripple animation at click coordinates
    createRipple(e, btn);

    // Perform Fetch
    triggerFetch();
  });
}

/**
 * Execute Random Fetch based on currently active source
 */
async function triggerFetch() {
  const { source } = getState();
  setLoading();

  let result;
  if (source === 'meal') {
    result = await fetchRandomMeal();
  } else {
    result = await fetchRandomCocktail();
  }

  if (result.success && result.data) {
    setSuccess(result.data, true);
  } else {
    setError({
      message: result.message || 'Failed to fetch recipe',
      errorType: result.errorType || 'UNKNOWN'
    });

    // Return focus to surprise button on failure
    const btn = document.getElementById('surprise-btn');
    if (btn) btn.focus();
  }
}

/**
 * Ripple Effect Helper
 * @param {MouseEvent} event 
 * @param {HTMLElement} element 
 */
function createRipple(event, element) {
  const circle = document.createElement('span');
  const diameter = Math.max(element.clientWidth, element.clientHeight);
  const radius = diameter / 2;

  const rect = element.getBoundingClientRect();
  circle.style.width = circle.style.height = `${diameter}px`;
  circle.style.left = `${event.clientX - rect.left - radius}px`;
  circle.style.top = `${event.clientY - rect.top - radius}px`;
  circle.classList.add('ripple-effect');

  // Remove previous ripples
  const existingRipple = element.getElementsByClassName('ripple-effect')[0];
  if (existingRipple) {
    existingRipple.remove();
  }

  element.appendChild(circle);
}

/**
 * Delegate Event Handlers on Main Recipe Card Container
 */
function setupRecipeCardActions() {
  const container = document.getElementById('recipe-card-container');
  if (!container) return;

  container.addEventListener('click', async (e) => {
    // 0. Idle Generate Button
    const idleGenerateBtn = e.target.closest('#idle-generate-btn');
    if (idleGenerateBtn) {
      createRipple(e, idleGenerateBtn);
      triggerFetch();
      return;
    }

    // 1. Retry Button
    const retryBtn = e.target.closest('#retry-btn');
    if (retryBtn) {
      triggerFetch();
      return;
    }

    // 2. Favorite Toggle Button
    const favBtn = e.target.closest('#fav-toggle-btn');
    if (favBtn) {
      const { currentItem } = getState();
      if (currentItem) {
        toggleFavorite(currentItem);
        const favorited = isFavoritedInState(currentItem);
        showToast(favorited ? 'Added to favorites!' : 'Removed from favorites', favorited ? 'success' : 'info');
      }
      return;
    }

    // 3. Copy Recipe Button
    const copyBtn = e.target.closest('#copy-btn');
    if (copyBtn) {
      handleCopyRecipe();
      return;
    }

    // 4. Share Recipe Button
    const shareBtn = e.target.closest('#share-btn');
    if (shareBtn) {
      handleShareRecipe();
      return;
    }

    // 5. Print Recipe Button
    const printBtn = e.target.closest('#print-btn');
    if (printBtn) {
      window.print();
      return;
    }
  });
}

/**
 * Delegate History and Favorites Sidebar Item Clicks
 */
function setupSidebarActions() {
  const historyList = document.getElementById('history-list');
  const favoritesList = document.getElementById('favorites-list');

  // History Clicks
  if (historyList) {
    historyList.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-history-id]');
      if (btn) {
        const id = btn.getAttribute('data-history-id');
        const { history } = getState();
        const item = history.find(h => getItemId(h) === id);
        if (item) {
          selectItem(item);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    });
  }

  // Favorites Clicks & Removes
  if (favoritesList) {
    favoritesList.addEventListener('click', (e) => {
      // Remove button check
      const removeBtn = e.target.closest('[data-remove-fav-id]');
      if (removeBtn) {
        const id = removeBtn.getAttribute('data-remove-fav-id');
        const { favorites } = getState();
        const item = favorites.find(f => getItemId(f) === id);
        if (item) {
          toggleFavorite(item);
          showToast('Removed from favorites', 'info');
        }
        return;
      }

      // Select favorite item check
      const selectBtn = e.target.closest('[data-favorite-id]');
      if (selectBtn) {
        const id = selectBtn.getAttribute('data-favorite-id');
        const { favorites } = getState();
        const item = favorites.find(f => getItemId(f) === id);
        if (item) {
          selectItem(item);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    });
  }
}

/**
 * Formats recipe item into clean plain-text format for clipboard copying
 * @returns {string}
 */
function buildPlainTextRecipe(item, source) {
  if (!item) return '';

  const isMeal = source === 'meal' || !!item.idMeal;
  const title = isMeal ? (item.strMeal || 'Recipe') : (item.strDrink || 'Cocktail');
  const category = item.strCategory || '';
  const areaOrType = isMeal ? item.strArea : item.strAlcoholic;
  const ingredients = parseIngredients(item, isMeal ? 20 : 15);
  const instructions = item.strInstructions || '';

  let text = `${title.toUpperCase()}\n`;
  if (category || areaOrType) {
    text += `[${[category, areaOrType].filter(Boolean).join(' - ')}]\n`;
  }
  text += `\nINGREDIENTS:\n`;

  ingredients.forEach(({ ingredient, measure }) => {
    text += `- ${ingredient}${measure ? ` (${measure})` : ''}\n`;
  });

  text += `\nINSTRUCTIONS:\n${instructions.trim()}\n`;

  return text;
}

/**
 * Handle Copy Recipe to Clipboard with Fallback
 */
async function handleCopyRecipe() {
  const { currentItem, source } = getState();
  if (!currentItem) return;

  const plainText = buildPlainTextRecipe(currentItem, source);

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(plainText);
      showToast('Recipe copied to clipboard!', 'success');
    } else {
      fallbackCopyToClipboard(plainText);
    }
  } catch (err) {
    console.warn('[Clipboard API failed, using fallback]', err);
    fallbackCopyToClipboard(plainText);
  }
}

/**
 * Fallback inline prompt/copy for insecure or permission-restricted environments
 * @param {string} text 
 */
function fallbackCopyToClipboard(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  textarea.style.top = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  try {
    const successful = document.execCommand('copy');
    if (successful) {
      showToast('Recipe copied to clipboard!', 'success');
    } else {
      prompt('Copy recipe text below (Ctrl+C):', text);
    }
  } catch (err) {
    prompt('Copy recipe text below (Ctrl+C):', text);
  } finally {
    document.body.removeChild(textarea);
  }
}

/**
 * Handle Share Recipe via Web Share API or Clipboard Fallback
 */
async function handleShareRecipe() {
  const { currentItem, source } = getState();
  if (!currentItem) return;

  const title = currentItem.strMeal || currentItem.strDrink || 'Recipe';
  const plainText = buildPlainTextRecipe(currentItem, source);

  if (navigator.share) {
    try {
      await navigator.share({
        title: title,
        text: plainText,
        url: window.location.href
      });
      showToast('Shared successfully!', 'success');
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.warn('[Web Share failed, falling back to copy]', err);
        handleCopyRecipe();
      }
    }
  } else {
    // Fallback to copy recipe
    handleCopyRecipe();
  }
}

/**
 * Check if item is in favorites state
 * @param {Object} item 
 * @returns {boolean}
 */
function isFavoritedInState(item) {
  if (!item) return false;
  const id = getItemId(item);
  const { favorites } = getState();
  return favorites.some(f => getItemId(f) === id);
}
