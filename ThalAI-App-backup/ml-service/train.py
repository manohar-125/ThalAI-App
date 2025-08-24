# ml-service/train.py
import pandas as pd
import numpy as np
from dateutil import parser
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score
import joblib
from pathlib import Path

DATA_PATH = Path("data/Hackathon Data.csv")
MODEL_PATH = Path("model_pipeline.pkl")
META_PATH = Path("model_meta.json")

def parse_days_since(date_str, reference=None):
    if pd.isna(date_str) or str(date_str).strip().lower() in ("nan", "", "none"):
        return np.nan
    try:
        dt = parser.parse(str(date_str)).date()
        ref = reference if reference is not None else pd.Timestamp.today().date()
        return (pd.Timestamp(ref) - pd.Timestamp(dt)).days
    except Exception:
        return np.nan

def main():
    df = pd.read_csv(DATA_PATH)

    y = None
    if "user_donation_active_status" in df.columns:
        y = df["user_donation_active_status"].astype(str).str.strip().str.lower().map(
            {"active": 1, "inactive": 0}
        )
    elif "status" in df.columns:
        y = df["status"].astype(str).str.strip().str.lower().map(
            {"active": 1, "inactive": 0}
        )
    else:
        raise ValueError("No suitable target column found (user_donation_active_status/status).")

    freq = "frequency_in_days" if "frequency_in_days" in df.columns else None
    calls_ratio = "calls_to_donations_ratio" if "calls_to_donations_ratio" in df.columns else None

    blood = "blood_group" if "blood_group" in df.columns else None
    gender = "gender" if "gender" in df.columns else None

    last_bridge = "last_bridge_donation_date" if "last_bridge_donation_date" in df.columns else None
    last_transfusion = "last_transfusion_date" if "last_transfusion_date" in df.columns else None

    df_feat = pd.DataFrame(index=df.index)

    if freq:
        df_feat["frequency_in_days"] = pd.to_numeric(df[freq], errors="coerce")

    if calls_ratio:
        df_feat["calls_to_donations_ratio"] = pd.to_numeric(df[calls_ratio], errors="coerce")

    if blood:
        df_feat["blood_group"] = df[blood].astype(str).str.strip().replace({"nan": np.nan})

    if gender:
        df_feat["gender"] = df[gender].astype(str).str.strip().replace({"nan": np.nan})

    # derive "days_since_last_donation" from whichever date exists
    days_col = None
    if last_bridge and df[last_bridge].notna().any():
        days_col = "days_since_last_donation"
        df_feat[days_col] = df[last_bridge].apply(parse_days_since)
    elif last_transfusion and df[last_transfusion].notna().any():
        days_col = "days_since_last_donation"
        df_feat[days_col] = df[last_transfusion].apply(parse_days_since)

    # donated_earlier boolean (if present)
    if "donated_earlier" in df.columns:
        df_feat["donated_earlier"] = (
            df["donated_earlier"].astype(str).str.lower().map(
                {"true": 1, "false": 0}
            )
        )

    numeric_features = [c for c in ["frequency_in_days", "calls_to_donations_ratio", "days_since_last_donation", "donated_earlier"] if c in df_feat.columns]
    categorical_features = [c for c in ["blood_group", "gender"] if c in df_feat.columns]

    if df_feat.empty or (len(numeric_features) + len(categorical_features) == 0):
        raise ValueError("No usable features constructed. Check column names in your CSV.")

    mask = y.notna()
    X = df_feat.loc[mask].copy()
    y_final = y.loc[mask].astype(int)

    X_train, X_test, y_train, y_test = train_test_split(X, y_final, test_size=0.2, random_state=42, stratify=y_final)

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", SimpleImputer(strategy="median"), numeric_features),
            ("cat", Pipeline(steps=[
                ("impute", SimpleImputer(strategy="most_frequent")),
                ("onehot", OneHotEncoder(handle_unknown="ignore"))
            ]), categorical_features)
        ]
    )

    clf = RandomForestClassifier(
        n_estimators=200,
        max_depth=None,
        random_state=42,
        class_weight="balanced_subsample"
    )

    pipe = Pipeline(steps=[("prep", preprocessor), ("clf", clf)])
    pipe.fit(X_train, y_train)

    preds = pipe.predict(X_test)
    try:
        proba = pipe.predict_proba(X_test)[:, 1]
    except Exception:
        proba = None

    print("Accuracy:", round(accuracy_score(y_test, preds), 4))
    print(classification_report(y_test, preds, digits=4))

    joblib.dump({"pipeline": pipe, "numeric_features": numeric_features, "categorical_features": categorical_features}, MODEL_PATH)
    print(f"Saved model to {MODEL_PATH.resolve()}")

if __name__ == "__main__":
    main()
