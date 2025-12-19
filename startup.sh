#!/bin/bash

echo "🌾 Starting Agri-Guide Deployment..."

# Check if models exist
if [ ! -f "final_model/crop_recommendation_model.pkl" ] || [ ! -f "yield_model.pkl" ] || [ ! -f "crop_recommendation_model.pkl" ]; then
    echo "📦 Models not found. Training models..."
    echo "⏳ This may take 5-10 minutes on first deployment..."
    python app.py
    
    if [ $? -eq 0 ]; then
        echo "✅ Model training completed successfully!"
    else
        echo "❌ Model training failed!"
        exit 1
    fi
else
    echo "✅ Models found. Skipping training."
fi

echo "🚀 Starting web application..."
# Use gunicorn for production or flask for development
if [ "$FLASK_ENV" = "development" ]; then
    python web_app.py
else
    gunicorn web_app:app --bind 0.0.0.0:${PORT:-5000} --workers 1 --timeout 120
fi