import React, { useState } from 'react';
import './App.css'; // Make sure to import your CSS file

const Contact = () => {
  const [feedback, setFeedback] = useState('');
  const [email, setEmail] = useState('');
  const [messageSent, setMessageSent] = useState(false);

  const handleFeedbackChange = (e) => {
    setFeedback(e.target.value);
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handleSubmitFeedback = (e) => {
    e.preventDefault();
    if (feedback && email) {
      setMessageSent(true);
      setFeedback('');
      setEmail('');
    }
  };

  return (
    <div className="contact-container">
      <h2>Contact Us</h2>
      <p>If you have any questions, need further assistance, or would like to provide feedback, feel free to reach out.</p>

      <h3>Project Members:</h3>
      <div className="project-members">
        <div className="member-card">
          <img src="\praful.jpg" alt="Praful Man Thaku" className="member-image" />
          <div className="member-info">
            <h4>Praful Man Thaku</h4>
            <p>Frontend Developer</p>
          </div>
        </div>
        <div className="member-card">
          <img src="\rocky.jpg" alt="Rockey Shrestha" className="member-image" />
          <div className="member-info">
            <h4>Rockey Shrestha</h4>
            <p>Backend Developer</p>
          </div>
        </div>
        <div className="member-card">
          <img src="\saurav.jpg" alt="Saurav Basukala" className="member-image" />
          <div className="member-info">
            <h4>Saurav Basukala</h4>
            <p>AI Researcher</p>
          </div>
        </div>
        <div className="member-card">
          <img src="\sohan.jpg" alt="Sohan Basnet" className="member-image" />
          <div className="member-info">
            <h4>Sohan Basnet</h4>
            <p>Project Manager</p>
          </div>
        </div>
      </div>

      <h4>Contact Information:</h4>
      <ul>
        <li><strong>Email:</strong><a href="mailto:praful.thaku@gmail.com" >praful.thaku@gmail.com</a>, <a href="mailto:basukalas11@gmail.com" >basukalas11@gmail.com</a>, <a href="mailto:rockeyshrestha4@gmail.com" >rockeyshrestha4@gmail.com</a>, <a href="mailto:sohanb78922@gmail.com@gmail.com">sohanb78922@gmail.com</a> </li>
        <li><strong>Phone:</strong> +977 123 456 789</li>
        <li><strong>GitHub:</strong> <a href="https://github.com/Sauravbasu10/Nepali-text_summarization" target="_blank" rel="noopener noreferrer">https://github.com/Sauravbasu10/Nepali-text_summarization</a></li>
      </ul>

      <h4>We Value Your Feedback</h4>
      <p>Your feedback is essential to improve our services. Please let us know your thoughts.</p>

      <form onSubmit={handleSubmitFeedback} className="feedback-form shadow-lg p-4 rounded">
        <div className="mb-4">
          <label htmlFor="emailInput" className="form-label fw-semibold">Your Email Address</label>
          <input
            type="email"
            id="emailInput"
            className="form-control"
            placeholder="Your email address"
            value={email}
            onChange={handleEmailChange}
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="feedbackInput" className="form-label fw-semibold">Your Feedback</label>
          <textarea
            id="feedbackInput"
            className="form-control"
            placeholder="We'd love to hear your thoughts!"
            value={feedback}
            onChange={handleFeedbackChange}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary">
          Submit Feedback
        </button>
      </form>

      {messageSent && (
        <div className="alert alert-success mt-3" role="alert">
          Thank you for your feedback! We'll get back to you soon.
        </div>
      )}
    </div>
  );
};

export default Contact;
