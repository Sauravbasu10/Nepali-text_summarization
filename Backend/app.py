from flask import Flask, request, jsonify
import requests
from flask_cors import CORS
import os
import re
from dotenv import load_dotenv
from transformers import MT5ForConditionalGeneration, MT5Tokenizer
import google.generativeai as genai
from rouge import Rouge
from Scrapper.onlinekhabar import OnlinekhabarScraper
from Scrapper.ekantipur import EkantipurScraper
from Scrapper.nayapatrika import NayaPatrikaScraper
from Scrapper.ratopati import RatopatiScraper
from Scrapper.setopati import SetopatiScraper
from Scrapper.gorkhapatra import GorkhapatraScraper
import logging

# Initialize the Flask app and enable CORS
app = Flask(__name__)
CORS(app)  # Apply CORS to all routes, allowing all origins

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables from .env file
load_dotenv()
API_KEY = os.getenv("API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyDKgHQ74jizmvOWRypFkkSdU2N1Y3X3raY")

if not API_KEY:
    raise ValueError("API_KEY not found in environment variables")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in environment variables")

# Configure Gemini API
genai.configure(api_key=GEMINI_API_KEY)

# Load the mT5 models and tokenizers once at startup
tokenizer = MT5Tokenizer.from_pretrained("Saurav20/mt5_old_train")
model = MT5ForConditionalGeneration.from_pretrained("Saurav20/mt5_old_train")

# Function to extract news from the API
def get_newsfrom_api(url):
    endpoint = "https://extractorapi.com/api/v1/extractor"
    params = {"apikey": API_KEY, "url": url}
    try:
        r = requests.get(endpoint, params=params)
        resp = r.json()
        news = resp.get('text', 'Error')
    except Exception as e:
        logger.error(f"Error in get_newsfrom_api: {e}")
        news = f"Error: {e}"
    portal_name = extract_portal_name(url)
    return {"portal_name": portal_name, "news_content": news}

# Function to extract portal name from URL
def extract_portal_name(url):
    portal_name_match = re.search(r"https?://(?:www\.)?(\w+)\.", url)
    if portal_name_match:
        return portal_name_match.group(1)
    return "Unknown"

# Function to scrape news from different portals
def get_newsfrom_url(url):
    portal_name = extract_portal_name(url)
    news = "Couldn't find url"
    scraper = None
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
        logger.error(f"Error in get_newsfrom_url: {e}")
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

# Function to generate a summary with mT5
def summary(text, model, tokenizer, max_summary_length):
    inputs = tokenizer("summarize: " + text, return_tensors="pt", max_length=1024, truncation=True)
    summary_ids = model.generate(inputs.input_ids.to(model.device), max_length=max_summary_length, num_beams=4, length_penalty=0.1, early_stopping=True)
    return tokenizer.decode(summary_ids[0], skip_special_tokens=True)

# Function to generate long summaries with mT5
def summary_nepali(text, model, tokenizer, max_summary_length=512):
    chunks = split_text_by_sentence_end_in_range(text, 100, 150)
    summaries = [summary(chunk, model, tokenizer, max_summary_length) for chunk in chunks]
    return ' '.join(summaries)

# Function to generate short summaries using mT5
def mt5Summary(text, model, tokenizer, max_summary_length=512):
    inputs = tokenizer("summarize: " + text, return_tensors="pt", max_length=max_summary_length, truncation=True)
    summary_ids = model.generate(inputs.input_ids.to(model.device), max_length=max_summary_length, num_beams=5, length_penalty=0.1, early_stopping=True)
    return tokenizer.decode(summary_ids[0], skip_special_tokens=True)

# def geminiReferenceSummary(text, target_word_count):
#     try:
#         model = genai.GenerativeModel("gemini-1.5-pro")
#         response = model.generate_content(
#             f"तपाईं एक पेशेवर पाठ संक्षेपक हुनुहुन्छ। तपाईंलाई दिइएको पाठको संक्षिप्त सारांश प्रदान गर्नुहोस्। सारांशको शब्द संख्या लगभग {target_word_count} हुनुपर्छ।\n\n" + text
#         )
#         summary = response.text
        
#         # Truncate the summary to match the target word count if necessary
#         words = summary.split()
#         if len(words) > target_word_count:
#             summary = ' '.join(words[:target_word_count])
        
#         return summary
#     except Exception as e:
#         logger.error(f"Error with Gemini API: {str(e)}")
#         raise Exception(f"Error with Gemini API: {str(e)}")
# Function to generate reference summary using Gemini
def geminiReferenceSummary(text):
    try:
        model = genai.GenerativeModel("gemini-1.5-pro")
        response = model.generate_content(
            "तपाईं एक पेशेवर पाठ संक्षेपक हुनुहुन्छ। तपाईंलाई दिइएको पाठको संक्षिप्त सारांश प्रदान गर्नुहोस्।\n\n" + text
        )
        return response.text
    except Exception as e:
        logger.error(f"Error with Gemini API: {str(e)}")
        raise Exception(f"Error with Gemini API: {str(e)}")

# Updated ROUGE score calculator using rouge.Rouge
def calculate_rouge_scores(reference, hypothesis):
    logger.info("Gemini Reference: %s", reference)
    logger.info("mT5 Hypothesis: %s", hypothesis)
    rouge = Rouge()
    scores = rouge.get_scores(hypothesis, reference)  # Note: hypothesis first, then reference
    logger.info("Raw ROUGE Scores: %s", scores)
    
    # Extract scores from the list (scores is a list of dicts, we take the first item)
    score_dict = scores[0]
    return {
        "rouge1": {
            "precision": score_dict['rouge-1']['p'],
            "recall": score_dict['rouge-1']['r'],
            "fmeasure": score_dict['rouge-1']['f']
        },
        "rouge2": {
            "precision": score_dict['rouge-2']['p'],
            "recall": score_dict['rouge-2']['r'],
            "fmeasure": score_dict['rouge-2']['f']
        },
        "rougeL": {
            "precision": score_dict['rouge-l']['p'],
            "recall": score_dict['rouge-l']['r'],
            "fmeasure": score_dict['rouge-l']['f']
        }
    }

# @app.route('/', methods=['GET', 'POST', 'OPTIONS'])
# def summarize():
#     if request.method == 'OPTIONS':
#         # Handle preflight request
#         response = jsonify({"status": "OK"})
#         response.headers['Access-Control-Allow-Origin'] = '*'
#         response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
#         response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
#         return response, 204
    
#     if request.method == 'GET':
#         return jsonify({"error": "This endpoint only supports POST requests."}), 405
    
#     if request.method == 'POST':
#         data = request.json
#         if not data:
#             return jsonify({"error": "Invalid JSON format"}), 400
#         text = data.get('text', '')
#         given_url = data.get('url', '')
#         selected_length = data.get('selectedLength')
#         if not selected_length:
#             return jsonify({"error": "Missing required parameter: selectedLength"}), 400
#         if given_url:
#             text = get_newsfrom_url(given_url)
#         formatted_text = format_paragraph(text)
#         try:
#             if selected_length == 'short':
#                 hypothesis_summary = mt5Summary(formatted_text, model, tokenizer)
#             elif selected_length == 'long':
#                 hypothesis_summary = summary_nepali(formatted_text, model, tokenizer)
#             else:
#                 return jsonify({"error": "Invalid length"}), 400
            
#             # Calculate the word count of the mT5-generated summary
#             hypothesis_word_count = len(hypothesis_summary.split())
            
#             # Generate the reference summary with a similar word count
#             reference_summary = geminiReferenceSummary(formatted_text, hypothesis_word_count)
            
#             rouge_scores = calculate_rouge_scores(reference_summary, hypothesis_summary)
#             return jsonify({
#                 'reference_summary': reference_summary,
#                 'hypothesis_summary': hypothesis_summary,
#                 'formatted_text': formatted_text,
#                 'rouge_scores': rouge_scores
#             })
#         except Exception as e:
#             logger.error(f"Error during processing: {str(e)}")
#             return jsonify({"error": f"Error during processing: {str(e)}"}), 500
        
# Route to handle POST requests with OPTIONS support
@app.route('/', methods=['GET', 'POST', 'OPTIONS'])
def summarize():
    if request.method == 'OPTIONS':
        # Handle preflight request
        response = jsonify({"status": "OK"})
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        return response, 204
    
    if request.method == 'GET':
        return jsonify({"error": "This endpoint only supports POST requests."}), 405
    
    if request.method == 'POST':
        data = request.json
        if not data:
            return jsonify({"error": "Invalid JSON format"}), 400
        text = data.get('text', '')
        given_url = data.get('url', '')
        selected_length = data.get('selectedLength')
        if not selected_length:
            return jsonify({"error": "Missing required parameter: selectedLength"}), 400
        if given_url:
            text = get_newsfrom_url(given_url)
        formatted_text = format_paragraph(text)
        try:
            reference_summary = geminiReferenceSummary(formatted_text)
            if selected_length == 'short':
                hypothesis_summary = mt5Summary(formatted_text, model, tokenizer)
            elif selected_length == 'long':
                hypothesis_summary = summary_nepali(formatted_text, model, tokenizer)
            else:
                return jsonify({"error": "Invalid length"}), 400
            rouge_scores = calculate_rouge_scores(reference_summary, hypothesis_summary)
            return jsonify({
                'reference_summary': reference_summary,
                'hypothesis_summary': hypothesis_summary,
                'formatted_text': formatted_text,
                'rouge_scores': rouge_scores
            })
        except Exception as e:
            logger.error(f"Error during processing: {str(e)}")
            return jsonify({"error": f"Error during processing: {str(e)}"}), 500

if __name__ == "__main__":
    try:
        app.run(debug=False, host='0.0.0.0', port=5000)
    except Exception as e:
        logger.error(f"Error while running the app: {str(e)}")