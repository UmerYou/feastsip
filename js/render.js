/**
 * Render Module - Pure DOM rendering functions driven by application state.
 */

import { parseIngredients } from './api.js';
import { isItemFavorited, getItemId } from './storage.js';

// SVG Icons for clean, crisp UI rendering without external icon font dependencies
const ICONS = {
  MEAL: `<svg class="w-5 h-5 inline-block mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>`,
  COCKTAIL: `<svg class="w-5 h-5 inline-block mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L5.6 15.12a2 2 0 00-1.182.15l-1.03.515A2 2 0 002.3 17.575l.488 1.954A2 2 0 004.74 21h14.52a2 2 0 001.953-1.471l.488-1.954a2 2 0 00-1.085-2.147l-1.188-.594zM12 3v10m-3-7h6"></path></svg>`,
  SPARKLES: `<svg class="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>`,
  HEART_OUTLINE: `<svg class="w-6 h-6 stroke-current fill-none heart-icon" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.684a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>`,
  HEART_FILLED: `<svg class="w-6 h-6 fill-red-500 stroke-red-500 heart-icon" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.684a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>`,
  COPY: `<svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>`,
  SHARE: `<svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 107.5-1.18 3 3 0 00-7.5 1.18zm0 8.5a3 3 0 107.5 1.18 3 3 0 00-7.5-1.18z"></path></svg>`,
  PRINT: `<svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>`,
  YOUTUBE: `<svg class="w-4 h-4 mr-1.5 fill-current text-red-600" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>`,
  EXTERNAL_LINK: `<svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>`,
  RETRY: `<svg class="w-5 h-5 inline-block mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>`,
  FALLBACK_IMG: `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiB2aWV3Qm94PSIwIDAgNDAwIDMwMCI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiMzMzQxNTUiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5NGEzYjgiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkltYWdlIE5vdCBBdmFpbGFibGU8L3RleHQ+PC9zdmc+`
};

/**
 * Main Render Controller Function
 * @param {Object} state 
 */
export function renderApp(state) {
  renderTheme(state.theme);
  renderSourceToggle(state.source);
  renderSurpriseButton(state.status);
  renderMainContent(state);
  renderHistoryPanel(state.history, state.currentItem);
  renderFavoritesPanel(state.favorites, state.currentItem);
}

/**
 * Render Theme state on document element & theme buttons
 * @param {'light'|'dark'|'system'} theme 
 */
export function renderTheme(theme) {
  const root = document.documentElement;
  const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (theme === 'dark' || (theme === 'system' && isSystemDark)) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  // Update theme button aria-selected states
  const themeBtns = document.querySelectorAll('[data-theme-choice]');
  themeBtns.forEach(btn => {
    const choice = btn.getAttribute('data-theme-choice');
    const isSelected = choice === theme;
    btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
    if (isSelected) {
      btn.classList.add('bg-white', 'dark:bg-slate-700', 'shadow-sm', 'text-indigo-600', 'dark:text-indigo-400');
      btn.classList.remove('text-slate-600', 'dark:text-slate-400');
    } else {
      btn.classList.remove('bg-white', 'dark:bg-slate-700', 'shadow-sm', 'text-indigo-600', 'dark:text-indigo-400');
      btn.classList.add('text-slate-600', 'dark:text-slate-400');
    }
  });
}

/**
 * Render Source Segmented Toggle Tabs
 * @param {'meal'|'cocktail'} source 
 */
function renderSourceToggle(source) {
  const mealTab = document.getElementById('tab-meal');
  const cocktailTab = document.getElementById('tab-cocktail');

  if (mealTab && cocktailTab) {
    const isMeal = source === 'meal';

    mealTab.setAttribute('aria-selected', isMeal ? 'true' : 'false');
    cocktailTab.setAttribute('aria-selected', !isMeal ? 'true' : 'false');

    if (isMeal) {
      mealTab.className = 'px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 bg-indigo-600 text-white shadow-md focus:outline-none';
      cocktailTab.className = 'px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50 focus:outline-none';
    } else {
      cocktailTab.className = 'px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 bg-indigo-600 text-white shadow-md focus:outline-none';
      mealTab.className = 'px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50 focus:outline-none';
    }
  }
}

/**
 * Render Surprise Me Button Loading States
 * @param {'idle'|'loading'|'success'|'error'} status 
 */
function renderSurpriseButton(status) {
  const btn = document.getElementById('surprise-btn');
  if (!btn) return;

  const isLoading = status === 'loading';
  btn.disabled = isLoading;
  btn.setAttribute('aria-busy', isLoading ? 'true' : 'false');

  if (isLoading) {
    btn.innerHTML = `
      <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Finding Recipe...
    `;
    btn.classList.add('opacity-80', 'cursor-not-allowed');
  } else {
    btn.innerHTML = `${ICONS.SPARKLES} Surprise Me!`;
    btn.classList.remove('opacity-80', 'cursor-not-allowed');
  }
}

/**
 * Main Content Switcher (Idle, Skeleton Loading, Error, Recipe Card)
 * @param {Object} state 
 */
function renderMainContent(state) {
  const container = document.getElementById('recipe-card-container');
  if (!container) return;

  switch (state.status) {
    case 'idle':
      container.innerHTML = renderIdleState(state.source);
      break;

    case 'loading':
      container.innerHTML = renderSkeletonState();
      break;

    case 'error':
      container.innerHTML = renderErrorState(state.error, state.source);
      break;

    case 'success':
      if (state.currentItem) {
        container.innerHTML = renderRecipeCard(state.currentItem, state.source);
        // Bind local toggle behavior for instructions show more/less after inserting into DOM
        setupInstructionToggle();
      } else {
        container.innerHTML = renderIdleState(state.source);
      }
      break;
  }
}

/**
 * Render Idle State Card
 * @param {'meal'|'cocktail'} source 
 */
function renderIdleState(source) {
  const isMeal = source === 'meal';
  const title = isMeal ? 'Ready for a Delicious Meal?' : 'Craft the Perfect Cocktail';
  const description = isMeal 
    ? 'Click the button below or the "Surprise Me!" button above to discover a random gourmet meal recipe with ingredients and step-by-step instructions.'
    : 'Click the button below or the "Surprise Me!" button above to get a random cocktail recipe, complete with measure details and mixology guidance.';
  const btnLabel = isMeal ? '🎲 Generate Random Meal Now' : '🍸 Generate Random Cocktail Now';

  return `
    <div class="bg-white dark:bg-slate-800 rounded-2xl p-8 md:p-12 shadow-lg border border-slate-100 dark:border-slate-700/60 text-center max-w-2xl mx-auto my-6">
      <div class="w-16 h-16 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
        ${isMeal ? ICONS.MEAL : ICONS.COCKTAIL}
      </div>
      <h2 class="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">
        ${title}
      </h2>
      <p class="text-slate-600 dark:text-slate-300 text-base leading-relaxed mb-8 max-w-lg mx-auto">
        ${description}
      </p>
      <button 
        id="idle-generate-btn"
        aria-label="${btnLabel}"
        class="ripple-container inline-flex items-center text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-95 px-6 py-3.5 rounded-xl shadow-lg shadow-indigo-500/25 transition-all duration-200 cursor-pointer focus:outline-none"
      >
        <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 mr-2.5 animate-pulse"></span>
        ${btnLabel}
      </button>
    </div>
  `;
}

/**
 * Render Zero-CLS Skeleton Loading Card
 * Occupies the exact same computed height and layout structure as the final card to eliminate CLS.
 */
function renderSkeletonState() {
  return `
    <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700/60 overflow-hidden max-w-4xl mx-auto my-6">
      <div class="grid grid-cols-1 md:grid-cols-12 gap-0">
        <!-- Skeleton Image (Same ratio) -->
        <div class="md:col-span-5 aspect-square md:aspect-auto skeleton-box min-h-[300px]"></div>
        
        <!-- Skeleton Body -->
        <div class="md:col-span-7 p-6 md:p-8 space-y-6 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-4">
              <div class="h-6 w-28 skeleton-box rounded-full"></div>
              <div class="h-10 w-10 skeleton-box rounded-full"></div>
            </div>
            
            <div class="h-8 w-3/4 skeleton-box mb-4"></div>
            <div class="h-4 w-1/2 skeleton-box mb-6"></div>

            <!-- Skeleton Ingredients -->
            <div class="space-y-2 mb-6">
              <div class="h-4 w-1/3 skeleton-box mb-3"></div>
              <div class="grid grid-cols-2 gap-2">
                <div class="h-4 skeleton-box"></div>
                <div class="h-4 skeleton-box"></div>
                <div class="h-4 skeleton-box"></div>
                <div class="h-4 skeleton-box"></div>
              </div>
            </div>
          </div>

          <!-- Skeleton Actions -->
          <div class="pt-4 border-t border-slate-100 dark:border-slate-700 flex gap-3">
            <div class="h-10 w-24 skeleton-box rounded-lg"></div>
            <div class="h-10 w-24 skeleton-box rounded-lg"></div>
            <div class="h-10 w-24 skeleton-box rounded-lg"></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render Error State Card with Retry Button
 * @param {Object} error 
 * @param {'meal'|'cocktail'} source 
 */
function renderErrorState(error, source) {
  const message = error && error.message 
    ? error.message 
    : 'Unable to load recipe right now. Please try again.';

  return `
    <div class="bg-white dark:bg-slate-800 rounded-2xl p-8 md:p-10 shadow-lg border border-red-100 dark:border-red-900/30 text-center max-w-xl mx-auto my-6">
      <div class="w-14 h-14 bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
        </svg>
      </div>
      
      <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2">
        Fetch Error
      </h3>
      
      <p class="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-6">
        ${escapeHTML(message)}
      </p>

      <button id="retry-btn" class="inline-flex items-center px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-medium text-sm transition-all shadow-md focus:outline-none">
        ${ICONS.RETRY} Retry Fetch
      </button>
    </div>
  `;
}

/**
 * Render Complete Recipe Card Component
 * @param {Object} item - Meal or Drink object
 * @param {'meal'|'cocktail'} source 
 */
function renderRecipeCard(item, source) {
  const isMeal = source === 'meal' || !!item.idMeal;
  const maxSlots = isMeal ? 20 : 15;
  const ingredients = parseIngredients(item, maxSlots);

  // Field extraction & null guards
  const id = getItemId(item);
  const title = isMeal ? (item.strMeal || 'Untitled Meal') : (item.strDrink || 'Untitled Cocktail');
  const image = isMeal ? item.strMealThumb : item.strDrinkThumb;
  const category = item.strCategory || null;
  const tags = item.strTags ? item.strTags.split(',').map(t => t.trim()).filter(Boolean) : [];
  
  // Specific Metadata conditional rendering
  const originArea = isMeal ? item.strArea : null;
  const alcoholicType = !isMeal ? item.strAlcoholic : null;
  const glassType = !isMeal ? item.strGlass : null;

  // Media links
  const youtubeUrl = isMeal && item.strYoutube && item.strYoutube.trim() ? item.strYoutube.trim() : null;
  const sourceUrl = item.strSource && item.strSource.trim() ? item.strSource.trim() : null;

  // Favorite state
  const favorited = isItemFavorited(item);

  // Instructions formatting
  const rawInstructions = item.strInstructions || 'No instructions provided.';
  const instructionParagraphs = formatInstructions(rawInstructions);
  const isLongInstructions = rawInstructions.length > 350 || instructionParagraphs.length > 3;

  return `
    <article class="recipe-card bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700/60 overflow-hidden max-w-4xl mx-auto my-6 transition-all duration-300">
      <div class="grid grid-cols-1 md:grid-cols-12">
        
        <!-- Recipe Header Image Container -->
        <div class="md:col-span-5 relative bg-slate-900 overflow-hidden min-h-[280px] md:min-h-full">
          <img 
            src="${escapeHTML(image || ICONS.FALLBACK_IMG)}" 
            alt="${escapeHTML(title)}"
            loading="lazy"
            width="400"
            height="400"
            onerror="this.onerror=null; this.src='${ICONS.FALLBACK_IMG}';"
            class="recipe-image w-full h-full object-cover min-h-[280px] transition-transform duration-500 hover:scale-105"
          />
          
          <!-- Category & Tag Overlay Badges -->
          <div class="absolute top-4 left-4 flex flex-wrap gap-1.5 pr-12 no-print">
            ${category ? `<span class="px-3 py-1 text-xs font-semibold rounded-full bg-slate-900/80 backdrop-blur-md text-white border border-white/20">${escapeHTML(category)}</span>` : ''}
            ${originArea ? `<span class="px-3 py-1 text-xs font-semibold rounded-full bg-indigo-900/80 backdrop-blur-md text-indigo-100 border border-indigo-500/30">${escapeHTML(originArea)}</span>` : ''}
            ${alcoholicType ? `<span class="px-3 py-1 text-xs font-semibold rounded-full bg-amber-900/80 backdrop-blur-md text-amber-100 border border-amber-500/30">${escapeHTML(alcoholicType)}</span>` : ''}
            ${glassType ? `<span class="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-900/80 backdrop-blur-md text-emerald-100 border border-emerald-500/30">${escapeHTML(glassType)}</span>` : ''}
          </div>

          <!-- Heart Favorite Toggle Button -->
          <button 
            id="fav-toggle-btn"
            data-id="${escapeHTML(id)}"
            aria-label="${favorited ? 'Remove from favorites' : 'Save to favorites'}"
            title="${favorited ? 'Remove from favorites' : 'Save to favorites'}"
            class="heart-btn absolute top-4 right-4 p-3 rounded-full bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 shadow-lg backdrop-blur-md hover:bg-white dark:hover:bg-slate-900 focus:outline-none transition-all no-print"
          >
            ${favorited ? ICONS.HEART_FILLED : ICONS.HEART_OUTLINE}
          </button>
        </div>

        <!-- Recipe Content Info -->
        <div class="md:col-span-7 p-6 md:p-8 flex flex-col justify-between">
          <div>
            <!-- Title & Tags -->
            <div class="mb-4">
              <h1 class="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
                ${escapeHTML(title)}
              </h1>

              ${tags.length > 0 ? `
                <div class="flex flex-wrap gap-1.5 mt-2">
                  ${tags.map(tag => `<span class="px-2.5 py-0.5 text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md">#${escapeHTML(tag)}</span>`).join('')}
                </div>
              ` : ''}
            </div>

            <!-- Ingredients Section -->
            <div class="mb-6">
              <h2 class="text-sm uppercase tracking-wider font-bold text-indigo-600 dark:text-indigo-400 mb-3 flex items-center">
                Ingredients (${ingredients.length})
              </h2>
              
              <ul class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-700 dark:text-slate-200">
                ${ingredients.map(item => `
                  <li class="flex items-start bg-slate-50 dark:bg-slate-700/40 p-2 rounded-lg border border-slate-100 dark:border-slate-700/50">
                    <span class="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 mr-2 flex-shrink-0"></span>
                    <span class="font-medium">${escapeHTML(item.ingredient)}</span>
                    ${item.measure ? `<span class="ml-auto text-xs text-slate-600 dark:text-slate-300 font-semibold bg-white dark:bg-slate-700 px-2 py-0.5 rounded shadow-xs border border-slate-200 dark:border-slate-600">${escapeHTML(item.measure)}</span>` : ''}
                  </li>
                `).join('')}
              </ul>
            </div>

            <!-- Instructions Section -->
            <div class="mb-6">
              <h2 class="text-sm uppercase tracking-wider font-bold text-indigo-600 dark:text-indigo-400 mb-3">
                Preparation Instructions
              </h2>

              <div id="instructions-body" class="${isLongInstructions ? 'line-clamp-collapsed' : 'line-clamp-expanded'} text-slate-600 dark:text-slate-300 text-sm leading-relaxed space-y-3">
                ${instructionParagraphs.map(p => `<p>${escapeHTML(p)}</p>`).join('')}
              </div>

              ${isLongInstructions ? `
                <button 
                  id="instructions-toggle-btn"
                  aria-expanded="false"
                  aria-controls="instructions-body"
                  class="mt-3 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 focus:outline-none underline flex items-center no-print"
                >
                  Show More Instructions
                </button>
              ` : ''}
            </div>
          </div>

          <!-- Bottom Action Toolbar -->
          <div class="pt-4 border-t border-slate-100 dark:border-slate-700/60 flex flex-wrap gap-2 items-center justify-between no-print">
            <div class="flex flex-wrap gap-2">
              <button 
                id="copy-btn" 
                class="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-semibold text-xs transition-colors flex items-center focus:outline-none"
              >
                ${ICONS.COPY} Copy
              </button>
              
              <button 
                id="share-btn" 
                class="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-semibold text-xs transition-colors flex items-center focus:outline-none"
              >
                ${ICONS.SHARE} Share
              </button>

              <button 
                id="print-btn" 
                class="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-semibold text-xs transition-colors flex items-center focus:outline-none"
              >
                ${ICONS.PRINT} Print
              </button>
            </div>

            <div class="flex flex-wrap gap-2 mt-2 sm:mt-0">
              ${youtubeUrl ? `
                <a 
                  href="${escapeHTML(youtubeUrl)}" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  class="px-3.5 py-2 rounded-lg bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-700 dark:text-red-300 font-semibold text-xs transition-colors flex items-center border border-red-200 dark:border-red-800"
                >
                  ${ICONS.YOUTUBE} Watch Video
                </a>
              ` : ''}

              ${sourceUrl ? `
                <a 
                  href="${escapeHTML(sourceUrl)}" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  class="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors flex items-center"
                >
                  ${ICONS.EXTERNAL_LINK} Source
                </a>
              ` : ''}
            </div>
          </div>
        </div>

      </div>
    </article>
  `;
}

/**
 * Setup Instruction Line Clamp Expansion listener
 */
function setupInstructionToggle() {
  const toggleBtn = document.getElementById('instructions-toggle-btn');
  const body = document.getElementById('instructions-body');

  if (toggleBtn && body) {
    toggleBtn.addEventListener('click', () => {
      const isCollapsed = body.classList.contains('line-clamp-collapsed');
      if (isCollapsed) {
        body.classList.remove('line-clamp-collapsed');
        body.classList.add('line-clamp-expanded');
        toggleBtn.setAttribute('aria-expanded', 'true');
        toggleBtn.textContent = 'Show Less Instructions';
      } else {
        body.classList.remove('line-clamp-expanded');
        body.classList.add('line-clamp-collapsed');
        toggleBtn.setAttribute('aria-expanded', 'false');
        toggleBtn.textContent = 'Show More Instructions';
      }
    });
  }
}

/**
 * Split instruction text into formatted paragraph strings
 * Handles both newlines (\r\n, \n) and numbered steps (STEP 1, 1. )
 * @param {string} raw 
 * @returns {Array<string>}
 */
function formatInstructions(raw) {
  if (!raw) return [];
  
  // Replace step headers like "STEP 1" with newlines
  let cleaned = raw.replace(/(STEP\s+\d+|Step\s+\d+)/gi, '\n$1');
  
  // Split on newlines
  const parts = cleaned
    .split(/\r?\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  return parts.length > 0 ? parts : [raw.trim()];
}

/**
 * Render History Sidebar Panel (Max 5 items, deduped)
 * @param {Array} history 
 * @param {Object|null} currentItem 
 */
function renderHistoryPanel(history, currentItem) {
  const container = document.getElementById('history-list');
  if (!container) return;

  const currentId = getItemId(currentItem);

  if (!history || history.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 text-slate-600 dark:text-slate-400">
        <svg class="w-10 h-10 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <p class="text-xs font-medium">No history yet</p>
        <p class="text-[11px] text-slate-600 dark:text-slate-400 mt-1">Generated recipes will appear here.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = history.map(item => {
    const id = getItemId(item);
    const title = item.strMeal || item.strDrink || 'Untitled';
    const thumb = item.strMealThumb || item.strDrinkThumb || ICONS.FALLBACK_IMG;
    const category = item.strCategory || (item.idMeal ? 'Meal' : 'Cocktail');
    const isActive = id === currentId;

    return `
      <button 
        data-history-id="${escapeHTML(id)}"
        class="w-full text-left p-2.5 rounded-xl transition-all flex items-center gap-3 border ${
          isActive 
            ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-700 shadow-sm' 
            : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-750'
        }"
      >
        <img 
          src="${escapeHTML(thumb)}" 
          alt="${escapeHTML(title)}" 
          loading="lazy" 
          width="48" 
          height="48" 
          onerror="this.onerror=null; this.src='${ICONS.FALLBACK_IMG}';"
          class="w-12 h-12 rounded-lg object-cover flex-shrink-0"
        />
        <div class="min-w-0 flex-1">
          <p class="text-xs font-bold text-slate-900 dark:text-white truncate">
            ${escapeHTML(title)}
          </p>
          <span class="text-[10px] uppercase font-semibold tracking-wider text-slate-600 dark:text-slate-400">
            ${escapeHTML(category)}
          </span>
        </div>
      </button>
    `;
  }).join('');
}

/**
 * Render Favorites Sidebar Panel
 * @param {Array} favorites 
 * @param {Object|null} currentItem 
 */
function renderFavoritesPanel(favorites, currentItem) {
  const container = document.getElementById('favorites-list');
  if (!container) return;

  const currentId = getItemId(currentItem);

  if (!favorites || favorites.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 text-slate-600 dark:text-slate-400">
        <svg class="w-10 h-10 mx-auto mb-2 opacity-50 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.684a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
        </svg>
        <p class="text-xs font-medium">No favorites saved</p>
        <p class="text-[11px] text-slate-600 dark:text-slate-400 mt-1">Click the heart icon on any recipe to save it here.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = favorites.map(item => {
    const id = getItemId(item);
    const title = item.strMeal || item.strDrink || 'Untitled';
    const thumb = item.strMealThumb || item.strDrinkThumb || ICONS.FALLBACK_IMG;
    const category = item.strCategory || (item.idMeal ? 'Meal' : 'Cocktail');
    const isActive = id === currentId;

    return `
      <div 
        class="w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between gap-2 border ${
          isActive 
            ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-700 shadow-sm' 
            : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-750'
        }"
      >
        <button 
          data-favorite-id="${escapeHTML(id)}"
          class="flex items-center gap-3 min-w-0 flex-1 text-left focus:outline-none"
        >
          <img 
            src="${escapeHTML(thumb)}" 
            alt="${escapeHTML(title)}" 
            loading="lazy" 
            width="48" 
            height="48" 
            onerror="this.onerror=null; this.src='${ICONS.FALLBACK_IMG}';"
            class="w-12 h-12 rounded-lg object-cover flex-shrink-0"
          />
          <div class="min-w-0 flex-1">
            <p class="text-xs font-bold text-slate-900 dark:text-white truncate">
              ${escapeHTML(title)}
            </p>
            <span class="text-[10px] uppercase font-semibold tracking-wider text-slate-600 dark:text-slate-400">
              ${escapeHTML(category)}
            </span>
          </div>
        </button>

        <button 
          data-remove-fav-id="${escapeHTML(id)}"
          title="Remove from favorites"
          aria-label="Remove ${escapeHTML(title)} from favorites"
          class="p-1.5 text-slate-400 hover:text-red-500 focus:outline-none transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
          </svg>
        </button>
      </div>
    `;
  }).join('');
}

/**
 * Toast Notification Dispatcher
 * @param {string} message 
 * @param {'info'|'success'|'warning'|'error'} [type='info'] 
 */
export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  
  let bgColors = 'bg-slate-900 text-white dark:bg-white dark:text-slate-900';
  if (type === 'success') bgColors = 'bg-emerald-600 text-white';
  if (type === 'error') bgColors = 'bg-red-600 text-white';

  toast.className = `toast px-4 py-3 rounded-xl shadow-xl text-xs font-semibold flex items-center justify-between gap-3 ${bgColors}`;
  toast.innerHTML = `
    <span>${escapeHTML(message)}</span>
    <button aria-label="Close" class="opacity-70 hover:opacity-100 focus:outline-none ml-2">&times;</button>
  `;

  const closeBtn = toast.querySelector('button');
  const dismiss = () => {
    toast.classList.add('toast-out');
    setTimeout(() => toast.remove(), 200);
  };

  closeBtn.addEventListener('click', dismiss);
  setTimeout(dismiss, 3500);

  container.appendChild(toast);
}

/**
 * Security Helper to escape HTML strings against XSS injection
 * @param {string} str 
 * @returns {string}
 */
function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
