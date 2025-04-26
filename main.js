/**
 * DOM reference to the root element where page content will be rendered.
 * @type {HTMLElement}
 */
const root = ref("root");

/**
 * Reference to the "Create" button which navigates to the car creation page.
 * @type {HTMLElement}
 */
const btnCreate = ref("btn-create");

/**
 * Event handler for navigating to the 'create' page.
 */
btnCreate.onclick = () => {
  Router.navigate({ page: "create" });
};

/**
 * Route handler for the "home" page.
 *
 * Fetches all car data from the API and injects it into the provided HTML template.
 * Renders the result into the root element. Handles API or rendering errors gracefully.
 *
 * @param {string} html - The HTML template to be rendered.
 */
Router.onPage('home', async (html) => {
  try {
    const res = await api("car");
    const cars = await res.json();
    
    render(root, inject(html, { cars }));
  } catch (error) {
    renderError(root, "Error while loading cars");
  }
});

/**
 * Route handler for the "car" details page.
 *
 * Fetches specific car details based on the provided `id`, injects the data into the HTML,
 * and hydrates interactive elements afterward.
 *
 * @param {string} html - The HTML template to render.
 * @param {{id: number|string}} param1 - Route parameters, including the car's ID.
 * @param {Function} hydrate - Function to re-bind event listeners or reinitialize dynamic elements.
 */
Router.onPage('car', async (html, { id }, hydrate) => {
  try {
    const res = await api(`car/${id}`);
    const car = await res.json();

    render(root, inject(html, car));
    hydrate();
  } catch (error) {
    renderError(root, `Error while loading car with id ${id}`);
  }
});

/**
 * Initializes the Router to start handling page navigation.
 */
Router.init();
