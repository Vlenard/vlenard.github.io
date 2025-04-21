const root = ref("root");
const btnCreate = ref("btn-create");

btnCreate.onclick = () => {
  Router.navigate({page: "create"});
};

Router.onPage('home', async (html) => {

  try {
    const res = await api("car");
    
    render(root, inject(html, {cars: await res.json()}));
  } catch (error) {
    renderError(root, "Error while loading cars");
  }
});

Router.onPage('car', async (html, {id}, hydrate) => {
  try {
    const res = await api(`car/${id}`);
    
    render(root, inject(html, await res.json()));
    hydrate();
  } catch (error) {
    renderError(root, `Error while loading car with id ${id}`);
  }
});

Router.init();