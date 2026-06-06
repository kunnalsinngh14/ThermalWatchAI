import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path="../.env")

db = mysql.connector.connect(
    host=os.getenv("DB_HOST"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD")
)

cursor = db.cursor()
cursor.execute("DROP DATABASE IF EXISTS thermal_plant")
cursor.execute("CREATE DATABASE thermal_plant")
print("Recreated database thermal_plant successfully.")
