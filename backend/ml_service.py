import pickle
import os

# Try to import sklearn and pandas. If DLL load fails, we catch it here.
USE_FALLBACK = False
try:
    import pandas as pd
    import sklearn
except Exception as e:
    print(f"Warning: Failed to import pandas or sklearn ({e}). Using pure-Python heuristic fallback.")
    USE_FALLBACK = True

model_data = None
model_path = os.path.join(os.path.dirname(__file__), 'models', 'thermal_fault_model.pkl')

def load_model():
    global model_data, USE_FALLBACK
    if USE_FALLBACK:
        return False
    if os.path.exists(model_path):
        try:
            with open(model_path, 'rb') as f:
                model_data = pickle.load(f)
            return True
        except Exception as e:
            print(f"Warning: Failed to load model pickle ({e}). Falling back to heuristic model.")
            USE_FALLBACK = True
            return False
    return False

def heuristic_predict(rpm, steam_temp, pressure):
    """
    Pure-Python heuristic prediction based on physical thresholds of the plant.
    Matches the classes and behaviors of the real ML model.
    """
    # UI default: rpm=3000, steamTemp=540, pressure=14.5
    # Let's define reasonable threshold bounds:
    
    # Check for anomalies
    if steam_temp > 560.0:
        # Overheating
        excess = min((steam_temp - 560.0) / 40.0, 1.0)
        confidence = 85.0 + excess * 14.0 # 85% to 99%
        return "Overheating", confidence
    elif pressure > 15.0:
        # Pressure Anomaly
        excess = min((pressure - 15.0) / 5.0, 1.0)
        confidence = 85.0 + excess * 14.0
        return "Pressure Anomaly", confidence
    elif rpm > 3400.0:
        # Blade Deformation
        excess = min((rpm - 3400.0) / 1000.0, 1.0)
        confidence = 85.0 + excess * 14.0
        return "Blade Deformation", confidence
    elif rpm < 2500.0 or steam_temp < 500.0 or pressure < 12.0:
        # Efficiency Degradation
        confidence = 88.0
        return "Efficiency Degradation", confidence
    else:
        return "Normal", 98.5

def predict_fault(telemetry):
    """
    telemetry should be a dict with keys mapping to the required features.
    """
    global USE_FALLBACK
    
    if not isinstance(telemetry, dict):
        raise ValueError("Invalid telemetry values")
        
    try:
        rpm = float(telemetry.get('rpm', 3000))
        steam_temp = float(telemetry.get('steamTemp', 540))
        pressure = float(telemetry.get('pressure', 14.5))
    except (ValueError, TypeError):
        raise ValueError("Invalid telemetry values")

    # If fallback is enabled, run the heuristic immediately
    if USE_FALLBACK:
        problem_class, confidence_score = heuristic_predict(rpm, steam_temp, pressure)
        return {
            "problem_class": problem_class,
            "confidence_score": float(round(confidence_score, 2)),
            "fallback_used": True
        }
        
    if model_data is None:
        if not load_model():
            problem_class, confidence_score = heuristic_predict(rpm, steam_temp, pressure)
            return {
                "problem_class": problem_class,
                "confidence_score": float(round(confidence_score, 2)),
                "fallback_used": True
            }
            
    try:
        features = model_data['features']
        scaler = model_data['scaler']
        model = model_data['model']
        label_mapping = model_data['label_mapping']
        
        # Construct input dataframe
        input_dict = {f: 0 for f in features}
        
        # Map from UI names to Dataset names
        input_dict['Velocity (m/s)'] = rpm
        input_dict['Main steam temperature (turbine side) (℃)'] = steam_temp
        input_dict['Main steam pressure (turbine side) (MPa)'] = pressure
        
        df_input = pd.DataFrame([input_dict])
        
        # Scale
        X_scaled = scaler.transform(df_input)
        
        # Predict probabilities
        probs = model.predict_proba(X_scaled)[0]
        pred_idx = model.predict(X_scaled)[0]
        
        # Get highest confidence class
        problem_class = label_mapping[pred_idx]
        confidence_score = probs[pred_idx] * 100
        
        return {
            "problem_class": problem_class,
            "confidence_score": float(round(confidence_score, 2)),
            "fallback_used": False
        }
    except Exception as e:
        print(f"Warning: ML prediction execution failed ({e}). Falling back to heuristic.")
        USE_FALLBACK = True
        problem_class, confidence_score = heuristic_predict(rpm, steam_temp, pressure)
        return {
            "problem_class": problem_class,
            "confidence_score": float(round(confidence_score, 2)),
            "fallback_used": True
        }
