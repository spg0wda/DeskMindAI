import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import API_BASE_URL from "../api";

function Dashboard({ focus }) {
  const [stats, setStats] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [domains, setDomains] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [promptMemory, setPromptMemory] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchText, setSearchText] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [domainFilter, setDomainFilter] = useState("All");
  const [updatingTicketId, setUpdatingTicketId] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const statsResponse = await axios.get(`${API_BASE_URL}/dashboard/stats`);
      const ticketsResponse = await axios.get(`${API_BASE_URL}/dashboard/tickets`);
      const domainsResponse = await axios.get(`${API_BASE_URL}/dashboard/domains`);
      const feedbackResponse = await axios.get(`${API_BASE_URL}/dashboard/feedback`);
      const promptMemoryResponse = await axios.get(`${API_BASE_URL}/dashboard/prompt-memory`);

      setStats(statsResponse.data);
      setTickets(ticketsResponse.data);
      setDomains(domainsResponse.data);
      setFeedback(feedbackResponse.data);
      setPromptMemory(promptMemoryResponse.data);
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

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const issue = ticket.user_input?.toLowerCase() || "";
      const search = searchText.toLowerCase();

      const matchesSearch = issue.includes(search);
      const matchesPriority =
        priorityFilter === "All" || ticket.priority === priorityFilter;
      const matchesStatus =
        statusFilter === "All" || ticket.status === statusFilter;
      const matchesDomain =
        domainFilter === "All" || ticket.domain_name === domainFilter;

      return matchesSearch && matchesPriority && matchesStatus && matchesDomain;
    });
  }, [tickets, searchText, priorityFilter, statusFilter, domainFilter]);

  const uniqueDomains = useMemo(() => {
    const names = tickets
      .map((ticket) => ticket.domain_name)
      .filter(Boolean);

    return ["All", ...new Set(names)];
  }, [tickets]);

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      setUpdatingTicketId(ticketId);

      await axios.put(`${API_BASE_URL}/tickets/${ticketId}/status`, null, {
        params: {
          status: newStatus,
        },
      });

      setTickets((prevTickets) =>
        prevTickets.map((ticket) =>
          ticket.id === ticketId
            ? { ...ticket, status: newStatus }
            : ticket
        )
      );
    } catch (error) {
      console.error(error);
      alert("Failed to update ticket status.");
    } finally {
      setUpdatingTicketId(null);
    }
  };

  const resetFilters = () => {
    setSearchText("");
    setPriorityFilter("All");
    setStatusFilter("All");
    setDomainFilter("All");
  };

  if (loading) {
    return (
      <div className="dark-card">
        <h3>Loading Dashboard...</h3>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-heading">
        <div>
          <h2>
            {focus === "tickets"
              ? "Tickets"
              : focus === "domains"
              ? "Domains"
              : focus === "feedback"
              ? "Feedback"
              : focus === "memory"
              ? "Prompt Memory"
              : focus === "settings"
              ? "Settings"
              : "Dashboard Overview"}
          </h2>
          <p>Monitor tickets, update status, filter issues and track learning memory.</p>
        </div>

        <button className="new-ticket-btn" onClick={fetchDashboardData}>
          Refresh
        </button>
      </div>

      {!focus && stats && (
        <section className="overview-card">
          <h3>Dashboard Overview</h3>

          <div className="overview-grid">
            <div className="metric-card blue">
              <strong>{stats.total_tickets}</strong>
              <span>Total Tickets</span>
            </div>

            <div className="metric-card green">
              <strong>{stats.total_domains}</strong>
              <span>Domains</span>
            </div>

            <div className="metric-card pink">
              <strong>{stats.total_feedback}</strong>
              <span>Feedback</span>
            </div>

            <div className="metric-card yellow">
              <strong>{stats.total_agent_responses}</strong>
              <span>Agent Responses</span>
            </div>

            <div className="metric-card cyan">
              <strong>{stats.total_prompt_memory}</strong>
              <span>Prompt Memory</span>
            </div>
          </div>
        </section>
      )}

      {(!focus || focus === "tickets") && (
        <section className="dark-card table-card">
          <div className="ticket-header-row">
            <div>
              <h3>Recent Tickets</h3>
              <p className="muted-text">
                Showing {filteredTickets.length} of {tickets.length} tickets
              </p>
            </div>

            <button className="clear-filter-btn" onClick={resetFilters}>
              Clear Filters
            </button>
          </div>

          <div className="filter-grid">
            <input
              type="text"
              placeholder="Search by issue..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="All">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>

            <select
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
            >
              {uniqueDomains.map((domain) => (
                <option key={domain} value={domain}>
                  {domain === "All" ? "All Domains" : domain}
                </option>
              ))}
            </select>
          </div>

          {filteredTickets.length === 0 ? (
            <p className="muted-text">No tickets match your filters.</p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>User Issue</th>
                    <th>Domain</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Update Status</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTickets.map((ticket) => (
                    <tr key={ticket.id}>
                      <td>#{ticket.id}</td>
                      <td>{ticket.user_input}</td>
                      <td>{ticket.domain_name}</td>
                      <td>
                        <span className={`priority-pill ${ticket.priority?.toLowerCase()}`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td>
                        <span className={`status-pill ${ticket.status?.toLowerCase().replace(" ", "-")}`}>
                          {ticket.status}
                        </span>
                      </td>
                      <td>
                        <select
                          className="status-select"
                          value={ticket.status}
                          disabled={updatingTicketId === ticket.id}
                          onChange={(e) =>
                            handleStatusChange(ticket.id, e.target.value)
                          }
                        >
                          <option value="Open">Open</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                          <option value="Closed">Closed</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {(!focus || focus === "domains") && (
        <section className="dark-card">
          <h3>Domains</h3>

          <div className="item-grid">
            {domains.length === 0 ? (
              <p className="muted-text">No domains found.</p>
            ) : (
              domains.map((domain) => (
                <div className="dark-item" key={domain.id}>
                  <strong>{domain.name}</strong>
                  <p>{domain.description}</p>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {(!focus || focus === "feedback") && (
        <section className="dark-card">
          <h3>User Feedback</h3>

          <div className="item-grid">
            {feedback.length === 0 ? (
              <p className="muted-text">No feedback found.</p>
            ) : (
              feedback.map((item) => (
                <div className="dark-item purple-left" key={item.id}>
                  <strong>Ticket #{item.ticket_id}</strong>
                  <p>Rating: {item.rating}/5</p>
                  <p>{item.comment}</p>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {(!focus || focus === "memory") && (
        <section className="dark-card">
          <h3>Prompt Memory Logs</h3>

          <div className="item-grid">
            {promptMemory.length === 0 ? (
              <p className="muted-text">
                No prompt memory found. Submit feedback to create learning memory.
              </p>
            ) : (
              promptMemory.map((memory) => (
                <div className="dark-item green-left" key={memory.id}>
                  <strong>Memory #{memory.id}</strong>
                  <p>Domain ID: {memory.domain_id}</p>
                  <p>Version: {memory.version}</p>
                  <p>Status: {memory.is_active ? "Active" : "Inactive"}</p>
                  <pre>{memory.prompt_text}</pre>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {focus === "settings" && (
        <section className="dark-card">
          <h3>Settings</h3>
          <p className="muted-text">
            Deployment, model, and database configuration are managed using
            environment variables.
          </p>
        </section>
      )}
    </div>
  );
}

export default Dashboard;