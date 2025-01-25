import requests
import os
from dotenv import load_dotenv

# Load API_KEY from .env
load_dotenv()
API_KEY = os.getenv("API_KEY")
if not API_KEY:
    print("API_KEY is not set. Check your .env file.")
    exit()

# Test API endpoint
url = "https://extractorapi.com/api/v1/extractor"
test_url = "https://www.example.com"  # Replace with a real URL for testing

params = {
    "apikey": API_KEY,
    "url": test_url
}

try:
    response = requests.get(url, params=params)
    if response.status_code == 200:
        print("API_KEY is valid!")
        print("Response:", response.json())
    else:
        print(f"Failed! Status code: {response.status_code}")
        print("Response:", response.json())
except Exception as e:
    print(f"Error: {e}")
