/**
 * List of valid car brands for input validation.
 * Used to ensure only accepted brands are submitted.
 * @type {string[]}
 */
const validCarBrands = [
    "Toyota", "Honda", "Ford", "Chevrolet", "Volkswagen", "BMW", "Mercedes-Benz", "Audi",
    "Nissan", "Hyundai", "Kia", "Volvo", "Subaru", "Mazda", "Lexus", "Tesla", "Porsche",
    "Jeep", "Fiat", "Renault", "Peugeot", "Citroën", "Skoda", "Seat", "Opel", "Mitsubishi"
];

/**
 * Parses a combined "Brand - Model" string into separate parts.
 * 
 * @param {string} combinedInput - The input string in format "Brand - Model".
 * @returns {{ brand: string, model: string }} Object containing `brand` and `model`.
 */
const parseBrandModel = (combinedInput) => {
    const parts = combinedInput.split('-').map(part => part.trim());
    return {
        brand: parts[0] || '',
        model: parts.slice(1).join('-') || ''
    };
};

/**
 * Save button event handler. Validates and submits the form for saving car data.
 * 
 * Validates:
 * - Combined "Brand - Model" field.
 * - Brand is from accepted list.
 * - Fuel usage (if not electric) is a valid positive number.
 * 
 * Submits data via PUT request to the `car` API endpoint.
 */
DOM.ref("btn-save").onclick = async () => {
    const id = parseInt(DOM.ref("id").value);

    const carModelInput = DOM.ref("carModel").value;
    const { brand, model } = parseBrandModel(carModelInput);

    const electric = DOM.ref('electric').checked;
    const fuelUse = DOM.ref('fuelUse').value;
    const dayOfCommission = DOM.ref('commissionDate').value;
    const owner = DOM.ref('owner').value;

    // Validate brand and model format
    if (!brand || !model) {
        alert('Both brand and model are required (format: Brand - Model)');
        DOM.ref('carModel').focus();
        return;
    }

    // Validate brand against list
    const isValidBrand = validCarBrands.some(validBrand =>
        validBrand.toLowerCase() === brand.toLowerCase()
    );

    if (!isValidBrand) {
        alert(`Please enter a valid car brand. Some valid brands include: ${validCarBrands.slice(0, 5).join(', ')}...`);
        DOM.ref('carModel').focus();
        return;
    }

    // Validate fuel consumption for non-electric cars
    let numericFuelUse = null;
    if (!electric && fuelUse) {
        numericFuelUse = parseFloat(fuelUse);
        if (isNaN(numericFuelUse)) {
            alert('Fuel consumption must be a number');
            DOM.ref('fuelUse').focus();
            return;
        }
        if (numericFuelUse <= 0) {
            alert('Fuel consumption should be greater than 0');
            DOM.ref('fuelUse').focus();
            return;
        }
    }

    /**
     * @typedef {Object} CarData
     * @property {number} id - Car ID.
     * @property {string} brand - Car brand.
     * @property {string} model - Car model.
     * @property {boolean} electric - Whether the car is electric.
     * @property {string|null} owner - Owner's name (optional).
     * @property {string|null} dayOfCommission - Commissioning date (optional).
     * @property {number} fuelUse - Fuel consumption (0 if electric).
     */

    /** @type {CarData} */
    const carData = {
        id,
        brand,
        model,
        electric,
        owner: owner || null,
        dayOfCommission: dayOfCommission || null,
        fuelUse: electric ? 0.0 : numericFuelUse
    };

    try {
        // Submit data via PUT
        
        const response = await api('car', {
            method: 'PUT',
            body: JSON.stringify(carData)
        });

        const data = await response.json();

        if (response.ok) {
            alert('Car details saved successfully!');
        } else {
            // Handle known error codes
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

/**
 * Delete button event handler.
 * Sends a DELETE request to remove a car entry by ID.
 * Redirects to the home page after operation.
 */
DOM.ref("btn-delete").onclick = async () => {
    const id = DOM.ref("id").value;

    try {
        const response = await api(`car/${id}`, {
            method: 'DELETE',
        });

        const data = await response.json();

        if (!response.ok) {
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
