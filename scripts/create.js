/**
 * List of valid car brands for input validation.
 * @type {string[]}
 */
const validCarBrands = [
    "Toyota", "Honda", "Ford", "Chevrolet", "Volkswagen", "BMW", "Mercedes-Benz", "Audi",
    "Nissan", "Hyundai", "Kia", "Volvo", "Subaru", "Mazda", "Lexus", "Tesla", "Porsche",
    "Jeep", "Fiat", "Renault", "Peugeot", "Citroën", "Skoda", "Seat", "Opel"
];

/**
 * Save button event handler.
 * 
 * Validates user input from the car creation form:
 * - Ensures brand and model are provided.
 * - Checks if the brand is among the accepted list.
 * - Validates numeric and positive fuel consumption for non-electric cars.
 * 
 * Sends the car data via POST request to the `car` API endpoint.
 * If successful, it displays the new car's ID and resets the form.
 */
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

    /**
     * @typedef {Object} NewCarData
     * @property {string} brand - Car brand.
     * @property {string} model - Car model.
     * @property {boolean} electric - Whether the car is electric.
     * @property {string|null} owner - Owner of the car (optional).
     * @property {string|null} dayOfCommission - Commissioning date (optional).
     * @property {number} [fuelUse] - Fuel consumption (required if not electric).
     */

    /** @type {NewCarData} */
    const carData = {
        brand,
        model,
        electric,
        owner: owner || null,
        dayOfCommission: dayOfCommission || null
    };

    // Include fuelUse only if required and valid
    if (!electric && fuelUse) {
        carData.fuelUse = parseFloat(fuelUse);
        if (isNaN(carData.fuelUse) || carData.fuelUse <= 0) {
            alert('Fuel consumption should be a number greater than 0');
            return;
        }
    }

    try {
        const response = await api('car', {
            method: 'POST',
            body: JSON.stringify(carData)
        });

        const data = await response.json();

        if (response.ok) {
            alert(`Car added successfully with ID: ${data.id}`);
            // Reset the form after successful submission
            document.querySelector('.car-add-page form').reset();
        } else {
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
