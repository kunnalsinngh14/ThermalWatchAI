import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_alert_email(to_email, fault_details):
    smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
    smtp_port = int(os.getenv('SMTP_PORT', 587))
    smtp_user = os.getenv('SMTP_USER')
    smtp_pass = os.getenv('SMTP_PASS')
    
    if not smtp_user or not smtp_pass:
        print("WARNING: SMTP credentials not configured. Email will not be sent.")
        return False

    msg = MIMEMultipart()
    msg['From'] = smtp_user
    msg['To'] = to_email
    msg['Subject'] = f"URGENT: Fault Detected in Plant {fault_details.get('plant_id')} Unit {fault_details.get('unit_id')}"

    body = f"""
    ThermalGuard AI has detected an anomaly.
    
    Plant ID: {fault_details.get('plant_id')}
    Unit ID: {fault_details.get('unit_id')}
    Fault Type: {fault_details.get('fault_type')}
    Confidence Score: {fault_details.get('confidence_score')}%
    Priority: {fault_details.get('priority')}
    
    Telemetry Details:
    RPM: {fault_details.get('telemetry', {}).get('rpm')}
    Steam Temp: {fault_details.get('telemetry', {}).get('steamTemp')}
    Pressure: {fault_details.get('telemetry', {}).get('pressure')}
    
    Please log in to the dashboard to take action immediately.
    """
    
    msg.attach(MIMEText(body, 'plain'))

    try:
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_pass)
        text = msg.as_string()
        server.sendmail(smtp_user, to_email, text)
        server.quit()
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False
