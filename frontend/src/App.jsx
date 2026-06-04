import { useState } from "react";
import axios from "axios";
import Dashboard from "./components/Dashboard";
import "./App.css";

function App() {
  const [page, setPage] = useState("chatbot");
  const [userInput, setUserInput] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const [rating, setRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");

  const handleProcessTicket = async () => {
    if (!userInput.trim()) {
      alert("Please enter a service desk issue");
      return;
    }

    try {
      setLoading(true);
      setResult(null);
      setFeedbackMessage("");
      setFeedbackComment("");
      setRating(5);

      const response = await axios.post(
        "http://127.0.0.1:8000/agent/process",
        null,
        {
          params: {
            user_input: userInput,
          },
        }
      );

      setResult(response.data);
    } catch (error) {
      console.error(error);
      alert("Backend error. Make sure FastAPI server is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!result?.ticket_id) {
      alert("No ticket found for feedback.");
      return;
    }

    if (!feedbackComment.trim()) {
      alert("Please enter feedback comment.");
      return;
    }

    try {
      setFeedbackLoading(true);
      setFeedbackMessage("");

      const response = await axios.post(
        "http://127.0.0.1:8000/feedback/learn",
        null,
        {
          params: {
            ticket_id: result.ticket_id,
            rating: rating,
            comment: feedbackComment,
          },
        }
      );

      setFeedbackMessage(response.data.message);
      setFeedbackComment("");
      setRating(5);
    } catch (error) {
      console.error(error);
      alert("Feedback saving failed. Make sure backend is running.");
    } finally {
      setFeedbackLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="hero-section">
        <h1>DeskMindAI</h1>
        <p>Enterprise Multi-Agent Service Desk Chatbot</p>
        <span>Powered by LangGraph Supervisor Architecture</span>
      </div>

      <div className="nav-tabs">
        <button
          className={page === "chatbot" ? "active-tab" : ""}
          onClick={() => setPage("chatbot")}
        >
          Chatbot
        </button>

        <button
          className={page === "dashboard" ? "active-tab" : ""}
          onClick={() => setPage("dashboard")}
        >
          Dashboard
        </button>
      </div>

      {page === "chatbot" && (
        <>
          <div className="chat-card">
            <h2>Raise a Service Desk Issue</h2>

            <textarea
              placeholder="Example: My laptop VPN is not working"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
            />

            <button onClick={handleProcessTicket} disabled={loading}>
              {loading ? "Processing with Agents..." : "Process Ticket"}
            </button>
          </div>

          {result && (
            <div className="result-card">
              <h2>Agent Output</h2>

              <div className="info-grid">
                <div>
                  <strong>Ticket ID</strong>
                  <p>{result.ticket_id}</p>
                </div>

                <div>
                  <strong>Domain</strong>
                  <p>{result.domain}</p>
                </div>

                <div>
                  <strong>Priority</strong>
                  <p>{result.priority}</p>
                </div>
              </div>

              <div className="section">
                <h3>Clarifying Questions</h3>
                <ul>
                  {result.questions.map((question, index) => (
                    <li key={index}>{question}</li>
                  ))}
                </ul>
              </div>

              <div className="section">
                <h3>Resolution Steps</h3>
                <ol>
                  {result.resolution_steps.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              </div>

              <div className="learning-note">
                <h3>Learning Note</h3>
                <p>{result.learning_note}</p>
              </div>

              <div className="feedback-box">
                <h3>Improve This Agent Response</h3>
                <p>
                  Your feedback will be saved and used as prompt memory for
                  future similar issues.
                </p>

                <label>Rating</label>
                <select
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                >
                  <option value={5}>5 - Excellent</option>
                  <option value={4}>4 - Good</option>
                  <option value={3}>3 - Average</option>
                  <option value={2}>2 - Poor</option>
                  <option value={1}>1 - Very Poor</option>
                </select>

                <label>Feedback Comment</label>
                <textarea
                  className="feedback-textarea"
                  placeholder="Example: Add more VPN troubleshooting steps before escalation."
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                />

                <button onClick={handleSubmitFeedback} disabled={feedbackLoading}>
                  {feedbackLoading
                    ? "Saving Feedback..."
                    : "Submit Feedback to Learning Loop"}
                </button>

                {feedbackMessage && (
                  <div className="success-message">
                    {feedbackMessage}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {page === "dashboard" && <Dashboard />}
    </div>
  );
}

export default App;