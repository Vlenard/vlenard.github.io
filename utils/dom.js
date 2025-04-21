/**
 * Handles all internal link clicks with `data-link` attribute.
 * Extracts query params from attributes and navigates using Router.
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
 * @param {string} unsafe - The potentially unsafe string.
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
 * Injects parameters into an HTML template string.
 * Supports basic templating with if conditions, each loops, and variable replacement.
 * 
 * Syntax supported:
 * - {{ key }} – variable injection (escaped)
 * - {{#if key}}...{{/if}} – conditional rendering
 * - {{#each list}}...{{/each}} – loop over arrays. nested loops not supported
 * - a[data-link page="name" attr="{{key}}"] generate link
 * 
 * @param {string} html - The HTML template.
 * @param {object} [params={}] - Key-value map of parameters to inject.
 * @returns {string} The final HTML string with all parameters injected.
 */
const inject = (html, params = {}) => {
    // Handle loops: {{#each list}} ... {{/each}}
    html = html.replace(/{{#each\s+(\w+)}}([\s\S]*?){{\/each}}/g, (_, key, content) => {
        const arr = params[key];
        if (!Array.isArray(arr)) return '';
        return arr.map(item => inject(content, item)).join('');
    });

    // Handle conditional blocks: {{#if key}} ... {{/if}}
    html = html.replace(/{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g, (_, key, content) => {
        return params[key] ? content : '';
    });

    // Replace {{ key }} with escaped value
    html = html.replace(/{{\s*(\w+)\s*}}/g, (_, key) => {
        return params[key] !== undefined ? escapeHtml(params[key]) : '';
    });

    return html;
};

/**
 * Renders raw HTML into a DOM element.
 * 
 * @param {HTMLElement} root - The root element where HTML will be injected.
 * @param {string} html - The HTML content to render.
 */
const render = (root, html) => {
    root.innerHTML = html;
};

/**
 * Renders an error message into a DOM element.
 * 
 * @param {HTMLElement} root - The root element for the error message.
 * @param {string} error - The error message to display.
 */
const renderError = (root, error) => {
    root.innerHTML = `<p class="error">${escapeHtml(error)}</p>`;
};

/**
 * Returns a reference to a DOM element by its ID.
 * 
 * @param {string} id - The ID of the HTML element.
 * @returns {HTMLElement|null} The element with the given ID, or null if not found.
 */
const ref = (id) => document.getElementById(id);

window.DOM = {
    render,
    renderError,
    inject,
    ref
};