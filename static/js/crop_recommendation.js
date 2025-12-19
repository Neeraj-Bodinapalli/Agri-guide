// Crop Recommendation Page JavaScript
// Handles form submission, API calls, and result display

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('cropForm');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const resultsContainer = document.getElementById('resultsContainer');
    const placeholderContainer = document.getElementById('placeholderContainer');
    const predictYieldBtn = document.getElementById('predictYieldBtn');
    const getSoilHealthBtn = document.getElementById('getSoilHealthBtn');

    let currentCropName = null;
    let currentFormData = null;

    // Crop name to emoji/icon mapping
    const cropIcons = {
        'rice': '🌾',
        'wheat': '🌾',
        'maize': '🌽',
        'cotton': '🌿',
        'sugarcane': '🎋',
        'potato': '🥔',
        'onion': '🧅',
        'tomato': '🍅',
        'groundnut': '🥜',
        'soybean': '🫘',
        'sunflower': '🌻',
        'mustard': '🌿',
        'jute': '🌾',
        'bajra': '🌾',
        'jowar': '🌾',
        'mungbean': '🫘',
        'lentil': '🫘',
        'chickpea': '🫘',
        'pigeonpea': '🫘',
        'blackgram': '🫘',
        'mothbeans': '🫘',
        'kidneybeans': '🫘',
        'mango': '🥭',
        'banana': '🍌',
        'grapes': '🍇',
        'watermelon': '🍉',
        'muskmelon': '🍈',
        'apple': '🍎',
        'orange': '🍊',
        'papaya': '🥭',
        'coconut': '🥥',
        'coffee': '☕',
        'tea': '🍵'
    };

    // Real-time pH validation
    const phInput = document.getElementById('ph');
    if (phInput) {
        phInput.addEventListener('input', function() {
            const phValue = parseFloat(this.value);
            if (phValue > 14 || phValue < 0) {
                this.classList.add('error');
                this.setCustomValidity('pH must be between 0 and 14');
            } else {
                this.classList.remove('error');
                this.setCustomValidity('');
            }
        });
    }

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
                n: parseFloat(document.getElementById('n').value),
                p: parseFloat(document.getElementById('p').value),
                k: parseFloat(document.getElementById('k').value),
                temperature: parseFloat(document.getElementById('temperature').value),
                humidity: parseFloat(document.getElementById('humidity').value),
                ph: parseFloat(document.getElementById('ph').value),
                rainfall: parseFloat(document.getElementById('rainfall').value)
            };

            // Store form data for soil health button
            currentFormData = formData;

            // Show loading state
            analyzeBtn.disabled = true;
            analyzeBtn.innerHTML = '<span class="spinner"></span> Analyzing...';
            
            // Hide placeholder, show results container
            placeholderContainer.style.display = 'none';
            resultsContainer.classList.remove('hidden');
            resultsContainer.style.display = 'block';

            // Show loading in results
            showLoadingState();

            try {
                // Make API call
                const response = await fetch('/api/predict-crop', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();

                if (data.success) {
                    displayResults(data.result);
                } else {
                    showError(data.error || 'An error occurred during prediction');
                }
            } catch (error) {
                console.error('Error:', error);
                showError('Failed to connect to the server. Please try again.');
            } finally {
                // Reset button
                analyzeBtn.disabled = false;
                analyzeBtn.innerHTML = '<i class="fas fa-search"></i> Analyze & Recommend';
            }
        });
    }

    function showLoadingState() {
        document.getElementById('cropName').textContent = 'Analyzing...';
        if (predictYieldBtn) {
            predictYieldBtn.disabled = true;
        }
        if (getSoilHealthBtn) {
            getSoilHealthBtn.disabled = true;
        }
    }

    function displayResults(result) {
        const cropName = result.crop;

        currentCropName = cropName;

        // Update crop name
        document.getElementById('cropName').textContent = cropName.charAt(0).toUpperCase() + cropName.slice(1);

        // Update crop image/icon
        const cropImage = document.getElementById('cropImage');
        const cropLower = cropName.toLowerCase();
        const icon = cropIcons[cropLower] || '🌱';
        cropImage.innerHTML = `<span style="font-size: 4rem;">${icon}</span>`;

        // Animate result appearance
        resultsContainer.classList.add('fade-in');

        // Enable buttons
        if (predictYieldBtn) {
            predictYieldBtn.disabled = false;
        }
        if (getSoilHealthBtn) {
            getSoilHealthBtn.disabled = false;
        }
    }

    function showError(message) {
        document.getElementById('cropName').textContent = 'Error';
        document.getElementById('cropImage').innerHTML = '<i class="fas fa-exclamation-triangle" style="color: #dc3545;"></i>';
        if (predictYieldBtn) {
            predictYieldBtn.disabled = true;
        }
        if (getSoilHealthBtn) {
            getSoilHealthBtn.disabled = true;
        }
    }

    // Predict Yield button -> redirect to yield prediction page with preselected crop
    if (predictYieldBtn) {
        predictYieldBtn.addEventListener('click', function() {
            if (!currentCropName) return;
            const cropParam = encodeURIComponent(currentCropName);
            window.location.href = `/yield-prediction?crop=${cropParam}`;
        });
    }

    // Get Soil Health button -> redirect to soil health page with form values
    if (getSoilHealthBtn) {
        getSoilHealthBtn.addEventListener('click', function() {
            if (!currentFormData) return;
            
            // Create URL with form parameters
            const params = new URLSearchParams({
                nitrogen: currentFormData.n,
                phosphorous: currentFormData.p,
                potassium: currentFormData.k,
                temperature: currentFormData.temperature,
                humidity: currentFormData.humidity
            });
            
            window.location.href = `/soil-health?${params.toString()}`;
        });
    }
});


