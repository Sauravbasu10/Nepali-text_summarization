from flask import Flask, request, jsonify
import requests
from flask_cors import CORS
import os
import re
from dotenv import load_dotenv
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
from Scrapper.onlinekhabar import OnlinekhabarScraper
from Scrapper.ekantipur import EkantipurScraper
from Scrapper.nayapatrika import NayaPatrikaScraper
from Scrapper.ratopati import RatopatiScraper
from Scrapper.setopati import SetopatiScraper
from Scrapper.gorkhapatra import GorkhapatraScraper

# Initialize the Flask app and enable CORS
app = Flask(__name__)
CORS(app)

# Load environment variables from .env file
load_dotenv()
API_KEY = os.getenv("API_KEY")
if not API_KEY:
    raise ValueError("API_KEY not found in environment variables")

# Load the models and tokenizers
tokenizer = AutoTokenizer.from_pretrained("Saurav20/mt5_model")
model = AutoModelForSeq2SeqLM.from_pretrained("Saurav20/mt5_model")


#tokenizer = AutoTokenizer.from_pretrained("Adarsh203/new_mT5_Sum")
#model = AutoModelForSeq2SeqLM.from_pretrained("Adarsh203/new_mT5_Sum")


# Function to extract news from the API
def get_newsfrom_api(url):
    endpoint = "https://extractorapi.com/api/v1/extractor"
    params = {
        "apikey": API_KEY,
        "url": url
    }
    try:
        r = requests.get(endpoint, params=params)
        resp = r.json()
        news = resp.get('text', 'Error')
    except Exception as e:
        news = f"Error: {e}"
    portal_name = extract_portal_name(url)
    return {
        "portal_name": portal_name,
        "news_content": news
    }

# Function to extract portal name from URL
def extract_portal_name(url):
    portal_name_match = re.search(r"https?://(?:www\.)?(\w+)\.", url)
    if portal_name_match:
        return portal_name_match.group(1)
    return "Unknown"

# Function to scrape news from different portals
def get_newsfrom_url(url):
    portal_name = extract_portal_name(url)
    news = "Couldn't find url"  # Default message
    scraper = None  # Initialize scraper to None
    try:
        if portal_name == "onlinekhabar":
            scraper = OnlinekhabarScraper(url)
        elif portal_name == "ratopati":
            scraper = RatopatiScraper(url)
        elif portal_name == "setopati":
            scraper = SetopatiScraper(url)
        elif portal_name == "nayapatrikadaily":
            scraper = NayaPatrikaScraper(url)
        elif portal_name == "ekantipur":
            scraper = EkantipurScraper(url)
        elif portal_name == "gorkhapatra":
            scraper = GorkhapatraScraper(url)

        if scraper is not None:
            news_json = scraper.get_news_json()
            news = news_json.get("news_content", "News content not found")
        else:
            news_data = get_newsfrom_api(url)
            news = news_data.get("news_content", "News content not found")
    except Exception as e:
        news = f"Error: {e}"
    
    return news

# Function to format the input paragraph
def format_paragraph(text):
    pattern = r'[a-zA-Z0-9!#@_$%^&*]'
    text_without_chars = re.sub(pattern, '', text)
    lines = [line.strip() for line in text_without_chars.splitlines() if line.strip()]
    formatted_text = ' '.join(lines)
    return formatted_text

# Function to split text into chunks by sentence
def split_text_by_sentence_end_in_range(text, min_chunk_size, max_chunk_size, delimiter='।'):
    words = text.split()
    chunks = []
    current_chunk = []
    current_word_count = 0

    for word in words:
        current_chunk.append(word)
        current_word_count += 1

        if min_chunk_size <= current_word_count <= max_chunk_size and word.endswith(delimiter):
            chunks.append(" ".join(current_chunk))
            current_chunk = []
            current_word_count = 0
        elif current_word_count > max_chunk_size:
            chunk_text = " ".join(current_chunk)
            last_delimiter_index = chunk_text.rfind(delimiter)
            if last_delimiter_index != -1:
                split_point = last_delimiter_index + len(delimiter)
                chunks.append(chunk_text[:split_point])
                remaining_text = chunk_text[split_point:].strip()
                current_chunk = remaining_text.split()
                current_word_count = len(current_chunk)
            else:
                chunks.append(chunk_text)
                current_chunk = []
                current_word_count = 0

    if current_chunk:
        chunks.append(" ".join(current_chunk))
    return chunks

# Function to generate a summary
def summary(text, model, tokenizer, max_summary_length):
    inputs = tokenizer(text, return_tensors="pt", max_length=1024, truncation=True)
    input_ids = inputs.input_ids.to(model.device)
    summary_ids = model.generate(input_ids, max_length=max_summary_length, num_beams=4, length_penalty=0.1, early_stopping=True)
    generated_summary = tokenizer.decode(summary_ids[0], skip_special_tokens=True)
    return generated_summary

# Function to generate long summaries
def summary_nepali(text, model, tokenizer, max_summary_length=512):
    chunks = split_text_by_sentence_end_in_range(text, 100, 150)
    summaries = [summary(chunk, model, tokenizer, max_summary_length) for chunk in chunks]
    final_summary = ' '.join(summaries)
    return final_summary

# Function to generate short summaries using mT5
def mt5Summary(text, model, tokenizer, max_summary_length=512):
    input = tokenizer(text, return_tensors="pt", max_length=max_summary_length, truncation=True)
    summary_ids = model.generate(input.input_ids.to(model.device), max_length=max_summary_length, num_beams=5, length_penalty=0.1, early_stopping=True)
    summary = tokenizer.decode(summary_ids[0], skip_special_tokens=True)
    return summary

# Function to generate short summaries using mBART
def mbartSummary(text, model, tokenizer, max_summary_length=512):
    inputs = tokenizer(text, return_tensors="pt", max_length=max_summary_length, truncation=True)
    summary_ids = model.generate(inputs.input_ids.to(model.device), max_length=max_summary_length, num_beams=5, length_penalty=0.1, early_stopping=True)
    summary = tokenizer.decode(summary_ids[0], skip_special_tokens=True)
    return summary

# Route to handle POST requests for summarization
@app.route('/', methods=['GET', 'POST'])
def summarize():
    # Handle GET request explicitly
    if request.method == 'GET':
        return jsonify({"error": "This endpoint only supports POST requests."}), 405

    # Handle POST request
    if request.method == 'POST':
        data = request.json
        if not data:
            return jsonify({"error": "Invalid JSON format"}), 400

        text = data.get('text', '')
        given_url = data.get('url', '')
        selected_model = data.get('selectedModel')
        selected_length = data.get('selectedLength')

        if not selected_model or not selected_length:
            return jsonify({"error": "Missing required parameters"}), 400

        if given_url:
            text = get_newsfrom_url(given_url)

        formatted_text = format_paragraph(text)

        try:
            if selected_model == 'model1' and selected_length == 'short':
                summarized_text = mt5Summary(formatted_text, model, tokenizer)
            elif selected_model == 'model1' and selected_length == 'long':
                summarized_text = summary_nepali(formatted_text, model, tokenizer)
            elif selected_model == 'model2' and selected_length == 'short':
                summarized_text = mbartSummary(formatted_text, model2, tokenizer2)
            elif selected_model == 'model2' and selected_length == 'long':
                summarized_text = summary_nepali(formatted_text, model2, tokenizer2)
            else:
                return jsonify({"error": "Invalid model or length"}), 400

            return jsonify({'summarized_text': summarized_text, 'formatted_text': formatted_text})

        except Exception as e:
            return jsonify({"error": f"Error during summarization: {str(e)}"}), 500

# Start the Flask app
if __name__ == "__main__":
    try:
        app.run(debug=False, host='localhost', port=5000)
    except Exception as e:
        print(f"Error while running the app: {str(e)}")
