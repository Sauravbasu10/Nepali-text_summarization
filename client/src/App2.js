import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

const App = () => {
  const [text, setText] = useState('');
  const [referenceSummary, setReferenceSummary] = useState('');
  const [hypothesisSummary, setHypothesisSummary] = useState('');
  const [rougeScores, setRougeScores] = useState(null);
  const [selectedLength, setSelectedLength] = useState('short');
  const [url, setUrl] = useState('');

  const countWords = (str = '') => {
    return str.split(/\s+/).filter(Boolean).length;
  };

  const handleUrlChange = (e) => {
    setUrl(e.target.value);
    setText('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const requestBody = url
      ? { url, selectedLength }
      : { text, selectedLength };

    try {
      const response = await fetch('http://localhost:5000/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      setText(data.formatted_text);
      setReferenceSummary(data.reference_summary);
      setHypothesisSummary(data.hypothesis_summary);
      setRougeScores(data.rouge_scores);
    } catch (error) {
      console.error('Error:', error);
      setHypothesisSummary('Error occurred while summarizing');
    }
  };

  return (
    <>
      <div className="col text-center mb-5">
        <h1 className="display-4">Nepali News Summarizer</h1>
      </div>

      <div className="container mb-4">
        <p className="text-center text-muted">
          <strong>About:</strong> Summarize Nepali news and compare mT5 summaries with Gemini references using ROUGE scores.
        </p>
      </div>

      <div className="container">
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="urlInput" className="form-label">Enter URL:</label>
            <input
              type="text"
              id="urlInput"
              className="form-control"
              placeholder="Enter URL here..."
              value={url}
              onChange={handleUrlChange}
            />
          </div>
          <div className="mb-3">
            <textarea
              className="form-control"
              placeholder="Enter News Article to summarize..."
              rows="8"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <p>Word Count: {countWords(text)}</p>
          </div>
          <div className="mb-3">
            <label htmlFor="lengthSelect" className="form-label">Select Length</label>
            <select
              id="lengthSelect"
              className="form-select"
              value={selectedLength}
              onChange={(e) => setSelectedLength(e.target.value)}
            >
              <option value="short">Short</option>
              <option value="long">Long</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary">Summarize</button>
        </form>

        {(referenceSummary || hypothesisSummary || rougeScores) && (
          <div className="mt-4">
            {referenceSummary && (
              <div className="card mb-3">
                <div className="card-body">
                  <h5 className="card-title">Reference Summary (Gemini)</h5>
                  <p className="card-text">{referenceSummary}</p>
                  <p>Word Count: {countWords(referenceSummary)}</p>
                </div>
              </div>
            )}
            {hypothesisSummary && (
              <div className="card mb-3">
                <div className="card-body">
                  <h5 className="card-title">mT5 Summary</h5>
                  <p className="card-text">{hypothesisSummary}</p>
                  <p>Word Count: {countWords(hypothesisSummary)}</p>
                </div>
              </div>
            )}
            {rougeScores && (
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">ROUGE Scores</h5>
                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th>Metric</th>
                        <th>Precision</th>
                        <th>Recall</th>
                        <th>F1 Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>ROUGE-1</td>
                        <td>{rougeScores.rouge1.precision.toFixed(4)}</td>
                        <td>{rougeScores.rouge1.recall.toFixed(4)}</td>
                        <td>{rougeScores.rouge1.fmeasure.toFixed(4)}</td>
                      </tr>
                      <tr>
                        <td>ROUGE-2</td>
                        <td>{rougeScores.rouge2.precision.toFixed(4)}</td>
                        <td>{rougeScores.rouge2.recall.toFixed(4)}</td>
                        <td>{rougeScores.rouge2.fmeasure.toFixed(4)}</td>
                      </tr>
                      <tr>
                        <td>ROUGE-L</td>
                        <td>{rougeScores.rougeL.precision.toFixed(4)}</td>
                        <td>{rougeScores.rougeL.recall.toFixed(4)}</td>
                        <td>{rougeScores.rougeL.fmeasure.toFixed(4)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default App;