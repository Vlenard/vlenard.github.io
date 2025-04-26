/**
 * Handles all internal link clicks with `data-link` attribute.
 * Extracts custom query parameters from `data-*` attributes (excluding `data-link` and `href`)
 * and uses the Router to navigate without full page reload.
 * 
 * Example:
 * <a data-link data-page="about" data-id="123">About</a>
 */
document.addEventListener('click', (e) => {
    const target = e.target.closest("[data-link]");
    if (!target) return;

    e.preventDefault();

    const params = {};
    for (const attr of target.attributes) {
        if (attr.name !== 'href' && attr.name !== 'data-link' && attr.name.startsWith("data-")) {
            params[attr.name.split("-")[1]] = attr.value;
        }
    }

    Router.navigate(params);
});

/**
 * Escapes a string for safe insertion into HTML.
 * Prevents XSS by converting special characters to HTML entities.
 * 
 * @param {string} unsafe - The potentially unsafe string to escape.
 * @returns {string} The escaped HTML-safe string.
 */
const escapeHtml = (unsafe) => {
    return String(unsafe)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

/**
 * Injects dynamic parameters into an HTML template string.
 * Supports basic templating syntax:
 * 
 * - `{{ key }}` — inserts the escaped value of the given key.
 * - `{{#if key}}...{{/if}}` — conditionally renders content if key exists and is truthy.
 * - `{{#each list}}...{{/each}}` — iterates over arrays; supports one level of nesting.
 * 
 * @param {string} html - The raw HTML template string.
 * @param {object} [params={}] - Key-value map of parameters to inject.
 * @returns {string} The final HTML string with injected and escaped content.
 */
const inject = (html, params = {}) => {
    html = html.replace(/{{#each\s+(\w+)}}([\s\S]*?){{\/each}}/g, (_, key, content) => {
        const arr = params[key];
        if (!Array.isArray(arr)) return '';
        return arr.map(item => inject(content, item)).join('');
    });

    html = html.replace(/{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g, (_, key, content) => {
        return params[key] ? content : '';
    });

    html = html.replace(/{{\s*(\w+)\s*}}/g, (_, key) => {
        return params[key] !== undefined ? escapeHtml(params[key]) : '';
    });

    return html;
};

/**
 * Renders raw HTML into a specified DOM element.
 * 
 * @param {HTMLElement} root - The target element to render into.
 * @param {string} html - The HTML content to inject.
 */
const render = (root, html) => {
    root.innerHTML = html;
};

/**
 * Displays an error message inside a DOM element.
 * The message is escaped to prevent XSS vulnerabilities.
 * 
 * @param {HTMLElement} root - The element where the error should be shown.
 * @param {string} error - The raw error message.
 */
const renderError = (root, error) => {
    root.innerHTML = `<p class="error">${escapeHtml(error)}</p>`;
};

/**
 * Retrieves a DOM element by its ID.
 * 
 * @param {string} id - The ID of the element to find.
 * @returns {HTMLElement|null} The element if found, or null otherwise.
 */
const ref = (id) => document.getElementById(id);

/**
 * Global DOM utility object for rendering and HTML injection.
 * @namespace
 */
window.DOM = {
    render,
    renderError,
    inject,
    ref
};
