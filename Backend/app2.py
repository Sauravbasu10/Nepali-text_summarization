from flask import Flask, request, jsonify
import requests
from flask_cors import CORS
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import re
from dotenv import load_dotenv
import os
from Scrapper.onlinekhabar import OnlinekhabarScraper
from Scrapper.ekantipur import EkantipurScraper
from Scrapper.nayapatrika import NayaPatrikaScraper
from Scrapper.ratopati import RatopatiScraper
from Scrapper.setopati import SetopatiScraper
from Scrapper.gorkhapatra import GorkhapatraScraper

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Load models
tokenizer = AutoTokenizer.from_pretrained("Adarsh203/new_mT5_Sum")
model = AutoModelForSeq2SeqLM.from_pretrained("Adarsh203/new_mT5_Sum")

tokenizer2 = AutoTokenizer.from_pretrained("Kishan11/mBART_SUM")
model2 = AutoModelForSeq2SeqLM.from_pretrained("Kishan11/mBART_SUM")

# Load environment variables
load_dotenv()
API_KEY = os.getenv("API_KEY")
if not API_KEY:
    raise ValueError("API_KEY not found. Check your .env file.")

# Helper functions remain unchanged...

@app.route('/', methods=['GET', 'POST'])
def summarize():
    try:
        if request.method == 'POST':
            data = request.json or {}
            text = data.get('text', '')  
            given_url = data.get('url', '')  
            selected_model = data.get('selectedModel', 'model1')
            selected_length = data.get('selectedLength', 'short')

            if given_url:
                text = get_newsfrom_url(given_url)

            formatted_text = format_paragraph(text)

            if selected_model == 'model1' and selected_length == 'short':
                summarized_text = mt5Summary(formatted_text, model, tokenizer)
            elif selected_model == 'model1' and selected_length == 'long':
                summarized_text = summary_nepali(formatted_text, model, tokenizer)
            elif selected_model == 'model2' and selected_length == 'short':
                summarized_text = mbartSummary(formatted_text, model2, tokenizer2)
            elif selected_model == 'model2' and selected_length == 'long':
                summarized_text = summary_nepali(formatted_text, model2, tokenizer2)
            else:
                summarized_text = "Invalid model or length selection."

            return jsonify({'summarized_text': summarized_text, 'formatted_text': formatted_text})
        return jsonify({"message": "Send a POST request with text or URL."})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == "__main__":
    # Use a different port if needed
    app.run(debug=True, host='0.0.0.0', port=5000)
