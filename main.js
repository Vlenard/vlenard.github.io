const root = ref("root");
const btnCreate = ref("btn-create");

btnCreate.onclick = () => {
  Router.navigate({page: "create"});
};

Router.onPage('cars', async (html) => {

  try {
    const res = await api("car");
    
    render(root, inject(html, {cars: await res.json()}));
  } catch (error) {
    renderError(root, "Error while loading cars");
  }
});

Router.onPage('car', async (html, {id}) => {

  try {
    const res = await api(`car/${id}`);
    
    render(root, inject(html, await res.json()));
  } catch (error) {
    renderError(root, `Error while loading car with id ${id}`);
  }
});

Router.init();