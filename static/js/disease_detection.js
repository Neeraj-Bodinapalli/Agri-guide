// Disease Detection JS
// Handles leaf image upload/scan, preview, and API call to /api/predict-disease

document.addEventListener('DOMContentLoaded', function () {
    const fileInput = document.getElementById('leafImageInput');
    const cameraInput = document.getElementById('leafCameraInput');
    const openCameraBtn = document.getElementById('openCameraBtn');
    const previewImg = document.getElementById('leafImagePreview');
    const previewPlaceholder = document.getElementById('leafPreviewPlaceholder');
    const detectBtn = document.getElementById('detectDiseaseBtn');
    const errorEl = document.getElementById('diseaseError');

    const resultContainer = document.getElementById('diseaseResultContainer');
    const placeholderContainer = document.getElementById('diseasePlaceholderContainer');
    const diseaseNameEl = document.getElementById('diseaseName');
    const diseaseImagePlaceholder = document.getElementById('diseaseImagePlaceholder');
    const confidenceFill = document.getElementById('confidenceFill');
    const confidenceText = document.getElementById('confidenceText');
    const lowConfidenceMessage = document.getElementById('lowConfidenceMessage');

    let selectedFile = null;

    function resetError() {
        if (errorEl) {
            errorEl.textContent = '';
            errorEl.style.display = 'none';
        }
        if (lowConfidenceMessage) {
            lowConfidenceMessage.textContent = '';
            lowConfidenceMessage.style.display = 'none';
        }
    }

    function showError(message) {
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = 'block';
        }
    }

    function updatePreview(file) {
        if (!file || !previewImg || !previewPlaceholder) return;

        const reader = new FileReader();
        reader.onload = function (e) {
            previewImg.src = e.target.result;
            previewImg.style.display = 'block';
            previewPlaceholder.style.display = 'none';
        };
        reader.readAsDataURL(file);
    }

    function handleFileSelection(event) {
        resetError();
        const file = event.target.files && event.target.files[0];
        if (!file) return;

        selectedFile = file;
        updatePreview(file);
    }

    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelection);
    }

    if (cameraInput) {
        cameraInput.addEventListener('change', handleFileSelection);
    }

    // Clicking the "Use Camera" button triggers the hidden camera input
    if (openCameraBtn && cameraInput) {
        openCameraBtn.addEventListener('click', function () {
            cameraInput.click();
        });
    }

    function setLoading(isLoading) {
        if (!detectBtn) return;
        if (isLoading) {
            detectBtn.disabled = true;
            detectBtn.innerHTML = '<span class="spinner"></span> Detecting...';
        } else {
            detectBtn.disabled = false;
            detectBtn.innerHTML = '<i class="fas fa-search"></i> Detect Disease';
        }
    }

    async function handleDetectClick() {
        resetError();

        if (!selectedFile) {
            showError('Please upload or scan a leaf image first.');
            return;
        }

        const formData = new FormData();
        formData.append('image', selectedFile);

        setLoading(true);

        try {
            const response = await fetch('/api/predict-disease', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                const msg = data && data.error ? data.error : 'Prediction failed. Please try again.';
                showError(msg);
                setLoading(false);
                return;
            }

            // Update result section
            if (placeholderContainer) {
                placeholderContainer.style.display = 'none';
            }
            if (resultContainer) {
                resultContainer.classList.remove('hidden');
            }

            const confidencePercent = typeof data.confidence_percent === 'number'
                ? data.confidence_percent
                : (typeof data.confidence === 'number' ? data.confidence * 100 : 0);

            let clamped = Math.max(0, Math.min(100, confidencePercent));

            if (confidenceFill) {
                confidenceFill.style.width = clamped.toFixed(0) + '%';
            }
            if (confidenceText) {
                confidenceText.textContent = clamped.toFixed(1) + '%';
            }

            const threshold = typeof data.confidence_threshold === 'number' ? data.confidence_threshold : 55;

            const isLeaf = data.is_leaf !== false;

            // If the image does not look like a leaf at all, short-circuit:
            if (!isLeaf) {
                clamped = 0;
                if (confidenceFill) confidenceFill.style.width = '0%';
                if (confidenceText) confidenceText.textContent = '0.0%';
                if (diseaseImagePlaceholder) diseaseImagePlaceholder.style.display = 'none';
                if (diseaseNameEl) diseaseNameEl.textContent = 'No leaf detected';
                if (lowConfidenceMessage) {
                    lowConfidenceMessage.textContent =
                        'This image does not appear to be a close-up of a plant leaf. ' +
                        'Please upload or scan a single leaf in good lighting against a simple background.';
                    lowConfidenceMessage.style.display = 'block';
                }
                return;
            }

            const isHighConfidence = clamped >= threshold;

            if (diseaseImagePlaceholder) {
                diseaseImagePlaceholder.style.display = isHighConfidence ? 'flex' : 'none';
            }
            if (diseaseNameEl) {
                diseaseNameEl.textContent = isHighConfidence
                    ? (data.disease || 'Unknown disease')
                    : 'Prediction not reliable';
            }

            if (!isHighConfidence && lowConfidenceMessage) {
                lowConfidenceMessage.textContent =
                    `The model is not very confident in this image (${clamped.toFixed(1)}%). ` +
                    `Please retake a clearer photo focusing on a single leaf in good lighting, or consult an expert.`;
                lowConfidenceMessage.style.display = 'block';
            } else if (lowConfidenceMessage) {
                lowConfidenceMessage.style.display = 'none';
            }

            // Inject context for chatbot
            try {
                let confidenceValue = 0;
                if (typeof data.confidence === 'number') {
                    confidenceValue = data.confidence;
                } else if (typeof data.confidence_percent === 'number') {
                    confidenceValue = data.confidence_percent / 100.0;
                }
                window.chatContext = {
                    feature: "disease_detection",
                    disease: data.disease || data.display_name || '',
                    confidence: confidenceValue
                };
            } catch (e) {
                // Ignore context errors
            }
        } catch (err) {
            console.error('Disease prediction error:', err);
            showError('An unexpected error occurred while predicting the disease. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    if (detectBtn) {
        detectBtn.addEventListener('click', handleDetectClick);
    }
});

