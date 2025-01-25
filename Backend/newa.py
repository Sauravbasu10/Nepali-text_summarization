from flask import Flask, jsonify, request
from flask_cors import CORS  # Import CORS
import requests

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Example of a route in Flask to receive the POST request
@app.route('/url', methods=['POST'])
def handle_request():
    data = request.json  # Get the JSON data sent from the client
    print(f"Received data: {data}")
    # Process data and return a response
    return jsonify({'message': 'Request received successfully'}), 200

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
