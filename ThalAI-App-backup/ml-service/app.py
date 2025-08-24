from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import uvicorn
import os
import pandas as pd

MODEL_FILE = "model_pipeline.pkl"

# Globals
bundle = None
pipe = None
numeric_features: list[str] = []
categorical_features: list[str] = []

def load_model() -> bool:
    """Load pipeline and feature lists saved by train.py"""
    global bundle, pipe, numeric_features, categorical_features
    if not os.path.exists(MODEL_FILE):
        return False
    bundle = joblib.load(MODEL_FILE)            
    pipe = bundle["pipeline"]
    numeric_features = bundle.get("numeric_features", [])
    categorical_features = bundle.get("categororical_features", [])  
    if not categorical_features:
        categorical_features = bundle.get("categorical_features", [])
    return True

class PredictIn(BaseModel):
    frequency_in_days: float | None = None
    calls_to_donations_ratio: float | None = None
    days_since_last_donation: float | None = None
    donated_earlier: float | None = None
    blood_group: str | None = None
    gender: str | None = None

class PredictOut(BaseModel):
    label: int
    score: float | None

app = FastAPI(title="ThalAI ML Service")

@app.on_event("startup")
def _startup():
    ok = load_model()
    if not ok:
        print("⚠️  model_pipeline.pkl not found. Run `python train.py` first.")

@app.get("/")
def root():
    return {
        "ok": True,
        "service": "ThalAI ML Service",
        "model_loaded": pipe is not None,
        "numeric_features": numeric_features,
        "categorical_features": categorical_features,
    }

@app.post("/predict", response_model=PredictOut)
def predict(payload: PredictIn):
    if pipe is None:
        raise HTTPException(status_code=503, detail="Model not loaded. Train first (python train.py).")

    # Build a one-row DataFrame with EXACT columns used in training
    cols = (numeric_features or []) + (categorical_features or [])
    if not cols:
        raise HTTPException(status_code=500, detail="Model bundle missing feature lists.")

    row = {c: getattr(payload, c, None) for c in cols}
    X = pd.DataFrame([row], columns=cols)

    try:
        label = int(pipe.predict(X)[0])
        score = None
        if hasattr(pipe, "predict_proba"):
            try:
                score = float(pipe.predict_proba(X)[:, 1][0])
            except Exception:
                score = None
        return {"label": label, "score": score}
    except Exception as e:
        # Return detail so you can see exactly what's wrong
        raise HTTPException(status_code=500, detail=f"Inference failed: {type(e).__name__}: {e}")

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8001, reload=True)
