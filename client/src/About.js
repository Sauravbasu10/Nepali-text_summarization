import React from 'react';
import './App.css'; // Ensure this import is present

const About = () => {
  return (
    <div className="about-container">
      <h2>About the Nepali News Summarizer</h2>
      <p>
        The Nepali News Summarizer is an AI-powered tool designed to create abstractive summaries of Nepali news articles using the transformer-based mT5 model. This project aims to bridge the gap in NLP tools for the Nepali language, making news content more accessible and concise for Nepali readers.
      </p>
      <p>
        The system leverages advanced models like mT5, fine-tuned on Nepali news data, and Gemini AI for generating reference summaries. It evaluates summary quality using ROUGE scores, comparing mT5-generated summaries against Gemini AI outputs. A web application integrates these technologies, with a React-based frontend for user interaction and a Python-based backend for processing summarization requests.
      </p>
      <p>
        The project involves collecting and preprocessing Nepali news content—normalizing and tokenizing it—before splitting it into 80% training and 20% validation sets. After fine-tuning over 10 epochs, the mT5 model achieves a training accuracy of approximately 78% and a validation accuracy of around 74%, with decreasing training loss and stable validation loss, indicating effective learning and good generalization without significant overfitting.
      </p>
      
      <h3>Features:</h3>
      <ul className="list-unstyled">
        <li> • Summarizes Nepali news articles from URLs or pasted text using mT5.</li>
        <li> • Offers short and long summary options based on user preference.</li>
        <li> • Evaluates summaries with ROUGE metrics, comparing against Gemini AI outputs.</li>
        <li> • Displays processing time and recent summary history for user convenience.</li>
        <li> • Supports multi-dialect summarization to handle regional language variations in Nepali.</li>
        <li> • Provides key detail highlighting to ensure critical information is retained in summaries.</li>
        <li> • Allows users to adjust summary tone (e.g., formal or neutral) for different audiences.</li>
        <li> • Offers multilingual output options, translating summaries into English or other languages.</li>
        <li> • Includes a feedback system for users to rate summary quality, aiding model improvement.</li>
        <li> • Enables batch processing of multiple articles for efficient summarization of news feeds.</li>
      </ul>

      <h3>Technologies Used:</h3>
      <ul className="list-unstyled">
        <li> • React for a dynamic and responsive frontend.</li>
        <li> • mT5 for custom abstractive summarization of Nepali text.</li>
        <li> • Gemini AI for generating reference summaries.</li>
        <li> • Extractor API for news content extraction from URLs.</li>
        <li> • Python Flask for backend summarization services.</li>
        <li> • Bootstrap for modern and consistent UI styling.</li>
      </ul>

      <h3>Challenges:</h3>
      <ul className="list-unstyled">
        <li> • Limited availability of high-quality Nepali datasets for training.</li>
        <li> • Difficulty handling complex Nepali grammar, sentence structures, and regional language variations.</li>
        <li> • Occasional loss of key details in summaries, impacting coherence and accuracy.</li>
        <li> • High computational resource demands for training large NLP models.</li>
      </ul>

      <p>
        Despite these challenges, the Nepali News Summarizer represents a significant step forward in NLP for low-resource languages like Nepali, providing short, clear summaries to enhance news accessibility.
      </p>
    </div>
  );
};

export default About;