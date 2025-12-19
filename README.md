# 🌾 Agri-Guide: Intelligent Precision Farming Suite

An AI-powered agricultural intelligence platform that leverages Machine Learning to provide intelligent crop recommendations, accurate yield predictions, and personalized fertilizer recommendations for optimal farming outcomes.

## 📋 Project Description / Overview

Agri-Guide is a comprehensive precision farming solution that combines traditional agricultural knowledge with modern machine learning techniques. The system analyzes soil parameters, climate conditions, and crop characteristics to provide farmers with data-driven insights for maximizing productivity and sustainability. Built with a modular architecture, it offers three core prediction modules accessible through an intuitive web interface.

## ✨ Key Features

- 🌱 **Smart Crop Recommendation** - AI-powered crop suggestions based on soil NPK levels, climate, and pH
- 📊 **Yield Prediction** - Accurate crop yield forecasting with revenue estimation capabilities
- 🧪 **Soil Health Analysis** - Comprehensive fertilizer recommendations with soil health insights
- 🎨 **Modern Web Interface** - Responsive, professional UI with real-time predictions
- 🔄 **Integrated Workflow** - Seamless navigation between modules with data pre-population
- 💡 **Actionable Insights** - Detailed soil health advice and fertilizer application guidelines
- 🔗 **Cross-Module Integration** - Automatic data transfer between crop, yield, and soil health modules

## 🛠️ Technologies Used

### Programming Languages
- **Python 3.8+** - Core ML and web application logic
- **HTML5/CSS3** - Modern, responsive web interface
- **JavaScript (ES6+)** - Interactive frontend functionality

### Machine Learning & Data Science
- **scikit-learn** - Random Forest models for classification and regression
- **pandas** - Data processing and feature engineering
- **numpy** - Numerical computations and array operations
- **pickle/joblib** - Model serialization and persistence

### Web Framework
- **Flask** - Lightweight web application framework
- **Jinja2** - Template engine for dynamic HTML rendering

### Frontend
- **Font Awesome** - Icon library for enhanced UI
- **Google Fonts (Inter)** - Modern typography
- **Custom CSS** - Professional agrarian tech theme

## 📁 Project Structure

```
agri-guide/
│
├── app.py                           # Training pipeline entry point
├── web_app.py                       # Flask web application
├── requirements.txt                 # Python dependencies
│
├── Core Application Files
│   ├── agri_guide/                  # Main package
│   │   ├── components/              # ML components
│   │   │   ├── data_ingestion.py   # Dataset loading
│   │   │   ├── data_transformation.py  # Feature engineering
│   │   │   ├── model_trainer.py    # Crop & yield model training
│   │   │   └── fertilizer_trainer.py   # Fertilizer model training
│   │   ├── entity/                  # Configuration entities
│   │   │   ├── config_entity.py    # Training configurations
│   │   │   └── artifact_entity.py  # Model artifacts
│   │   ├── pipeline/                # Training orchestration
│   │   │   └── training_pipeline.py
│   │   ├── logging/                 # Logging utilities
│   │   ├── exception/               # Error handling
│   │   └── utils/                   # Helper functions
│
├── Web Application
│   ├── templates/                   # HTML templates
│   │   ├── base.html               # Base template with navigation
│   │   ├── home.html               # Landing page
│   │   ├── crop_recommendation.html
│   │   ├── yield_prediction.html
│   │   └── soil_health.html
│   └── static/                      # Static assets
│       ├── css/
│       │   └── style.css           # Main stylesheet
│       └── js/
│           ├── main.js             # Common JavaScript
│           ├── crop_recommendation.js
│           ├── yield_prediction.js
│           └── soil_health.js
│
├── Machine Learning Models
│   └── final_model/                 # Trained models
│       ├── crop_recommendation_model.pkl
│       ├── label_encoder.pkl
│       ├── scaler.pkl
│       ├── yield_model.pkl
│       ├── yield_scaler.pkl
│       ├── yield_feature_columns.pkl
│       ├── fertilizer_model.pkl
│       ├── soil_encoder.pkl
│       ├── crop_encoder.pkl
│       └── fertilizer_encoder.pkl
│
└── Datasets
    ├── raw_data/                    # Raw training data
    │   ├── Crop_recommendation.csv
    │   └── crop_production.csv
    └── Fertilizer_Prediction.csv
```

## 🔧 Installation Instructions

### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)
- Virtual environment (recommended)

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd agri-guide
```

### Step 2: Create Virtual Environment (Recommended)
```bash
python -m venv venv

# On Windows
venv\Scripts\activate

# On macOS/Linux
source venv/bin/activate
```

### Step 3: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 4: Verify Dataset Placement
Ensure the following datasets are in place:
- `raw_data/Crop_recommendation.csv`
- `raw_data/crop_production.csv`
- `Fertilizer_Prediction.csv`

## 🚀 Usage Guide

### Option 1: Run Web Application (Recommended)

If models are already trained, launch the web interface directly:

```bash
python web_app.py
```

The application will start on `http://localhost:5000`

Access the interface:
- **Home**: `http://localhost:5000/`
- **Crop Recommendation**: `http://localhost:5000/crop-recommendation`
- **Yield Prediction**: `http://localhost:5000/yield-prediction`
- **Soil Health**: `http://localhost:5000/soil-health`

### Option 2: Train Models First

If you need to train or retrain the ML models:

```bash
python app.py
```

This will:
1. Load datasets from `raw_data/` and root directory
2. Train all three ML models (Crop, Yield, Fertilizer)
3. Save trained models to `final_model/` directory
4. Display training metrics and accuracy scores

Then launch the web application:
```bash
python web_app.py
```

### Using the Web Interface

#### 1. Crop Recommendation
1. Navigate to **Crop Recommendation** page
2. Enter soil parameters (N, P, K, pH)
3. Enter climate data (Temperature, Humidity, Rainfall)
4. Click **"Analyze & Recommend"**
5. View recommended crop with confidence score
6. Optional: Click **"Predict Yield"** or **"Get Soil Health Analysis"**

#### 2. Yield Prediction
1. Navigate to **Yield Prediction** page
2. Select State, Season, and Crop
3. Enter cultivation area (hectares)
4. Click **"Predict Yield"**
5. View yield per hectare and total yield
6. Use revenue calculator for profit estimation

#### 3. Soil Health & Fertilizers
1. Navigate to **Soil Health** page
2. Enter NPK values and environmental parameters
3. Select Crop Type and Soil Type
4. Enter Soil Moisture percentage
5. Click **"Analyze & Recommend"**
6. View fertilizer recommendation with confidence score
7. Review soil health analysis and application guidelines

## 🏗️ Architecture / How It Works

### System Pipeline

```
┌─────────────────┐
│   Raw Datasets  │
│  (CSV Files)    │
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│  Data Ingestion     │  Load and validate data
│  (data_ingestion.py)│
└────────┬────────────┘
         │
         ▼
┌──────────────────────────┐
│  Data Transformation     │  Feature engineering:
│  (data_transformation.py)│  - NPK feature creation
└────────┬─────────────────┘  - One-hot encoding
         │                    - Scaling
         ▼
┌──────────────────────────┐
│  Model Training          │  Train 3 RF models:
│  (model_trainer.py,      │  - Crop (100% accuracy)
│   fertilizer_trainer.py) │  - Yield (R² score)
└────────┬─────────────────┘  - Fertilizer (100% accuracy)
         │
         ▼
┌──────────────────────────┐
│  Model Persistence       │  Save to final_model/
│  (pickle serialization)  │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│  Flask Web Application   │  Load models at startup
│  (web_app.py)            │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│  User Interface          │  Interactive web forms
│  (HTML/CSS/JS)           │  with real-time validation
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│  API Endpoints           │  RESTful prediction APIs:
│  (/api/predict-*)        │  - /api/predict-crop
└────────┬─────────────────┘  - /api/predict-yield
         │                    - /api/predict-fertilizer
         ▼
┌──────────────────────────┐
│  ML Prediction           │  Real-time inference
│  (Random Forest models)  │  with confidence scores
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│  Results Visualization   │  Side-by-side display
│  (Dynamic UI updates)    │  Statistics & insights
└──────────────────────────┘
