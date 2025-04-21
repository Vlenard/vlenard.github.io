const validCarBrands = [
    "Toyota",
    "Honda",
    "Ford",
    "Chevrolet",
    "Volkswagen",
    "BMW",
    "Mercedes-Benz",
    "Audi",
    "Nissan",
    "Hyundai",
    "Kia",
    "Volvo",
    "Subaru",
    "Mazda",
    "Lexus",
    "Tesla",
    "Porsche",
    "Jeep",
    "Fiat",
    "Renault",
    "Peugeot",
    "Citroën",
    "Skoda",
    "Seat",
    "Opel"
];

DOM.ref("btn-save").onclick = async () => {
    const brandInput = DOM.ref('brand');
    const brand = brandInput.value.trim();
    const model = DOM.ref('model').value;
    const electric = DOM.ref('electric').checked;
    const fuelUse = DOM.ref('fuelUse').value;
    const dayOfCommission = DOM.ref('dayOfCommission').value;
    const owner = DOM.ref('owner').value;

    // Validate brand
    if (!brand) {
        alert('Brand is a required field');
        brandInput.focus();
        return;
    }

    // Check if brand is valid
    const isValidBrand = validCarBrands.some(validBrand =>
        validBrand.toLowerCase() === brand.toLowerCase()
    );

    if (!isValidBrand) {
        alert(`Please enter a valid car brand. Some valid brands include: ${validCarBrands.slice(0, 5).join(', ')}...`);
        brandInput.focus();
        return;
    }

    // Validate model
    if (!model) {
        alert('Model is a required field');
        DOM.ref('model').focus();
        return;
    }


    // Prepare the request body
    const carData = {
        brand: brand,
        model: model,
        electric: electric,
        owner: owner || null, // Make optional fields null if empty
        dayOfCommission: dayOfCommission || null
    };

    // Only include fuelUse if it's provided and the car is not electric
    if (!electric && fuelUse) {
        carData.fuelUse = parseFloat(fuelUse);
        if (isNaN(carData.fuelUse) || carData.fuelUse <= 0) {
            alert('Fuel consumption should be a number greater than 0');
            return;
        }
    }

    try {
        // Make the API call
        const response = await api('car', {
            method: 'POST',
            body: JSON.stringify(carData)
        });

        const data = await response.json();

        if (response.ok) {
            // Success case - car created
            alert(`Car added successfully with ID: ${data.id}`);
            // Optionally reset the form
            document.querySelector('.car-add-page form').reset();
        } else {
            // Handle errors
            if (response.status === 400) {
                alert(`Error: ${data.message}`);
            } else if (response.status === 401) {
                alert('Authorization error: Please check your credentials');
            } else {
                alert('An unexpected error occurred');
            }
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to connect to the server');
    }
};