import { useState } from "react";
import axios from "axios";
import Dashboard from "./components/Dashboard";
import Login from "./components/Login";
import API_BASE_URL from "./api";
import "./App.css";

import {
  Bot,
  LayoutDashboard,
  Ticket,
  Globe,
  MessageCircle,
  Brain,
  Settings,
  Plus,
  Send,
} from "lucide-react";

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("deskmind_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [page, setPage] = useState("chatbot");
  const [userInput, setUserInput] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const [rating, setRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");

  const menuItems = [
    { id: "chatbot", label: "Chatbot", icon: Bot },
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "tickets", label: "Tickets", icon: Ticket },
    { id: "domains", label: "Domains", icon: Globe },
    { id: "feedback", label: "Feedback", icon: MessageCircle },
    { id: "memory", label: "Prompt Memory", icon: Brain },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const handleLogout = () => {
    localStorage.removeItem("deskmind_token");
    localStorage.removeItem("deskmind_user");
    setUser(null);
    setPage("chatbot");
    setUserInput("");
    setResult(null);
    setFeedbackComment("");
    setFeedbackMessage("");
    setRating(5);
  };

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
        `${API_BASE_URL}/agent/process-ai`,
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
        `${API_BASE_URL}/feedback/learn`,
        null,
        {
          params: {
            ticket_id: result.ticket_id,
            rating,
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

  const resetTicket = () => {
    setUserInput("");
    setResult(null);
    setFeedbackComment("");
    setFeedbackMessage("");
    setRating(5);
    setPage("chatbot");
  };

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <div className="dark-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <Brain size={22} />
          </div>
          <h1>DeskMindAI</h1>
        </div>

        <nav className="side-nav">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={page === item.id ? "nav-item active" : "nav-item"}
              onClick={() => setPage(item.id)}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="user-card">
          <div className="avatar">A</div>

          <div>
            <strong>Admin User</strong>
            <p>{user.email}</p>

            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>

          <span className="online-dot"></span>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div>
            <h2>Welcome back, Admin 👋</h2>
            <p>
              Monitor tickets, AI responses, feedback, and prompt memory in one
              place.
            </p>
          </div>

          <button className="new-ticket-btn" onClick={resetTicket}>
            <Plus size={16} />
            New Ticket
          </button>
        </header>

        {page === "chatbot" && (
          <>
            <section className="chat-grid">
              <div className="dark-card input-card">
                <div className="card-title-row">
                  <h3>Raise a Service Desk Issue</h3>
                </div>

                <textarea
                  placeholder="Describe your issue in detail..."
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                />

                <button
                  className="primary-btn"
                  onClick={handleProcessTicket}
                  disabled={loading}
                >
                  {loading ? "Processing with AI Agents..." : "Process Ticket"}
                  <Send size={16} />
                </button>
              </div>

              <div className="dark-card response-card">
                <div className="card-title-row">
                  <h3>AI Agent Response</h3>
                  <span className="ai-badge">AI Powered</span>
                </div>

                {!result ? (
                  <div className="empty-response">
                    <p>Submit a ticket to see AI analysis.</p>
                  </div>
                ) : (
                  <div className="mini-output">
                    <div>
                      <span>Domain</span>
                      <strong>{result.domain}</strong>
                    </div>

                    <div>
                      <span>Priority</span>
                      <strong
                        className={`priority-pill ${result.priority?.toLowerCase()}`}
                      >
                        {result.priority}
                      </strong>
                    </div>

                    <div>
                      <span>Questions</span>
                      <strong>{result.questions?.length || 0}</strong>
                    </div>

                    <div>
                      <span>Steps</span>
                      <strong>{result.resolution_steps?.length || 0}</strong>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className="overview-card">
              <h3>Dashboard Overview</h3>

              <div className="overview-grid">
                <div className="metric-card blue">
                  <strong>{result ? result.ticket_id : "—"}</strong>
                  <span>Current Ticket</span>
                </div>

                <div className="metric-card green">
                  <strong>{result ? result.domain : "—"}</strong>
                  <span>Detected Domain</span>
                </div>

                <div className="metric-card pink">
                  <strong>{result ? result.priority : "—"}</strong>
                  <span>Priority Level</span>
                </div>

                <div className="metric-card yellow">
                  <strong>{result?.ai_used ? "Yes" : "No"}</strong>
                  <span>Groq AI Used</span>
                </div>

                <div className="metric-card cyan">
                  <strong>{result ? "Active" : "Waiting"}</strong>
                  <span>Agent Status</span>
                </div>
              </div>
            </section>

            {result && (
              <section className="details-grid">
                <div className="dark-card">
                  <h3>Clarifying Questions</h3>
                  <ul className="dark-list">
                    {result.questions.map((question, index) => (
                      <li key={index}>{question}</li>
                    ))}
                  </ul>
                </div>

                <div className="dark-card">
                  <h3>Resolution Steps</h3>
                  <ol className="dark-list">
                    {result.resolution_steps.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ol>
                </div>

                <div className="dark-card full-width">
                  <h3>AI Enhancement Summary</h3>
                  <p className="muted-text">
                    {result.ai_summary || "AI summary not available."}
                  </p>

                  <span className="status-chip">
                    {result.ai_used
                      ? "Groq AI was used"
                      : "Rule-based fallback was used"}
                  </span>
                </div>

                <div className="dark-card full-width learning-card">
                  <h3>Learning Loop Feedback</h3>
                  <p>
                    Your feedback will be saved into domain-based prompt memory
                    for future improvements.
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
                    className="feedback-area"
                    placeholder="Example: Add more VPN troubleshooting steps before escalation."
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                  />

                  <button
                    className="primary-btn"
                    onClick={handleSubmitFeedback}
                    disabled={feedbackLoading}
                  >
                    {feedbackLoading
                      ? "Saving Feedback..."
                      : "Submit Feedback to Learning Loop"}
                    <Send size={16} />
                  </button>

                  {feedbackMessage && (
                    <div className="success-message">{feedbackMessage}</div>
                  )}
                </div>
              </section>
            )}
          </>
        )}

        {page === "dashboard" && <Dashboard />}

        {["tickets", "domains", "feedback", "memory", "settings"].includes(
          page
        ) && <Dashboard focus={page} />}
      </main>
    </div>
  );
}

export default App;