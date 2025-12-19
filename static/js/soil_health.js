document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('soilHealthForm');
    const resultsContainer = document.getElementById('resultsContainer');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const originalBtnText = analyzeBtn.innerHTML;

    // Check for URL parameters and populate form
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('nitrogen')) {
        document.getElementById('nitrogen').value = urlParams.get('nitrogen');
    }
    if (urlParams.has('phosphorous')) {
        document.getElementById('phosphorous').value = urlParams.get('phosphorous');
    }
    if (urlParams.has('potassium')) {
        document.getElementById('potassium').value = urlParams.get('potassium');
    }
    if (urlParams.has('temperature')) {
        document.getElementById('temperature').value = urlParams.get('temperature');
    }
    if (urlParams.has('humidity')) {
        document.getElementById('humidity').value = urlParams.get('humidity');
    }

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Show loading state
        analyzeBtn.disabled = true;
        analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
        resultsContainer.classList.add('hidden');

        // Get form data
        const formData = new FormData(form);
        const data = {
            temperature: parseFloat(formData.get('temperature')),
            humidity: parseFloat(formData.get('humidity')),
            moisture: parseFloat(formData.get('moisture')),
            soilType: formData.get('soilType'),
            cropType: formData.get('cropType'),
            nitrogen: parseFloat(formData.get('nitrogen')),
            potassium: parseFloat(formData.get('potassium')),
            phosphorous: parseFloat(formData.get('phosphorous'))
        };

        try {
            // Make API call
            const response = await fetch('/api/predict-fertilizer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                displayResults(result.result);
            } else {
                showError(result.error || 'An error occurred during prediction');
            }
        } catch (error) {
            console.error('Error:', error);
            showError('Network error. Please try again.');
        } finally {
            // Reset button state
            analyzeBtn.disabled = false;
            analyzeBtn.innerHTML = originalBtnText;
        }
    });

    function displayResults(result) {
        // Hide placeholder and show results
        const placeholderContainer = document.getElementById('placeholderContainer');
        placeholderContainer.style.display = 'none';
        
        // Display fertilizer name
        document.getElementById('fertilizerName').textContent = result.fertilizer;
        document.getElementById('fertilizerType').textContent = result.fertilizer;
        
        // Confidence score removed as requested
        
        // Display soil advice
        document.getElementById('soilAdvice').innerHTML = '<p>' + result.soil_advice + '</p>';
        
        // Update fertilizer image icon based on fertilizer type
        const fertilizerImage = document.getElementById('fertilizerImage');
        if (result.fertilizer.toLowerCase().includes('urea')) {
            fertilizerImage.innerHTML = '<i class="fas fa-flask"></i>';
        } else if (result.fertilizer.toLowerCase().includes('dap')) {
            fertilizerImage.innerHTML = '<i class="fas fa-atom"></i>';
        } else {
            fertilizerImage.innerHTML = '<i class="fas fa-seedling"></i>';
        }

        // Show results with animation
        resultsContainer.classList.remove('hidden');
        resultsContainer.scrollIntoView({ behavior: 'smooth' });
    }

    function showError(message) {
        alert('Error: ' + message);
    }

    // Form validation
    const inputs = form.querySelectorAll('input[type="number"]');
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            const value = parseFloat(this.value);
            const min = parseFloat(this.min);
            const max = parseFloat(this.max);
            
            if (value < min || value > max) {
                this.setCustomValidity(`Value must be between ${min} and ${max}`);
            } else {
                this.setCustomValidity('');
            }
        });
    });
});