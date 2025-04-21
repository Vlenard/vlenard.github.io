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

const parseBrandModel = (combinedInput) => {
    const parts = combinedInput.split('-').map(part => part.trim());
    return {
      brand: parts[0] || '',
      model: parts.slice(1).join('-') || ''
    };
  }

DOM.ref("btn-save").onclick = async () => {
    // Get the car ID
    const id = document.getElementById('id').value;

    // Parse brand and model from the combined input
    const carModelInput = document.getElementById('carModel').value;
    const { brand, model } = parseBrandModel(carModelInput);

    // Get other form values
    const electric = document.getElementById('electricCar').checked;
    const fuelUse = document.getElementById('fuelUse').value;
    const dayOfCommission = document.getElementById('commissionDate').value;
    const owner = document.getElementById('owner').value;

    // Validate inputs
    if (!brand || !model) {
        alert('Both brand and model are required (format: Brand - Model)');
        document.getElementById('carModel').focus();
        return;
    }

    // Check if brand is valid
    const isValidBrand = validCarBrands.some(validBrand =>
        validBrand.toLowerCase() === brand.toLowerCase()
    );

    if (!isValidBrand) {
        alert(`Please enter a valid car brand. Some valid brands include: ${validCarBrands.slice(0, 5).join(', ')}...`);
        document.getElementById('carModel').focus();
        return;
    }

    // Validate fuel use if not electric
    let numericFuelUse = null;
    if (!electric && fuelUse) {
        numericFuelUse = parseFloat(fuelUse);
        if (isNaN(numericFuelUse)) {
            alert('Fuel consumption must be a number');
            document.getElementById('fuelUse').focus();
            return;
        }
        if (numericFuelUse <= 0) {
            alert('Fuel consumption should be greater than 0');
            document.getElementById('fuelUse').focus();
            return;
        }
    }

    // Prepare the request body
    const carData = {
        id,
        brand,
        model,
        electric,
        owner: owner || null,
        dayOfCommission: dayOfCommission || null
    };

    // Only include fuelUse if it's provided and the car is not electric
    if (!electric && fuelUse) {
        carData.fuelUse = numericFuelUse;
    }

    try {
        // Make the PUT request
        console.log(JSON.stringify(carData));
        
        const response = await api('car', {
            method: 'PUT',
            body: JSON.stringify(carData)
        });

        const data = await response.json();

        if (response.ok) {
            // Success case - car updated
            alert('Car details saved successfully!');
            // Optionally redirect or refresh data
        } else {
            // Handle errors
            switch (response.status) {
                case 400:
                    alert(`Validation error: ${data.message}`);
                    break;
                case 401:
                    alert('Authorization error: Please check your credentials');
                    break;
                case 404:
                    alert('Error: Car not found. It may have been deleted.');
                    break;
                default:
                    alert('An unexpected error occurred');
            }
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to connect to the server');
    }
};

DOM.ref("btn-delete").onclick = async () => {
    const id = DOM.ref("id").value;

    try {
        const response = await api(`car/${id}`, {
            method: 'DELETE',
        });

        const data = await response.json();

        if (!response.ok) {
            // Handle error responses
            if (response.status === 400) {
                alert(`Error: ${data.message || "Invalid data provided."}`);
            } else if (response.status === 401) {
                alert(`Error: ${data.message || "Invalid Neptun code. Access denied."}`);
            } else if (response.status === 404) {
                alert(`Error: ${data.message || "Car not found."}`);
            } else {
                alert("Failed to delete car. Please try again.");
            }
        }

    } catch (error) {
        alert('Error deleting car:', error);
    }

    Router.navigate({ page: "home" });
};