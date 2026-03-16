#  Agri-Guide: AI-Powered Precision Farming Suite (ML + DL + RAG Chatbot)

Agri-Guide is an agricultural intelligence platform that combines **traditional ML**, **deep learning**, and a **RAG (Retrieval-Augmented Generation) chatbot** to help farmers make better decisions across crop planning, yield estimation, soil health, and disease management.

##  Live Demo

- **Website**: `https://agri-guide-2.onrender.com`

## Features

-  **Crop Recommendation (ML)**: Suggests best crop using NPK + climate + pH with confidence score
-  **Yield Prediction (ML)**: Predicts yield per hectare and total yield (based on location/season/crop/area)
-  **Soil Health & Fertilizer Recommendation (ML)**: Predicts fertilizer and provides soil advice
-  **Leaf Disease Detection (Deep Learning)**: Upload/scan leaf images to detect diseases (EfficientNet) + treatment tips
-  **Agri-Guide Assistant (RAG Chatbot)**:
  - Embedded chat widget across the site
  - Uses **FAISS vector DB** built from `knowledge_base/` (PDFs) + project CSVs
  - Calls **OpenRouter** (Gemma model) and returns answers + sources when available

##  Tech Stack

- **Backend**: Python, Flask, Jinja2
- **ML**: scikit-learn, pandas, numpy (Random Forest models + encoders)
- **Deep Learning**: PyTorch, torchvision, Pillow (image disease detection)
- **RAG / Vector Search**: LangChain, FAISS (`faiss-cpu`), Sentence Transformers (`all-MiniLM-L6-v2`), PyPDF
- **Deployment**: Gunicorn, Render (`render.yaml`), startup script (`startup.sh`)

##  Updated Project Structure 

```
.
├── web_app.py                      # Flask app: UI routes + ML/DL/RAG APIs
├── app.py                          # Training entry point (runs training pipeline)
├── requirements.txt
├── startup.sh                      # Deploy: trains models if missing, then starts Gunicorn
├── render.yaml                     # Render deployment config
├── Procfile                        # Procfile for platforms using it
│
├── agri_guide/                     # Training pipeline package
│   ├── components/                 # Data ingestion/transformation + trainers
│   └── pipeline/training_pipeline.py
│
├── templates/                      # UI templates
│   ├── home.html
│   ├── crop_recommendation.html
│   ├── yield_prediction.html
│   ├── soil_health.html
│   └── disease_detection.html
│
├── static/
│   ├── css/style.css
│   └── js/
│       ├── chatbot.js              # Chat widget frontend
│       ├── disease_detection.js
│       ├── crop_recommendation.js
│       ├── yield_prediction.js
│       ├── soil_health.js
│       └── main.js
│
├── final_model/                    # Trained ML artifacts (created by training)
│   ├── crop_recommendation_model.pkl
│   ├── label_encoder.pkl
│   ├── yield_model.pkl
│   ├── yield_scaler.pkl
│   ├── yield_feature_columns.pkl
│   ├── yield_state_encoder.pkl
│   ├── yield_season_encoder.pkl
│   ├── yield_crop_encoder.pkl
│   ├── fertilizer_model.pkl
│   ├── soil_encoder.pkl
│   ├── crop_encoder.pkl
│   └── fertilizer_encoder.pkl
│
├── DeepLearningModels/
│   └── plant_disease_model.pth     # Pretrained disease model (required)
│
├── deep_learning/
│   ├── disease_predictor.py        # Loads EfficientNet + runs inference
│   └── class_labels.py
│
├── chatbot/
│   ├── chat_service.py             # OpenRouter chat + history + guardrails
│   ├── rag_pipeline.py             # FAISS retrieval (loads on first request)
│   ├── build_vector_db.py          # Build vector_db/ from PDFs + CSVs
│   └── prompt_template.py
│
├── knowledge_base/
│   └── plant_disease_management_protocol.pdf
│
├── vector_db/                      # FAISS index + metadata (used by RAG)
│   └── metadata.json
│
└── raw_data/
    ├── Crop_recommendation.csv
    └── crop_production.csv
```

##  Installation (Local)

### Prerequisites

- Python **3.9+** recommended (Render config uses 3.9.16)

### Setup

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

##  Environment Variables

Create a `.env` file in the project root (or set env vars in your OS/deployment):

```env
# Required for the chatbot (OpenRouter)
OPENROUTER_API_KEY=your_key_here

# Optional (only used by chatbot/check_models.py)
GOOGLE_API_KEY=your_key_here
```

##  Required Assets (Important)

- **Deep learning disease model**: place the file here:
  - `DeepLearningModels/plant_disease_model.pth`
- **ML model `.pkl` files**:
  - Either **train locally** via `python app.py`, or let deployment auto-train using `startup.sh`

## 🚀 Run the Application

### Option A: Run the Web App (recommended)

```bash
python web_app.py
```

Open:
- **Home**: `http://localhost:5000/`
- **Crop Recommendation**: `http://localhost:5000/crop-recommendation`
- **Yield Prediction**: `http://localhost:5000/yield-prediction`
- **Soil Health**: `http://localhost:5000/soil-health`
- **Disease Detection**: `http://localhost:5000/disease-detection`

### Option B: Train / Retrain ML Models

```bash
python app.py
```

This runs the training pipeline (`agri_guide/pipeline/training_pipeline.py`) and writes artifacts into `final_model/`.

##  RAG Chatbot (Vector DB)

The chatbot retrieves answers from a local FAISS vector database in `vector_db/`.

### Build / Rebuild the Vector DB

```bash
python chatbot/build_vector_db.py
```

Sources used:
- PDFs in `knowledge_base/`
- CSVs: `raw_data/Crop_recommendation.csv`, `Fertilizer_Prediction.csv` (as configured in `chatbot/build_vector_db.py`)

##  API Endpoints (Backend)

- **Health**: `GET /api/health`
- **Crop prediction**: `POST /api/predict-crop`
- **Yield prediction**: `POST /api/predict-yield`
- **Fertilizer prediction**: `POST /api/predict-fertilizer`
- **Disease prediction**: `POST /api/predict-disease` (multipart form-data with `image`)
- **Chatbot**: `POST /api/chat` (JSON: `message`, `session_id`, optional `context`)

##  System Flowchart (End-to-End)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                  DATA / ASSETS                               │
├──────────────────────────────────────────────────────────────────────────────┤
│ ML Datasets: raw_data/Crop_recommendation.csv, raw_data/crop_production.csv  │
│            Fertilizer_Prediction.csv                                         │
│ DL Model:   DeepLearningModels/plant_disease_model.pth                       │
│ RAG Docs:   knowledge_base/*.pdf  (+ CSV sentences during build)             │
└──────────────────────────────────────────────────────────────────────────────┘

        ┌──────────────────────────────────────────────────────────────┐
        │                           (1) ML                              │
        └──────────────────────────────────────────────────────────────┘
┌───────────────────────────────┐                ┌──────────────────────────────┐
│ app.py                         │                │ final_model/                  │
│ agri_guide training pipeline    │ ───────────▶   │ *.pkl models + encoders       │
│ - crop recommendation           │                │ (crop, yield, fertilizer)     │
│ - yield prediction              │                └──────────────────────────────┘
│ - fertilizer prediction         │
└───────────────────────────────┘

        ┌──────────────────────────────────────────────────────────────┐
        │                           (2) DL                              │
        └──────────────────────────────────────────────────────────────┘
┌───────────────────────────────┐                ┌──────────────────────────────┐
│ deep_learning/disease_predictor│                │ /api/predict-disease          │
│ - load EfficientNet + .pth     │ ───────────▶   │ image → preprocess → predict  │
│ - leafiness check (guardrail)  │                │ disease + confidence + advice │
└───────────────────────────────┘                └──────────────────────────────┘

        ┌──────────────────────────────────────────────────────────────┐
        │                           (3) RAG                             │
        └──────────────────────────────────────────────────────────────┘
┌───────────────────────────────┐                ┌──────────────────────────────┐
│ chatbot/build_vector_db.py     │                │ vector_db/ (FAISS index)      │
│ PDFs + CSV sentences → chunks  │ ───────────▶   │ loaded on first chat request  │
│ embeddings (MiniLM) → FAISS    │                └──────────────────────────────┘
└───────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                           Flask Web App (web_app.py)                          │
├──────────────────────────────────────────────────────────────────────────────┤
│ UI: /, /crop-recommendation, /yield-prediction, /soil-health, /disease-detection│
│ APIs: /api/predict-crop, /api/predict-yield, /api/predict-fertilizer,          │
│      /api/predict-disease, /api/chat                                           │
└──────────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────┐                ┌──────────────────────────────┐
│ Frontend forms + results       │                │ Chat widget (static/js/chatbot.js)│
│ templates/ + static/js         │                │ /api/chat + optional context  │
└───────────────────────────────┘                └──────────────────────────────┘
```



