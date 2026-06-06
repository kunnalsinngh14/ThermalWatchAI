import pandas as pd
import numpy as np
import pickle
import os
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.preprocessing import StandardScaler

# Ensure models directory exists
os.makedirs('models', exist_ok=True)

print("1. Loading dataset...")
try:
    df = pd.read_csv('../industrial_dataset.csv')
    print(f"Dataset shape: {df.shape}")
except Exception as e:
    print(f"Error loading dataset: {e}")
    exit(1)

print("2. Engineering Labels based on PRD specifications...")
# We need to create a 'ProblemClass' label based on telemetry thresholds since the dataset lacks explicit labels.
# Core features to use as per PRD: RPM, Steam Temperature, Pressure

# We'll calculate z-scores for key columns to simulate threshold violations
def engineer_labels(row):
    rpm = row['Velocity (m/s)']
    temp = row['Main steam temperature (turbine side) (℃)']
    pressure = row['Main steam pressure (turbine side) (MPa)']
    
    # Simple threshold logic for simulation
    if temp > df['Main steam temperature (turbine side) (℃)'].quantile(0.95):
        return 'Overheating'
    elif pressure > df['Main steam pressure (turbine side) (MPa)'].quantile(0.95):
        return 'Pressure Anomaly'
    elif rpm > df['Velocity (m/s)'].quantile(0.95):
        return 'Blade Deformation'
    elif row['Boiler Eff (%)'] < df['Boiler Eff (%)'].quantile(0.05):
        return 'Efficiency Degradation'
    elif row['SO2 (mg/m3)'] > df['SO2 (mg/m3)'].quantile(0.95):
        return 'Emission Violation'
    else:
        return 'Normal'

df['Fault_Class'] = df.apply(engineer_labels, axis=1)

print("Class distribution:")
print(df['Fault_Class'].value_counts())

print("3. Preprocessing Data...")
# Select numerical features
features = [col for col in df.columns if col not in ['Timestamp', 'Fault_Class', 'Machine_ID', 'Sensor_ID', 'Location']]
X = df[features]
y = df['Fault_Class']

# Convert string labels to integers for XGBoost
label_mapping = {label: idx for idx, label in enumerate(y.unique())}
inverse_mapping = {idx: label for label, idx in label_mapping.items()}
y_encoded = y.map(label_mapping)

X_train, X_test, y_train, y_test = train_test_split(X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded)

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

print("4. Training Random Forest...")
rf_model = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42, n_jobs=-1)
rf_model.fit(X_train_scaled, y_train)
rf_preds = rf_model.predict(X_test_scaled)
rf_acc = accuracy_score(y_test, rf_preds)
print(f"Random Forest Accuracy: {rf_acc:.4f}")

print("5. Training XGBoost...")
xgb_model = XGBClassifier(n_estimators=100, max_depth=6, learning_rate=0.1, random_state=42, n_jobs=-1)
xgb_model.fit(X_train_scaled, y_train)
xgb_preds = xgb_model.predict(X_test_scaled)
xgb_acc = accuracy_score(y_test, xgb_preds)
print(f"XGBoost Accuracy: {xgb_acc:.4f}")

# Select the best model (usually XGBoost for tabular data)
best_model = xgb_model if xgb_acc >= rf_acc else rf_model
best_name = "XGBoost" if xgb_acc >= rf_acc else "Random Forest"
print(f"\n6. Selecting Best Model: {best_name}")

print("\nClassification Report (Best Model):")
preds = best_model.predict(X_test_scaled)
print(classification_report(y_test, preds, target_names=[inverse_mapping[i] for i in range(len(inverse_mapping))]))

print("7. Saving Model & Artifacts...")
with open('models/thermal_fault_model.pkl', 'wb') as f:
    pickle.dump({
        'model': best_model,
        'scaler': scaler,
        'features': features,
        'label_mapping': inverse_mapping
    }, f)

print("Done! Model saved to backend/models/thermal_fault_model.pkl")
