/**
 * Router Module
 * A lightweight client-side router with caching and modular page support.
 * 
 * Features:
 * - In-memory and sessionStorage-based caching
 * - Custom page handlers
 * - Automatic script loading per page
 * - URL parameter management
 * - History navigation support
 * 
 * Usage:
 * 
 * ```js
 * Router.onPage('about', (html, params, hydrate) => {
 *   render(ref('root'), html);
 *   hydrate(); // executes page-specific JS
 * });
 * 
 * Router.init(); // start routing
 * ```
 */

/**
 * Stores custom page callbacks for specific routes.
 * @type {Map<string, Function>}
 */
const pageHandlers = new Map();

/**
 * In-memory HTML/JS page cache.
 * @type {Map<string, string>}
 */
const pageCache = new Map();

/**
 * Enable persistent caching using sessionStorage.
 * Set to `true` to persist cache across refreshes.
 * @type {boolean}
 */
const usePersistentCache = false;

/**
 * Listens to browser history events and handles route changes.
 */
window.addEventListener('popstate', () => {
    handleRouteChange();
});

/**
 * Generates a unique cache key for sessionStorage.
 * @param {string} page - The page name.
 * @param {string} [type='html'] - Type of content ('html' or 'js').
 * @returns {string} Generated cache key.
 */
const cacheKey = (page, type = 'html') => `RouterCache:${type}:${page}`;

/**
 * Retrieves cached page content from memory or sessionStorage.
 * @param {string} page - Page name.
 * @param {string} [type='html'] - Type of content.
 * @returns {string|null} Cached content or `null` if not found.
 */
const getCachedPage = (page, type = 'html') => {
    if (usePersistentCache) {
        const cached = sessionStorage.getItem(cacheKey(page, type));
        if (cached) return cached;
    }
    return pageCache.get(`${type}:${page}`) || null;
};

/**
 * Stores page content in memory or sessionStorage.
 * @param {string} page - Page name.
 * @param {string} content - Page HTML/JS to cache.
 * @param {string} [type='html'] - Type of content.
 */
const setCachedPage = (page, content, type = 'html') => {
    if (usePersistentCache) {
        sessionStorage.setItem(cacheKey(page, type), content);
    } else {
        pageCache.set(`${type}:${page}`, content);
    }
};

/**
 * Clears all router-related cache entries.
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
 * Monkey-patches history.pushState and history.replaceState
 * to automatically react to programmatic navigation.
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
 * Extracts URL query parameters into a plain object.
 * @returns {Object.<string, string>} Query parameters as key-value pairs.
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
 * Programmatically navigates to a new route, updating the URL.
 * 
 * @param {Object.<string, string>} params - Parameters to set in the query string.
 * @param {{preserveParams?: boolean}} [options={}] - Whether to keep other query params.
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
 * Registers a custom handler for a specific page.
 * 
 * @param {string} pageName - Page name to register.
 * @param {(html: string, params: Object.<string, string>, hydrate: () => void) => void} callback 
 * Function called with loaded HTML, query params, and script hydration function.
 */
const onPage = (pageName, callback) => {
    pageHandlers.set(pageName, callback);
};

/**
 * Fetches, caches, and renders a page.
 * If a handler is registered, it will be called.
 * Otherwise, default rendering occurs.
 */
const handleRouteChange = async () => {
    const params = getParams();
    const page = params.page || 'home';
    const handler = pageHandlers.get(page);
    let html = getCachedPage(page);

    try {
        if (!html) {
            const response = await fetch(`pages/${page}.html`);
            html = await response.text();
            setCachedPage(page, html);
        }

        const hydrate = await loadPageScript(page);

        if (typeof handler === 'function') {
            handler(html, params, hydrate);
        } else {
            const root = ref("root") || document.body;
            render(root, inject(html, params));
            hydrate();
        }
    } catch (err) {
        console.error(`Failed to load page: pages/${page}.html`, err);
        const errorHtml = `<h2>Error loading page: ${page}</h2>`;

        if (typeof handler === 'function') {
            handler(errorHtml, params, () => {});
        } else {
            const root = ref("root") || document.body;
            render(root, errorHtml);
        }
    }
};

/**
 * Loads and caches a JS script for a page.
 * 
 * @param {string} page - Page name.
 * @returns {Promise<() => void>} Hydration function that executes the JS.
 */
const loadPageScript = async (page) => {
    let jsCode = getCachedPage(page, 'js');

    if (!jsCode) {
        try {
            const jsResponse = await fetch(`scripts/${page}.js`);
            if (jsResponse.ok) {
                jsCode = await jsResponse.text();
                setCachedPage(page, jsCode, 'js');
            }
        } catch (err) {
            console.warn(`JS load failed for page: ${page}`, err);
        }
    }

    return () => {
        if (jsCode) {
            try {
                eval(jsCode);
            } catch (e) {
                console.error(`Error executing JS for page: ${page}`, e);
            }
        }
    };
};

/**
 * Initializes the router.
 * Should be called once on app startup.
 */
const init = () => {
    patchHistoryMethods();
    handleRouteChange();
};

/**
 * Global Router API
 * 
 * @namespace
 * @property {Function} init - Initializes the router.
 * @property {Function} navigate - Navigates to a new page.
 * @property {Function} getParams - Gets current URL query parameters.
 * @property {Function} onPage - Registers a page-specific handler.
 * @property {Function} clearCache - Clears all cached pages.
 */
window.Router = {
    init,
    navigate,
    getParams,
    onPage,
    clearCache,
};
