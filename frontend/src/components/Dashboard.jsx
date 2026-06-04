import { useEffect, useState } from "react";
import axios from "axios";

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [domains, setDomains] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const statsResponse = await axios.get("http://127.0.0.1:8000/dashboard/stats");
      const ticketsResponse = await axios.get("http://127.0.0.1:8000/dashboard/tickets");
      const domainsResponse = await axios.get("http://127.0.0.1:8000/dashboard/domains");
      const feedbackResponse = await axios.get("http://127.0.0.1:8000/dashboard/feedback");

      setStats(statsResponse.data);
      setTickets(ticketsResponse.data);
      setDomains(domainsResponse.data);
      setFeedback(feedbackResponse.data);
    } catch (error) {
      console.error(error);
      alert("Dashboard loading failed. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-card">
        <h2>Loading Dashboard...</h2>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Service Desk Dashboard</h2>
        <button className="refresh-btn" onClick={fetchDashboardData}>
          Refresh Dashboard
        </button>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Tickets</h3>
            <p>{stats.total_tickets}</p>
          </div>

          <div className="stat-card">
            <h3>Total Domains</h3>
            <p>{stats.total_domains}</p>
          </div>

          <div className="stat-card">
            <h3>Total Feedback</h3>
            <p>{stats.total_feedback}</p>
          </div>

          <div className="stat-card">
            <h3>Agent Responses</h3>
            <p>{stats.total_agent_responses}</p>
          </div>
        </div>
      )}

      <div className="dashboard-card">
        <h3>Recent Tickets</h3>

        {tickets.length === 0 ? (
          <p>No tickets found.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User Issue</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Domain ID</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td>{ticket.id}</td>
                    <td>{ticket.user_input}</td>
                    <td>
                      <span className={`priority ${ticket.priority?.toLowerCase()}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td>{ticket.status}</td>
                    <td>{ticket.domain_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="dashboard-card">
        <h3>Domains</h3>

        {domains.length === 0 ? (
          <p>No domains found.</p>
        ) : (
          <div className="domain-list">
            {domains.map((domain) => (
              <div className="domain-item" key={domain.id}>
                <strong>{domain.name}</strong>
                <p>{domain.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="dashboard-card">
        <h3>User Feedback</h3>

        {feedback.length === 0 ? (
          <p>No feedback found.</p>
        ) : (
          <div className="feedback-list">
            {feedback.map((item) => (
              <div className="feedback-item" key={item.id}>
                <strong>Ticket #{item.ticket_id}</strong>
                <p>Rating: {item.rating}/5</p>
                <p>{item.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;