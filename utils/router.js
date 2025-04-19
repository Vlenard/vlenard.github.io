/**
 * Stores custom page callbacks for specific routes.
 * @type {Map<string, Function>}
 */
const pageHandlers = new Map();

/**
 * In-memory HTML page cache.
 * @type {Map<string, string>}
 */
const pageCache = new Map();

/**
 * Enable persistent caching in sessionStorage if true.
 * Useful for production or refresh-safe caching.
 * @type {boolean}
 */
const usePersistentCache = false;

// Listen for browser back/forward navigation
window.addEventListener('popstate', () => {
    handleRouteChange();
});

/**
 * Generates a unique cache key for sessionStorage.
 * @param {string} page - The page name.
 * @returns {string}
 */
const cacheKey = (page) => `RouterCache:${page}`;

/**
 * Retrieves a cached HTML page (from memory or sessionStorage).
 * @param {string} page - Page name to retrieve.
 * @returns {string|null}
 */
const getCachedPage = (page) => {
    if (usePersistentCache) {
        const cached = sessionStorage.getItem(cacheKey(page));
        if (cached) return cached;
    }
    return pageCache.get(page) || null;
};

/**
 * Caches an HTML page (to memory or sessionStorage).
 * @param {string} page - Page name to cache.
 * @param {string} html - HTML content to cache.
 */
const setCachedPage = (page, html) => {
    if (usePersistentCache) {
        sessionStorage.setItem(cacheKey(page), html);
    } else {
        pageCache.set(page, html);
    }
};

/**
 * Clears all router-related cache.
 */
const clearCache = () => {
    if (usePersistentCache) {
        Object.keys(sessionStorage)
            .filter((k) => k.startsWith('RouterCache:'))
            .forEach((k) => sessionStorage.removeItem(k));
    }
    pageCache.clear();
};

/**
 * Monkey-patches `history.pushState` and `replaceState` to react to programmatic navigation.
 */
const patchHistoryMethods = () => {
    ['pushState', 'replaceState'].forEach((type) => {
        const original = history[type];
        history[type] = function (...args) {
            const result = original.apply(this, args);
            handleRouteChange();
            return result;
        };
    });
};

/**
 * Extracts the URL search parameters as an object.
 * @returns {Object.<string, string>}
 */
const getParams = () => {
    const searchParams = new URLSearchParams(window.location.search);
    const result = {};
    for (const [key, value] of searchParams.entries()) {
        result[key] = value;
    }
    return result;
};

/**
 * Navigates to a new route, updating the URL search parameters.
 * By default, removes any unmentioned params unless `options.preserveParams` is true.
 * 
 * @param {Object.<string, string>} params - Parameters to update in the URL.
 * @param {{preserveParams?: boolean}} [options={}] - Preserve old params if true.
 */
const navigate = (params = {}, options = {}) => {
    const url = new URL(window.location);
    const allowedKeys = new Set(['page', ...Object.keys(params)]);

    for (const key of url.searchParams.keys()) {
        if (!allowedKeys.has(key) && !options.preserveParams) {
            url.searchParams.delete(key);
        }
    }

    Object.entries(params).forEach(([key, value]) => {
        if (value == null) {
            url.searchParams.delete(key);
        } else {
            url.searchParams.set(key, value);
        }
    });

    history.pushState({}, '', url);
};

/**
 * Registers a callback function for a specific page.
 * 
 * @param {string} pageName - Page name to match against `page` query param.
 * @param {(html: string, params: Object.<string, string>) => void} callback - Callback to run.
 */
const onPage = (pageName, callback) => {
    pageHandlers.set(pageName, callback);
};

/**
 * Handles routing logic: fetches and renders a page, invokes callbacks.
 */
const handleRouteChange = async () => {
    const params = getParams();
    const page = params.page || 'home';
    const handler = pageHandlers.get(page);

    let html = getCachedPage(page);

    try {
        // If not cached, fetch and store
        if (!html) {
            const response = await fetch(`pages/${page}.html`);
            html = await response.text();
            setCachedPage(page, html);
        }

        if (typeof handler === 'function') {
            handler(html, params);
        } else {
            const root = ref("root") || document.body;
            render(root, inject(html, params));
        }
    } catch (err) {
        console.error(`Failed to load page: pages/${page}.html`, err);
        const errorHtml = `<h2>Error loading page: ${page}</h2>`;

        if (typeof handler === 'function') {
            handler(errorHtml, params);
        } else {
            const root = ref("root") || document.body;
            render(root, errorHtml);
        }
    }
};

/**
 * Initializes the router: sets up history patching and triggers the first route.
 */
const init = () => {
    patchHistoryMethods();
    handleRouteChange();
};

// Expose Router API globally
window.Router = {
    init,
    navigate,
    getParams,
    onPage,
    clearCache,
};
