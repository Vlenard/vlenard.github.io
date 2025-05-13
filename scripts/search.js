const list = DOM.ref("output");
const validBrands = ["Toyota", "Honda", "Ford", "Chevrolet", "Nissan", "BMW", "Mercedes-Benz", "Volkswagen"];

DOM.ref("btn-search-local").onclick = async () => {
    const brand = DOM.ref("input").value;
    
    if(brand.length === 0){
        alert("A bemenet mező üres");
        return;
    }

    const valid = validBrands.includes(brand);

    if(valid){
        try {
            const response = await fetch(`https://iit-playground.arondev.hu/api/available-models?brand=${brand}`);
            const data = await response.json(); 

            let html = "";
            for (let i = 0; i < data.length; i++) {
                html += `<li>${data[i]}</li>`
            }
            DOM.render(list, html);
        } catch (error) {
            alert("Valami gond van a lekérdezéssel");
        }     

    }else{
        alert("Nincs ilyen márka");
    }
};
