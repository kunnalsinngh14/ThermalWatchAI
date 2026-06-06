import os
import google.generativeai as genai
from models import Plant, Unit, Request, DailySubmission, User, db
from ml_service import predict_fault
import traceback
import json
from dotenv import load_dotenv

def init_genai():
    # Force reload of .env to ensure we pick up the newly added key dynamically
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
    load_dotenv(dotenv_path=env_path, override=True)
    
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("Warning: GEMINI_API_KEY not found in environment.")
        return False
    genai.configure(api_key=api_key)
    return True

def execute_fault_detection(rpm: float, steam_temp: float, pressure: float) -> str:
    """
    Executes the ThermalWatch ML fault detection model given telemetry data.
    
    Args:
        rpm: The velocity / RPM of the turbine.
        steam_temp: The main steam temperature on the turbine side in Celsius.
        pressure: The main steam pressure in MPa.
        
    Returns:
        A string describing the predicted fault class and confidence score.
    """
    try:
        telemetry = {
            'rpm': rpm,
            'steamTemp': steam_temp,
            'pressure': pressure
        }
        result = predict_fault(telemetry)
        return f"Prediction: {result['problem_class']} with {result['confidence_score']}% confidence."
    except Exception as e:
        return f"Failed to execute fault detection: {str(e)}"

def get_plant_stats() -> str:
    """
    Queries the database to return the current status of all plants, including total units, faulty units, and capacity.
    
    Returns:
        A JSON string containing the plant statistics.
    """
    try:
        plants = Plant.query.all()
        result = []
        for p in plants:
            running = Unit.query.filter_by(plant_id=p.id, status='running').count()
            maintenance = Unit.query.filter_by(plant_id=p.id, status='under_maintenance').count()
            faulty = Unit.query.filter_by(plant_id=p.id, status='faulty').count()
            result.append({
                "plant_name": p.name,
                "capacity_mw": float(p.nameplate_capacity),
                "total_units": p.total_units,
                "running_units": running,
                "maintenance_units": maintenance,
                "faulty_units": faulty
            })
        return json.dumps(result)
    except Exception as e:
        return f"Error querying database: {str(e)}"

def get_daily_submissions(plant_name: str = None, date: str = None) -> str:
    """
    Queries the database for daily historical telemetry submissions (power generated, water/coal consumption, CO2 emissions, etc.).
    
    Args:
        plant_name: Optional. The name of the plant to filter by (e.g., 'Ahmedabad Power Plant').
        date: Optional. The specific date to filter by in 'YYYY-MM-DD' format (e.g., '2026-06-06').
        
    Returns:
        A JSON string containing the daily submissions matching the criteria.
    """
    try:
        query = DailySubmission.query.join(Plant)
        if plant_name:
            query = query.filter(Plant.name.ilike(f"%{plant_name}%"))
        if date:
            query = query.filter(DailySubmission.date == date)
            
        submissions = query.all()
        result = []
        for s in submissions:
            result.append({
                "plant_name": s.plant.name,
                "date": str(s.date),
                "power_generated_mwh": float(s.power_generated),
                "auxiliary_power_mw": float(s.auxiliary_power),
                "water_consumption_m3": float(s.water_consumption),
                "coal_consumption_t": float(s.coal_consumption),
                "co2_emissions_t": float(s.co2_emissions),
                "fly_ash_t": float(s.fly_ash)
            })
        if not result:
            return "No submissions found for the given criteria."
        return json.dumps(result)
    except Exception as e:
        return f"Error querying database: {str(e)}"

def get_system_users_stats() -> str:
    """
    Queries the database to return the count of engineers and administrators in the system.
    
    Returns:
        A JSON string containing user statistics.
    """
    try:
        engineers = User.query.filter_by(role='engineer').count()
        admins = User.query.filter_by(role='admin').count()
        return json.dumps({
            "total_users": engineers + admins,
            "engineers": engineers,
            "administrators": admins
        })
    except Exception as e:
        return f"Error querying user database: {str(e)}"

_chat_model = None

def get_chat_model():
    global _chat_model
    if _chat_model is None:
        init_genai()
        system_instruction = (
            "You are the ThermalWatch AI Assistant, an intelligent engineering bot designed to help operators "
            "monitor thermal power plants. You can answer general questions, explain the system, and use your tools "
            "to query real-time database statistics or execute fault detection models. Always be helpful, concise, "
            "and format your responses in Markdown for readability."
        )
        _chat_model = genai.GenerativeModel(
            model_name='gemini-3.5-flash',
            tools=[execute_fault_detection, get_plant_stats, get_daily_submissions, get_system_users_stats],
            system_instruction=system_instruction
        )
    return _chat_model

def process_chat_message(messages):
    try:
        model = get_chat_model()
        formatted_history = []
        if not messages:
            return "No message provided."
            
        current_message = messages[-1].get('content', '')
        if not current_message:
            current_message = messages[-1].get('parts', [''])[0]
            
        history_msgs = messages[:-1]
        
        for msg in history_msgs:
            role = msg.get('role', 'user')
            if role == 'assistant':
                role = 'model'
            text = msg.get('content', '')
            if not text:
                text = msg.get('parts', [''])[0]
            formatted_history.append({"role": role, "parts": [text]})
        
        chat = model.start_chat(history=formatted_history, enable_automatic_function_calling=True)
        response = chat.send_message(current_message)
        
        return response.text
    except Exception as e:
        traceback.print_exc()
        error_msg = str(e)
        if "429" in error_msg and "quota" in error_msg.lower():
            return "⚠️ **Rate Limit Exceeded:** You've made too many requests to the AI in a short period of time. Please wait about 30 to 60 seconds and try your question again!"
        return f"Error communicating with AI: {error_msg}"
