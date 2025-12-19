// Yield Prediction Page JavaScript
// Handles form submission, API calls, and result display

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('yieldForm');
    const predictBtn = document.getElementById('predictBtn');
    const calculateBtn = document.getElementById('calculateBtn');
    const resultsContainer = document.getElementById('resultsContainer');
    const placeholderContainer = document.getElementById('placeholderContainer');
    
    let currentYieldData = null;

    // Form submission
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Validate form
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            // Get form data
            const formData = {
                state: document.getElementById('state').value,
                district: document.getElementById('district').value,
                season: document.getElementById('season').value,
                crop: document.getElementById('crop').value,
                area: parseFloat(document.getElementById('area').value)
            };

            // Show loading state
            predictBtn.disabled = true;
            predictBtn.innerHTML = '<span class="spinner"></span> Predicting...';
            
            // Hide placeholder, show results container
            placeholderContainer.style.display = 'none';
            resultsContainer.classList.remove('hidden');
            resultsContainer.style.display = 'block';

            // Show loading in results
            showLoadingState();

            try {
                // Make API call
                const response = await fetch('/api/predict-yield', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();

                if (data.success) {
                    currentYieldData = data.result;
                    displayResults(data.result);
                } else {
                    showError(data.error || 'An error occurred during prediction');
                }
            } catch (error) {
                console.error('Error:', error);
                showError('Failed to connect to the server. Please try again.');
            } finally {
                // Reset button
                predictBtn.disabled = false;
                predictBtn.innerHTML = '<i class="fas fa-chart-line"></i> Predict Yield';
            }
        });
    }

    // Revenue calculator
    if (calculateBtn) {
        calculateBtn.addEventListener('click', function() {
            if (!currentYieldData) {
                alert('Please predict yield first');
                return;
            }

            const marketPrice = parseFloat(document.getElementById('marketPrice').value);
            
            if (!marketPrice || marketPrice <= 0) {
                alert('Please enter a valid market price');
                return;
            }

            const totalRevenue = currentYieldData.total_yield * marketPrice;
            const revenueResult = document.getElementById('revenueResult');
            const revenueAmount = document.getElementById('revenueAmount');

            if (revenueResult && revenueAmount) {
                revenueAmount.textContent = totalRevenue.toLocaleString('en-IN', {
                    maximumFractionDigits: 2
                });
                revenueResult.classList.remove('hidden');
                revenueResult.style.animation = 'fadeInUp 0.5s ease';
            }
        });
    }

    function showLoadingState() {
        document.getElementById('totalYield').textContent = '...';
        document.getElementById('yieldPerHectare').textContent = 'Calculating...';
    }

    function displayResults(result) {
        const totalYield = result.total_yield;
        const yieldPerHectare = result.yield_per_hectare;
        const area = result.area;

        // Animate total yield
        animateValue('totalYield', 0, totalYield, 1000, ' Tonnes');
        
        // Update yield per hectare
        document.getElementById('yieldPerHectare').textContent = 
            `${yieldPerHectare.toFixed(2)} Tonnes per Hectare (for ${area} hectares)`;

        // Reset revenue calculator
        document.getElementById('marketPrice').value = '';
        const revenueResult = document.getElementById('revenueResult');
        if (revenueResult) {
            revenueResult.classList.add('hidden');
        }

        // Animate result appearance
        resultsContainer.classList.add('fade-in');
    }

    function animateValue(elementId, start, end, duration, suffix = '') {
        const element = document.getElementById(elementId);
        if (!element) return;

        const range = end - start;
        const increment = range / (duration / 16);
        let current = start;

        const timer = setInterval(() => {
            current += increment;
            if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
                current = end;
                clearInterval(timer);
            }
            element.textContent = current.toFixed(2) + suffix;
        }, 16);
    }

    function showError(message) {
        document.getElementById('totalYield').textContent = 'Error';
        document.getElementById('yieldPerHectare').textContent = message;
    }
});


