import React, { useState, useEffect, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

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
  const textAreaRef = useRef(null);

  // Word count function
  const countWords = (str = '') => str.split(/\s+/).filter(Boolean).length;

  // Handle URL input
  const handleUrlChange = (e) => {
    setUrl(e.target.value);
    setText('');
    setError('');
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url && !text) {
      setError('Please enter a URL or text to summarize.');
      return;
    }
    setIsProcessing(true);
    setError('');

    const requestBody = url ? { url, selectedLength } : { text, selectedLength };

    try {
      const response = await fetch('http://localhost:5000/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) throw new Error('Network response was not ok');

      const data = await response.json();
      setText(data.formatted_text || text);
      setReferenceSummary(data.reference_summary);
      setHypothesisSummary(data.hypothesis_summary);
      setRougeScores(data.rouge_scores);
      setHistory((prev) => [
        { text: data.formatted_text || text, referenceSummary: data.reference_summary, hypothesisSummary: data.hypothesis_summary, rougeScores: data.rouge_scores, timestamp: new Date().toLocaleString() },
        ...prev.slice(0, 4),
      ]);
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to summarize. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Theme toggle
  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textAreaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [text]);

  // Clear input
  const clearInput = () => {
    setUrl('');
    setText('');
    setError('');
  };

  return (
    <div className={`app-wrapper ${theme}`}>
      <header className="app-header text-center py-4 text-white shadow-sm">
        <div className="d-flex justify-content-between align-items-center px-3">
          <h1 className="display-4 fw-bold">Nepali News Summarizer</h1>
          <button className="btn app-theme-btn" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
          </button>
        </div>
        <p className="lead mt-2">Summarize Nepali news with AI precision</p>
      </header>

      <main className="container my-5">
        <section className="app-about mb-5 text-center">
          <p>
            <strong>About:</strong> Powered by mT5 and Gemini, this tool summarizes Nepali news and evaluates results with ROUGE scores.
          </p>
        </section>

        <form onSubmit={handleSubmit} className="app-form shadow-lg p-4 rounded">
          <div className="mb-4">
            <label htmlFor="urlInput" className="form-label fw-semibold">Enter News URL</label>
            <input
              type="text"
              id="urlInput"
              className="form-control form-control-lg app-input"
              placeholder="Paste a news article URL..."
              value={url}
              onChange={handleUrlChange}
              aria-describedby="urlHelp"
            />
            <small id="urlHelp" className="form-text text-muted">Or paste text below.</small>
          </div>
          <div className="mb-4">
            <label htmlFor="textInput" className="form-label fw-semibold">Paste News Article</label>
            <textarea
              ref={textAreaRef}
              id="textInput"
              className="form-control app-textarea"
              placeholder="Enter your news article here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              aria-describedby="textHelp"
            />
            <div className="d-flex justify-content-between mt-2">
              <small className="text-muted">Word Count: {countWords(text)}</small>
              <button type="button" className="btn btn-link p-0" onClick={clearInput}>Clear</button>
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
                Processing...
              </>
            ) : (
              'Summarize Now'
            )}
          </button>
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
                </div>
              </div>
            ))}
          </section>
        )}
      </main>

      <footer className="app-footer text-center py-3 text-white">
        <small>© 2025 Nepali News Summarizer. Powered by xAI.</small>
      </footer>
    </div>
  );
};

export default App;