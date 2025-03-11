import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

import Home from './Home';
import About from './About';
import Contact from './Contact';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faMoon } from '@fortawesome/free-solid-svg-icons';

const App = () => {
  const [text, setText] = useState('');
  const [referenceSummary, setReferenceSummary] = useState('');
  const [hypothesisSummary, setHypothesisSummary] = useState('');
  const [rougeScores, setRougeScores] = useState(null);
  const [selectedLength, setSelectedLength] = useState('short');
  const [url, setUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [theme, setTheme] = useState('light');
  const [history, setHistory] = useState([]);
  const [processingTime, setProcessingTime] = useState(null);
  const [remainingTime, setRemainingTime] = useState(null);
  const [averageProcessingTime, setAverageProcessingTime] = useState(0);
  const textAreaRef = useRef(null);
  const startTimeRef = useRef(null); // Track start time for accurate elapsed time

  const countWords = (str = '') => str.split(/\s+/).filter(Boolean).length;

  const handleUrlChange = (e) => {
    setUrl(e.target.value);
    setText('');
    setError('');
  };

  const clearUrl = () => {
    setUrl('');
    setError('');
  };

  const clearInput = () => {
    setText('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url && !text) {
      setError('Please enter a URL or text to summarize.');
      return;
    }
    setIsProcessing(true);
    setError('');
    setProcessingTime(null);
    startTimeRef.current = Date.now(); // Store start time
    setRemainingTime(averageProcessingTime || 5); // Initial estimate

    const requestBody = url ? { url, selectedLength } : { text, selectedLength };

    try {
      const response = await fetch('http://localhost:5000/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) throw new Error('Network response was not ok');

      const data = await response.json();
      const endTime = Date.now();
      const totalTime = (endTime - startTimeRef.current) / 1000;

      setText(data.formatted_text || text);
      setReferenceSummary(data.reference_summary || '');
      setHypothesisSummary(data.hypothesis_summary || '');
      setRougeScores(data.rouge_scores || null);
      setProcessingTime(totalTime);
      setRemainingTime(null);

      setAverageProcessingTime((prev) => 
        prev === 0 ? totalTime : (prev * 0.7 + totalTime * 0.3) // Weighted average
      );

      setHistory((prev) => [
        {
          text: data.formatted_text || text,
          referenceSummary: data.reference_summary || '',
          hypothesisSummary: data.hypothesis_summary || '',
          rougeScores: data.rouge_scores || null,
          timestamp: new Date().toLocaleString(),
          processingTime: totalTime,
        },
        ...prev.slice(0, 4),
      ]);
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to summarize. Please try again.');
      setHistory((prev) => [
        {
          text: text || url,
          referenceSummary: '',
          hypothesisSummary: '',
          rougeScores: null,
          timestamp: new Date().toLocaleString(),
          processingTime: 0,
        },
        ...prev.slice(0, 4),
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  useEffect(() => {
    const textarea = textAreaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [text]);

  // Update remaining time based on elapsed time and average
  useEffect(() => {
    if (isProcessing && remainingTime !== null && startTimeRef.current) {
      const interval = setInterval(() => {
        const elapsedTime = (Date.now() - startTimeRef.current) / 1000;
        const estimatedTotal = averageProcessingTime || 5;
        const newRemaining = Math.max(0, estimatedTotal - elapsedTime);
        setRemainingTime(newRemaining);
        if (newRemaining <= 0) clearInterval(interval); // Stop when done
      }, 100); // Update every 100ms for smoother countdown
      return () => clearInterval(interval);
    }
  }, [isProcessing, averageProcessingTime]);

  return (
    <Router>
      <div className={`app-wrapper ${theme}`}>
        <nav className="navbar navbar-expand-lg navbar-light bg-light">
          <div className="container-fluid">
            <Link className="navbar-brand" to="/">Nepali News Summarizer</Link>
            <div className="navbar-nav ms-auto">
              <li className="nav-item">
                <Link className="nav-link" to="/">Home</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/about">About</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/contact">Contact</Link>
              </li>
            </div>
            <div className="navbar-right">
              <button
                className="btn btn-outline-secondary ms-3 app-theme-btn"
                onClick={toggleTheme}
              >
                <FontAwesomeIcon icon={theme === 'light' ? faMoon : faSun} />
                <span className="ms-2">{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
              </button>
            </div>
          </div>
        </nav>

        <main className="container my-5">
          <Routes>
            <Route path="/" element={
              <>
                <section className="app-about mb-5 text-center">
                  <p>
                    <strong>"Sum It Up with MT5" </strong>
                  </p>
                </section>
                <form onSubmit={handleSubmit} className="app-form shadow-lg p-4 rounded">
                  <div className="mb-4">
                    <label htmlFor="urlInput" className="form-label fw-semibold">Enter News URL</label>
                    <div className="input-group">
                      <input
                        type="text"
                        id="urlInput"
                        className="form-control form-control-lg app-input"
                        placeholder="Paste a news article URL..."
                        value={url}
                        onChange={handleUrlChange}
                        aria-describedby="urlHelp"
                      />
                      <button type="button" className="btn btn-clear" onClick={clearUrl}>Clear</button>
                    </div>
                    <small id="urlHelp" className="form-text text-muted">Or paste text below.</small>
                  </div>
                  <div className="mb-4">
                    <label htmlFor="textInput" className="form-label fw-semibold">Paste News Article</label>
                    <div className="input-group">
                      <textarea
                        ref={textAreaRef}
                        id="textInput"
                        className="form-control app-textarea"
                        placeholder="Enter your news article here..."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        aria-describedby="textHelp"
                      />
                      <button type="button" className="btn btn-clear" onClick={clearInput}>Clear</button>
                    </div>
                    <div className="d-flex justify-content-between mt-2">
                      <small className="text-muted">Word Count: {countWords(text)}</small>
                    </div>
                  </div>
                  <div className="mb-4">
                    <label htmlFor="lengthSelect" className="form-label fw-semibold">Summary Length</label>
                    <select
                      id="lengthSelect"
                      className="form-select app-select"
                      value={selectedLength}
                      onChange={(e) => setSelectedLength(e.target.value)}
                    >
                      <option value="short">Short</option>
                      <option value="long">Long</option>
                    </select>
                  </div>
                  {error && <div className="alert alert-danger" role="alert">{error}</div>}
                  <button type="submit" className="btn app-btn btn-lg w-100" disabled={isProcessing}>
                    {isProcessing ? (
                      <>
                        <span className="spinner-grow spinner-grow-sm me-2" role="status" aria-hidden="true"></span>
                        Processing... {remainingTime !== null && `(${(remainingTime).toFixed(1)}s remaining)`}
                      </>
                    ) : (
                      'Summarize Now'
                    )}
                  </button>
                  {processingTime !== null && !isProcessing && (
                    <div className="text-center mt-2">
                      <small className="text-muted">Processing Time: {processingTime.toFixed(2)} seconds</small>
                    </div>
                  )}
                </form>
                {(referenceSummary || hypothesisSummary || rougeScores) && (
                  <section className="app-results mt-5">
                    {referenceSummary && (
                      <div className="card app-card mb-4">
                        <div className="card-body">
                          <h5 className="card-title app-card-title fw-bold">Reference Summary (Gemini)</h5>
                          <p className="card-text">{referenceSummary}</p>
                          <small className="text-muted">Word Count: {countWords(referenceSummary)}</small>
                        </div>
                      </div>
                    )}
                    {hypothesisSummary && (
                      <div className="card app-card mb-4">
                        <div className="card-body">
                          <h5 className="card-title app-card-title fw-bold">mT5 Summary</h5>
                          <p className="card-text">{hypothesisSummary}</p>
                          <small className="text-muted">Word Count: {countWords(hypothesisSummary)}</small>
                        </div>
                      </div>
                    )}
                    {rougeScores && (
                      <div className="card app-card">
                        <div className="card-body">
                          <h5 className="card-title app-card-title fw-bold">ROUGE Scores</h5>
                          <div className="table-responsive">
                            <table className="table table-striped table-hover app-table">
                              <thead>
                                <tr>
                                  <th>Metric</th>
                                  <th>Precision</th>
                                  <th>Recall</th>
                                  <th>F1 Score</th>
                                </tr>
                              </thead>
                              <tbody>
                                {['rouge1', 'rouge2', 'rougeL'].map((key) => (
                                  <tr key={key}>
                                    <td>{key.toUpperCase().replace('ROUGE', 'ROUGE-')}</td>
                                    <td>{rougeScores[key].precision.toFixed(4)}</td>
                                    <td>{rougeScores[key].recall.toFixed(4)}</td>
                                    <td>{rougeScores[key].fmeasure.toFixed(4)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                  </section>
                )}
                {history.length > 0 && (
                  <section className="app-history mt-5">
                    <h3 className="fw-bold mb-4">Recent Summaries</h3>
                    {history.map((item, index) => (
                      <div key={index} className="card app-card mb-3">
                        <div className="card-body">
                          <p className="card-text"><strong>Time:</strong> {item.timestamp}</p>
                          <p className="card-text"><strong>Input:</strong> {item.text.slice(0, 100)}...</p>
                          <p className="card-text"><strong>mT5 Summary:</strong> {item.hypothesisSummary}</p>
                          <p className="card-text">
                            <strong>Processing Time:</strong> {(item.processingTime || 0).toFixed(2)}s
                          </p>
                        </div>
                      </div>
                    ))}
                  </section>
                )}
              </>
            } />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </main>

        <footer className="app-footer text-center py-3 text-white">
          <small>© 2025 Nepali News Summarizer</small>
        </footer>
      </div>
    </Router>
  );
};

export default App;