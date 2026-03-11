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
    const treatmentList = document.getElementById('treatmentList');
    const treatmentSection = document.getElementById('treatmentSection');
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
                if (confidenceFill) {
                    confidenceFill.style.width = '0%';
                }
                if (confidenceText) {
                    confidenceText.textContent = '0.0%';
                }
                if (diseaseImagePlaceholder) {
                    diseaseImagePlaceholder.style.display = 'none';
                }
                if (treatmentSection) {
                    treatmentSection.style.display = 'none';
                }
                if (diseaseNameEl) {
                    diseaseNameEl.textContent = 'No leaf detected';
                }
                if (lowConfidenceMessage) {
                    lowConfidenceMessage.textContent =
                        'This image does not appear to be a close-up of a plant leaf. ' +
                        'Please upload or scan a single leaf in good lighting against a simple background.';
                    lowConfidenceMessage.style.display = 'block';
                }
                if (treatmentList) {
                    treatmentList.innerHTML = '';
                }
                return;
            }

            // High-confidence path for valid leaf images: show disease and treatments
            const isHighConfidence = clamped >= threshold;

            if (diseaseImagePlaceholder) {
                diseaseImagePlaceholder.style.display = isHighConfidence ? 'flex' : 'none';
            }
            if (treatmentSection) {
                treatmentSection.style.display = isHighConfidence ? 'block' : 'none';
            }
            if (diseaseNameEl) {
                if (isHighConfidence) {
                    diseaseNameEl.textContent = data.disease || 'Unknown disease';
                } else {
                    diseaseNameEl.textContent = 'Prediction not reliable';
                }
            }

            // If below threshold, show a clear warning message in the result card
            if (!isHighConfidence && lowConfidenceMessage) {
                lowConfidenceMessage.textContent =
                    `The model is not very confident in this image (${clamped.toFixed(1)}%). ` +
                    `Please retake a clearer photo focusing on a single leaf in good lighting, or consult an expert.`;
                lowConfidenceMessage.style.display = 'block';
            }

            if (treatmentList) {
                treatmentList.innerHTML = '';
                if (isHighConfidence && Array.isArray(data.treatment) && data.treatment.length > 0) {
                    data.treatment.forEach((tip) => {
                        const li = document.createElement('li');
                        li.textContent = tip;
                        treatmentList.appendChild(li);
                    });
                } else {
                    // For low confidence we do not show any treatment list
                }
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

