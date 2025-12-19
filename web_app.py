"""
Agri-Guide Web Application
A modern Flask-based web interface for crop recommendation and yield prediction.
"""

import pickle
from pathlib import Path

import numpy as np
import pandas as pd
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)
app.config["SECRET_KEY"] = "agri-guide-secret-key-2024"

# Load models and preprocessors at startup
MODEL_DIR = Path(__file__).parent

# Crop Recommendation Models
CROP_MODEL_PATH = MODEL_DIR / "crop_recommendation_model.pkl"
CROP_SCALER_PATH = MODEL_DIR / "scaler.pkl"
CROP_LABEL_ENCODER_PATH = MODEL_DIR / "label_encoder.pkl"

# Yield Prediction Models
YIELD_MODEL_PATH = MODEL_DIR / "yield_model.pkl"
YIELD_SCALER_PATH = MODEL_DIR / "yield_scaler.pkl"
YIELD_FEATURE_COLUMNS_PATH = MODEL_DIR / "yield_feature_columns.pkl"

# Fertilizer Prediction Models
FERTILIZER_MODEL_PATH = MODEL_DIR / "final_model" / "fertilizer_model.pkl"
SOIL_ENCODER_PATH = MODEL_DIR / "final_model" / "soil_encoder.pkl"
CROP_ENCODER_PATH = MODEL_DIR / "final_model" / "crop_encoder.pkl"
FERTILIZER_ENCODER_PATH = MODEL_DIR / "final_model" / "fertilizer_encoder.pkl"

# Raw data path for populating dropdowns
RAW_DATA_DIR = MODEL_DIR / "raw_data"
YIELD_DATA_PATH = RAW_DATA_DIR / "crop_production.csv"

# Global model variables
crop_model = None
crop_scaler = None
crop_label_encoder = None
yield_model = None
yield_scaler = None
yield_feature_columns = None

# Fertilizer prediction models
fertilizer_model = None
soil_encoder = None
crop_encoder = None
fertilizer_encoder = None

# Global metadata for yield dropdowns
yield_states: list[str] | None = None
yield_seasons: list[str] | None = None
yield_crops: list[str] | None = None


def load_models():
    """Load all ML models and preprocessors."""
    global crop_model, crop_scaler, crop_label_encoder
    global yield_model, yield_scaler, yield_feature_columns
    global fertilizer_model, soil_encoder, crop_encoder, fertilizer_encoder
    
    try:
        # Load crop recommendation models
        with open(CROP_MODEL_PATH, 'rb') as f:
            crop_model = pickle.load(f)
        with open(CROP_SCALER_PATH, 'rb') as f:
            crop_scaler = pickle.load(f)
        with open(CROP_LABEL_ENCODER_PATH, 'rb') as f:
            crop_label_encoder = pickle.load(f)
        
        # Load yield prediction models
        with open(YIELD_MODEL_PATH, 'rb') as f:
            yield_model = pickle.load(f)
        with open(YIELD_SCALER_PATH, 'rb') as f:
            yield_scaler = pickle.load(f)
        with open(YIELD_FEATURE_COLUMNS_PATH, 'rb') as f:
            yield_feature_columns = pickle.load(f)
        
        # Load fertilizer prediction models
        with open(FERTILIZER_MODEL_PATH, 'rb') as f:
            fertilizer_model = pickle.load(f)
        with open(SOIL_ENCODER_PATH, 'rb') as f:
            soil_encoder = pickle.load(f)
        with open(CROP_ENCODER_PATH, 'rb') as f:
            crop_encoder = pickle.load(f)
        with open(FERTILIZER_ENCODER_PATH, 'rb') as f:
            fertilizer_encoder = pickle.load(f)
        
        print("All models loaded successfully!")
    except Exception as e:
        print(f"Error loading models: {e}")
        raise


def load_yield_metadata() -> None:
    """Load unique states, seasons, and crops for the yield prediction form."""
    global yield_states, yield_seasons, yield_crops

    # Only load once
    if yield_states is not None and yield_seasons is not None and yield_crops is not None:
        return

    try:
        if not YIELD_DATA_PATH.exists():
            # Fallback: try project root crop_production.csv if raw_data is missing
            fallback_path = MODEL_DIR / "crop_production.csv"
            data_path = fallback_path if fallback_path.exists() else YIELD_DATA_PATH
        else:
            data_path = YIELD_DATA_PATH

        df = pd.read_csv(data_path)

        yield_states = sorted(df["State_Name"].dropna().unique().tolist())
        yield_seasons = sorted(df["Season"].dropna().unique().tolist())
        yield_crops = sorted(df["Crop"].dropna().unique().tolist())
    except Exception as exc:
        # In case of any issue, keep lists empty but do not crash the app
        print(f"Error loading yield metadata: {exc}")
        yield_states = []
        yield_seasons = []
        yield_crops = []


def add_engineered_features(df: pd.DataFrame) -> pd.DataFrame:
    """Add engineered features for crop recommendation."""
    df_fe = df.copy()
    df_fe["NPK_sum"] = df_fe["N"] + df_fe["P"] + df_fe["K"]
    df_fe["N_K_ratio"] = df_fe["N"] / (df_fe["K"] + 1e-3)
    df_fe["temp_humidity_index"] = df_fe["temperature"] * df_fe["humidity"] / 100.0
    df_fe["is_acidic"] = (df_fe["ph"] < 7).astype(int)
    df_fe["rainfall_per_NPK"] = df_fe["rainfall"] / (df_fe["NPK_sum"] + 1e-3)
    return df_fe


def predict_crop(n, p, k, temperature, humidity, ph, rainfall):
    """Predict the best crop based on soil and climate parameters."""
    try:
        # Create input DataFrame with columns in the exact order used during training
        # Original columns: N, P, K, temperature, humidity, ph, rainfall
        input_data = pd.DataFrame({
            'N': [n],
            'P': [p],
            'K': [k],
            'temperature': [temperature],
            'humidity': [humidity],
            'ph': [ph],
            'rainfall': [rainfall]
        })
        
        # Add engineered features (this adds: NPK_sum, N_K_ratio, temp_humidity_index, is_acidic, rainfall_per_NPK)
        input_data_fe = add_engineered_features(input_data)
        
        # Ensure columns are in the correct order: original + engineered features
        # The order should match what was used during training (12 features total)
        feature_order = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall',
                        'NPK_sum', 'N_K_ratio', 'temp_humidity_index', 'is_acidic', 'rainfall_per_NPK']
        
        # Reorder columns to match training order
        input_data_fe = input_data_fe[feature_order]
        
        # Convert to numpy array
        input_array = input_data_fe.values
        
        # Predict (RandomForest model was trained on X_train_fe which is UNSCALED)
        # The model expects 12 features: 7 original + 5 engineered (unscaled)
        prediction_encoded = crop_model.predict(input_array)[0]
        crop_name = crop_label_encoder.inverse_transform([prediction_encoded])[0]
        
        # Get prediction probabilities for confidence score
        probabilities = crop_model.predict_proba(input_array)[0]
        confidence = float(np.max(probabilities) * 100)
        
        # Get soil health advice
        advice = generate_soil_advice(n, p, k, ph)
        
        return {
            'crop': crop_name,
            'confidence': round(confidence, 2),
            'advice': advice
        }
    except Exception as e:
        raise Exception(f"Prediction error: {str(e)}")


def generate_soil_advice(n, p, k, ph):
    """Generate fertilizer and soil health advice based on NPK and pH levels."""
    advice_parts = []
    
    # Nitrogen advice
    if n < 50:
        advice_parts.append("N levels are low. Add Urea or Ammonium Nitrate.")
    elif n > 100:
        advice_parts.append("N levels are high. Reduce nitrogen fertilizers.")
    else:
        advice_parts.append("N levels are optimal.")
    
    # Phosphorus advice
    if p < 30:
        advice_parts.append("P levels are low. Add Superphosphate or DAP.")
    elif p > 60:
        advice_parts.append("P levels are high. Reduce phosphorus fertilizers.")
    else:
        advice_parts.append("P levels are optimal.")
    
    # Potassium advice
    if k < 30:
        advice_parts.append("K levels are low. Add Potash or Muriate of Potash.")
    elif k > 80:
        advice_parts.append("K levels are high. Reduce potassium fertilizers.")
    else:
        advice_parts.append("K levels are optimal.")
    
    # pH advice
    if ph < 6.0:
        advice_parts.append("Soil is acidic. Consider adding lime to raise pH.")
    elif ph > 8.0:
        advice_parts.append("Soil is alkaline. Consider adding sulfur or organic matter to lower pH.")
    else:
        advice_parts.append("Soil pH is optimal for most crops.")
    
    return " ".join(advice_parts)


def predict_fertilizer(temperature, humidity, moisture, soil_type, crop_type, nitrogen, potassium, phosphorous):
    """Predict the best fertilizer based on soil and crop parameters."""
    try:
        # Create input DataFrame
        input_data = pd.DataFrame({
            'Temparature': [temperature],  # Note: keeping original column name with typo
            'Humidity ': [humidity],       # Note: keeping original column name with space
            'Moisture': [moisture],
            'Soil Type': [soil_type],
            'Crop Type': [crop_type],
            'Nitrogen': [nitrogen],
            'Potassium': [potassium],
            'Phosphorous': [phosphorous]
        })
        
        # Clean column names (remove extra spaces)
        input_data.columns = input_data.columns.str.strip()
        
        # Encode categorical variables
        input_data['Soil Type'] = soil_encoder.transform([soil_type])[0]
        input_data['Crop Type'] = crop_encoder.transform([crop_type])[0]
        
        # Convert to numpy array
        input_array = input_data.values
        
        # Predict
        prediction_encoded = fertilizer_model.predict(input_array)[0]
        fertilizer_name = fertilizer_encoder.inverse_transform([prediction_encoded])[0]
        
        # Get prediction probabilities for confidence score
        probabilities = fertilizer_model.predict_proba(input_array)[0]
        confidence = float(np.max(probabilities) * 100)
        
        # Generate soil advice using existing function
        soil_advice = generate_soil_advice(nitrogen, phosphorous, potassium, 7.0)  # Default pH for soil advice
        
        return {
            'fertilizer': fertilizer_name,
            'confidence': round(confidence, 2),
            'soil_advice': soil_advice
        }
    except Exception as e:
        raise Exception(f"Fertilizer prediction error: {str(e)}")


def predict_yield(state, district, season, crop, area):
    """Predict crop yield based on location, season, crop type, and area."""
    try:
        # Create input DataFrame with the same structure as training (no District_Name)
        input_data = pd.DataFrame({
            'State_Name': [state],
            'Season': [season],
            'Crop': [crop],
            'Area': [area]
        })
        
        # One-hot encode categorical variables (matching training: State_Name, Season, Crop)
        input_encoded = pd.get_dummies(input_data, columns=['State_Name', 'Season', 'Crop'], drop_first=False)
        
        # Ensure all feature columns from training are present
        for col in yield_feature_columns:
            if col not in input_encoded.columns:
                input_encoded[col] = 0
        
        # Reorder columns to match training exactly
        input_encoded = input_encoded[yield_feature_columns]
        
        # Scale Area feature (create a copy to avoid SettingWithCopyWarning)
        area_value = input_encoded[['Area']].copy()
        area_scaled = yield_scaler.transform(area_value)
        input_encoded['Area'] = area_scaled
        
        # Predict
        yield_prediction = yield_model.predict(input_encoded)[0]
        yield_per_hectare = float(yield_prediction)
        total_yield = yield_per_hectare * area
        
        return {
            'yield_per_hectare': round(yield_per_hectare, 2),
            'total_yield': round(total_yield, 2),
            'area': area
        }
    except Exception as e:
        raise Exception(f"Yield prediction error: {str(e)}")


# Routes
@app.route('/')
def home():
    """Landing page."""
    return render_template('home.html')


@app.route('/crop-recommendation')
def crop_recommendation():
    """Crop recommendation page."""
    return render_template('crop_recommendation.html')


@app.route("/yield-prediction")
def yield_prediction():
    """Yield prediction page."""
    # Ensure dropdown metadata is loaded
    load_yield_metadata()

    # Optional crop value from query string (used when coming from crop recommendation)
    preselected_crop = request.args.get("crop", "").strip()

    return render_template(
        "yield_prediction.html",
        states=yield_states or [],
        seasons=yield_seasons or [],
        crops=yield_crops or [],
        preselected_crop=preselected_crop,
    )


@app.route('/soil-health')
def soil_health():
    """Soil health and fertilizer recommendation page."""
    return render_template('soil_health.html')


@app.route('/api/predict-crop', methods=['POST'])
def api_predict_crop():
    """API endpoint for crop prediction."""
    try:
        data = request.get_json()
        n = float(data.get('n', 0))
        p = float(data.get('p', 0))
        k = float(data.get('k', 0))
        temperature = float(data.get('temperature', 0))
        humidity = float(data.get('humidity', 0))
        ph = float(data.get('ph', 7))
        rainfall = float(data.get('rainfall', 0))
        
        # Validate pH range
        if ph < 0 or ph > 14:
            return jsonify({'success': False, 'error': 'pH must be between 0 and 14'}), 400
        
        # Validate humidity range
        if humidity < 0 or humidity > 100:
            return jsonify({'success': False, 'error': 'Humidity must be between 0 and 100'}), 400
        
        result = predict_crop(n, p, k, temperature, humidity, ph, rainfall)
        return jsonify({'success': True, 'result': result})
    except ValueError as e:
        return jsonify({'success': False, 'error': f'Invalid input: {str(e)}'}), 400
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400


@app.route('/api/predict-yield', methods=['POST'])
def api_predict_yield():
    """API endpoint for yield prediction."""
    try:
        data = request.get_json()
        state = data.get('state', '').strip()
        district = data.get('district', '').strip()  # Not used in model but kept for API compatibility
        season = data.get('season', '').strip()
        crop = data.get('crop', '').strip()
        area = float(data.get('area', 0))
        
        # Validate required fields
        if not state or not season or not crop:
            return jsonify({'success': False, 'error': 'State, Season, and Crop are required'}), 400
        
        if area <= 0:
            return jsonify({'success': False, 'error': 'Area must be greater than 0'}), 400
        
        result = predict_yield(state, district, season, crop, area)
        return jsonify({'success': True, 'result': result})
    except ValueError as e:
        return jsonify({'success': False, 'error': f'Invalid input: {str(e)}'}), 400
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400


@app.route('/api/predict-fertilizer', methods=['POST'])
def api_predict_fertilizer():
    """API endpoint for fertilizer prediction."""
    try:
        data = request.get_json()
        temperature = float(data.get('temperature', 0))
        humidity = float(data.get('humidity', 0))
        moisture = float(data.get('moisture', 0))
        soil_type = data.get('soilType', '').strip()
        crop_type = data.get('cropType', '').strip()
        nitrogen = float(data.get('nitrogen', 0))
        potassium = float(data.get('potassium', 0))
        phosphorous = float(data.get('phosphorous', 0))
        
        # Validate required fields
        if not soil_type or not crop_type:
            return jsonify({'success': False, 'error': 'Soil Type and Crop Type are required'}), 400
        
        # Validate ranges
        if humidity < 0 or humidity > 100:
            return jsonify({'success': False, 'error': 'Humidity must be between 0 and 100'}), 400
        
        if moisture < 0 or moisture > 100:
            return jsonify({'success': False, 'error': 'Moisture must be between 0 and 100'}), 400
        
        result = predict_fertilizer(temperature, humidity, moisture, soil_type, crop_type, nitrogen, potassium, phosphorous)
        return jsonify({'success': True, 'result': result})
    except ValueError as e:
        return jsonify({'success': False, 'error': f'Invalid input: {str(e)}'}), 400
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400


if __name__ == '__main__':
    import os
    
    # Get port from environment (for deployment platforms)
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') != 'production'
    
    print("Loading ML models...")
    load_models()
    print("Starting Flask application...")
    app.run(debug=debug, host='0.0.0.0', port=port)

