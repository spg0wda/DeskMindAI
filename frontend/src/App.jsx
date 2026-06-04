import { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [userInput, setUserInput] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleProcessTicket = async () => {
    if (!userInput.trim()) {
      alert("Please enter a service desk issue");
      return;
    }

    try {
      setLoading(true);
      setResult(null);

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

  return (
    <div className="app-container">
      <div className="hero-section">
        <h1>DeskMindAI</h1>
        <p>Enterprise Multi-Agent Service Desk Chatbot</p>
        <span>Powered by LangGraph Supervisor Architecture</span>
      </div>

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
        </div>
      )}
    </div>
  );
}

export default App;