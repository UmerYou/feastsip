/**
 * API Module - Handles API requests for TheMealDB and TheCocktailDB with standard parsing and resilient error boundaries.
 */

const MEAL_API_URL = 'https://www.themealdb.com/api/json/v1/1/random.php';
const COCKTAIL_API_URL = 'https://www.thecocktaildb.com/api/json/v1/1/random.php';

/**
 * Shared Ingredient Parser
 * @param {Object} item - Meal or Drink object
 * @param {number} maxSlots - 20 for meals, 15 for cocktails
 * @returns {Array<{ingredient: string, measure: string}>}
 */
export function parseIngredients(item, maxSlots) {
  if (!item || typeof item !== 'object') return [];

  const ingredients = [];

  for (let i = 1; i <= maxSlots; i++) {
    const rawIng = item[`strIngredient${i}`];
    const rawMeas = item[`strMeasure${i}`];

    // Check if ingredient exists and is non-empty after trimming
    if (rawIng !== null && rawIng !== undefined) {
      const ingredient = String(rawIng).trim();
      if (ingredient.length > 0) {
        let measure = '';
        if (rawMeas !== null && rawMeas !== undefined) {
          const trimmedMeas = String(rawMeas).trim();
          if (trimmedMeas.length > 0 && trimmedMeas.toLowerCase() !== 'null') {
            measure = trimmedMeas;
          }
        }
        ingredients.push({ ingredient, measure });
      }
    }
  }

  return ingredients;
}

/**
 * Helper to execute API requests and catch all 4 distinct failure modes:
 * 1. Network / Transport error (offline, CORS, network drop)
 * 2. Non-2xx HTTP status code
 * 3. JSON parse error
 * 4. Null / empty payload
 * 
 * @param {string} url 
 * @param {string} dataKey - 'meals' or 'drinks'
 * @returns {Promise<{success: boolean, data?: Object, errorType?: string, message?: string}>}
 */
async function fetchRandomItem(url, dataKey) {
  // Mode 1: Offline check before network attempt
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    const errorMsg = 'You are currently offline. Please check your internet connection.';
    console.error(`[API Transport Error] Offline state detected for ${url}`);
    return {
      success: false,
      errorType: 'OFFLINE',
      message: errorMsg
    };
  }

  let response;
  try {
    response = await fetch(url, { cache: 'no-cache' });
  } catch (transportError) {
    // Mode 1: Network / Transport failure during fetch call
    console.error(`[API Transport Error] Network request failed for ${url}:`, transportError);
    return {
      success: false,
      errorType: 'TRANSPORT_ERROR',
      message: 'Network request failed. Please check your connection and try again.'
    };
  }

  // Mode 2: Non-2xx HTTP status code
  if (!response.ok) {
    console.error(`[API Status Error] Received HTTP status ${response.status} from ${url}`);
    return {
      success: false,
      errorType: 'HTTP_ERROR',
      message: `Server returned an error (HTTP ${response.status}). Please try again later.`
    };
  }

  let jsonData;
  try {
    jsonData = await response.json();
  } catch (parseError) {
    // Mode 3: JSON Parse error
    console.error(`[API Parse Error] Failed to parse JSON response from ${url}:`, parseError);
    return {
      success: false,
      errorType: 'JSON_PARSE_ERROR',
      message: 'Received invalid data format from the server. Please try again.'
    };
  }

  // Mode 4: Null or Empty data payload
  if (!jsonData || !Array.isArray(jsonData[dataKey]) || jsonData[dataKey].length === 0 || jsonData[dataKey][0] === null) {
    console.error(`[API Payload Error] Empty or null data payload for key "${dataKey}" from ${url}:`, jsonData);
    return {
      success: false,
      errorType: 'EMPTY_PAYLOAD',
      message: 'No recipe items were returned by the service. Please try again.'
    };
  }

  const item = jsonData[dataKey][0];
  return {
    success: true,
    data: item
  };
}

/**
 * Fetch a random meal recipe from TheMealDB
 * @returns {Promise<Object>} Result object
 */
export async function fetchRandomMeal() {
  return fetchRandomItem(MEAL_API_URL, 'meals');
}

/**
 * Fetch a random cocktail recipe from TheCocktailDB
 * @returns {Promise<Object>} Result object
 */
export async function fetchRandomCocktail() {
  return fetchRandomItem(COCKTAIL_API_URL, 'drinks');
}
