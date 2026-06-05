import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import API_BASE_URL from "../api";

const chartColors = [
  "#38bdf8",
  "#22c55e",
  "#a855f7",
  "#f59e0b",
  "#ef4444",
  "#14b8a6",
  "#e879f9",
];

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

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const statsResponse = await axios.get(`${API_BASE_URL}/dashboard/stats`);
      const ticketsResponse = await axios.get(`${API_BASE_URL}/dashboard/tickets`);
      const domainsResponse = await axios.get(`${API_BASE_URL}/dashboard/domains`);
      const feedbackResponse = await axios.get(`${API_BASE_URL}/dashboard/feedback`);
      const promptMemoryResponse = await axios.get(
        `${API_BASE_URL}/dashboard/prompt-memory`
      );

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

  const countByValue = (items, key, fallback = "Unknown") => {
    const counts = {};

    items.forEach((item) => {
      const value = item[key] || fallback;
      counts[value] = (counts[value] || 0) + 1;
    });

    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
    }));
  };

  const countFeedbackRatings = (items) => {
    const counts = {
      "5 Stars": 0,
      "4 Stars": 0,
      "3 Stars": 0,
      "2 Stars": 0,
      "1 Star": 0,
    };

    items.forEach((item) => {
      const rating = Number(item.rating);

      if (rating === 5) counts["5 Stars"] += 1;
      if (rating === 4) counts["4 Stars"] += 1;
      if (rating === 3) counts["3 Stars"] += 1;
      if (rating === 2) counts["2 Stars"] += 1;
      if (rating === 1) counts["1 Star"] += 1;
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .filter((item) => item.value > 0);
  };

  const priorityData = useMemo(
    () => countByValue(tickets, "priority"),
    [tickets]
  );

  const statusData = useMemo(
    () => countByValue(tickets, "status"),
    [tickets]
  );

  const domainData = useMemo(() => {
    const counts = {};

    tickets.forEach((ticket) => {
      const domain = ticket.domain_name || "Unknown";
      counts[domain] = (counts[domain] || 0) + 1;
    });

    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
    }));
  }, [tickets]);

  const feedbackRatingData = useMemo(
    () => countFeedbackRatings(feedback),
    [feedback]
  );

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
    const names = tickets.map((ticket) => ticket.domain_name).filter(Boolean);
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
          ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket
        )
      );
    } catch (error) {
      console.error(error);
      alert("Failed to update ticket status.");
    } finally {
      setUpdatingTicketId(null);
    }
  };

  const fetchTicketDetail = async (ticketId) => {
    try {
      setDetailLoading(true);

      const response = await axios.get(`${API_BASE_URL}/tickets/${ticketId}`);

      setSelectedTicket(response.data);
    } catch (error) {
      console.error(error);
      alert("Failed to load ticket details.");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeTicketDetail = () => {
    setSelectedTicket(null);
  };
  const formatDate = (dateValue) => {
  if (!dateValue) return "Not available";
  return new Date(dateValue).toLocaleString();
};

const addWrappedText = (doc, text, x, y, maxWidth, lineHeight = 7) => {
  const pageHeight = doc.internal.pageSize.getHeight();
  const lines = doc.splitTextToSize(String(text || "Not available"), maxWidth);

  lines.forEach((line) => {
    if (y > pageHeight - 20) {
      doc.addPage();
      y = 20;
    }

    doc.text(line, x, y);
    y += lineHeight;
  });

  return y;
};

const addSectionTitle = (doc, title, y) => {
  const pageHeight = doc.internal.pageSize.getHeight();

  if (y > pageHeight - 25) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(14);
  doc.setTextColor(37, 99, 235);
  doc.setFont(undefined, "bold");
  doc.text(title, 14, y);

  doc.setDrawColor(37, 99, 235);
  doc.line(14, y + 2, 196, y + 2);

  doc.setTextColor(30, 41, 59);
  doc.setFont(undefined, "normal");

  return y + 10;
};

const downloadTicketPdf = (ticket) => {
  if (!ticket) {
    alert("No ticket selected.");
    return;
  }

  const doc = new jsPDF("p", "mm", "a4");

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Header
  doc.setFillColor(7, 17, 31);
  doc.rect(0, 0, pageWidth, 34, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont(undefined, "bold");
  doc.text("DeskMindAI Ticket Report", 14, 18);

  doc.setFontSize(10);
  doc.setFont(undefined, "normal");
  doc.text(`Generated: ${formatDate(new Date())}`, 14, 27);

  // Summary table
  autoTable(doc, {
    startY: 42,
    head: [["Field", "Value"]],
    body: [
      ["Ticket ID", `#${ticket.id}`],
      ["Domain", ticket.domain_name || "Unknown"],
      ["Priority", ticket.priority || "Not available"],
      ["Status", ticket.status || "Not available"],
      ["Created At", formatDate(ticket.created_at)],
    ],
    theme: "grid",
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    styles: {
      fontSize: 10,
      cellPadding: 4,
    },
    columnStyles: {
      0: {
        fontStyle: "bold",
        cellWidth: 45,
      },
      1: {
        cellWidth: 130,
      },
    },
    margin: {
      left: 14,
      right: 14,
    },
  });

  let y = doc.lastAutoTable.finalY + 14;

  // User Issue
  y = addSectionTitle(doc, "User Issue", y);
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  y = addWrappedText(doc, ticket.user_input, 14, y, 180, 7);
  y += 8;

  // Agent Responses
  y = addSectionTitle(doc, "Agent Responses", y);

  if (!ticket.agent_responses || ticket.agent_responses.length === 0) {
    doc.setFontSize(11);
    y = addWrappedText(doc, "No agent responses found.", 14, y, 180, 7);
    y += 8;
  } else {
    ticket.agent_responses.forEach((response, index) => {
      if (y > pageHeight - 35) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.setFont(undefined, "bold");
      doc.text(
        `${index + 1}. ${response.agent_name || "Agent Response"}`,
        14,
        y
      );

      y += 8;

      doc.setFont(undefined, "normal");
      doc.setTextColor(30, 41, 59);
      y = addWrappedText(doc, response.response_text, 14, y, 180, 6.5);
      y += 8;
    });
  }

  // Feedback
  y = addSectionTitle(doc, "Feedback", y);

  if (!ticket.feedback || ticket.feedback.length === 0) {
    doc.setFontSize(11);
    y = addWrappedText(
      doc,
      "No feedback submitted for this ticket.",
      14,
      y,
      180,
      7
    );
  } else {
    ticket.feedback.forEach((item, index) => {
      if (y > pageHeight - 35) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(11);
      doc.setFont(undefined, "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(`${index + 1}. Rating: ${item.rating}/5`, 14, y);

      y += 8;

      doc.setFont(undefined, "normal");
      doc.setTextColor(30, 41, 59);
      y = addWrappedText(doc, item.comment, 14, y, 180, 6.5);
      y += 8;
    });
  }

  // Footer page numbers
  const pageCount = doc.internal.getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);

    doc.text("DeskMindAI - Enterprise Multi-Agent Service Desk Chatbot", 14, 288);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 35, 288);
  }

  doc.save(`DeskMindAI_Ticket_${ticket.id}_Report.pdf`);
};
  const resetFilters = () => {
    setSearchText("");
    setPriorityFilter("All");
    setStatusFilter("All");
    setDomainFilter("All");
  };

  const renderPieChart = (data) => {
    if (!data || data.length === 0) {
      return <p className="muted-text">No chart data available yet.</p>;
    }

    return (
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            outerRadius={90}
            innerRadius={48}
            paddingAngle={4}
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.name}
                fill={chartColors[index % chartColors.length]}
              />
            ))}
          </Pie>

          <Tooltip
            contentStyle={{
              backgroundColor: "#0b1829",
              border: "1px solid rgba(148, 163, 184, 0.25)",
              borderRadius: "12px",
              color: "#ffffff",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  const renderBarChart = (data) => {
    if (!data || data.length === 0) {
      return <p className="muted-text">No chart data available yet.</p>;
    }

    return (
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(148, 163, 184, 0.15)"
          />
          <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12 }} />
          <YAxis stroke="#94a3b8" allowDecimals={false} />

          <Tooltip
            contentStyle={{
              backgroundColor: "#0b1829",
              border: "1px solid rgba(148, 163, 184, 0.25)",
              borderRadius: "12px",
              color: "#ffffff",
            }}
          />

          <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#38bdf8" />
        </BarChart>
      </ResponsiveContainer>
    );
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

          <p>Monitor tickets, analytics, agent performance, and learning memory.</p>
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

      {!focus && (
        <section className="analytics-grid">
          <div className="dark-card chart-card">
            <div className="chart-title-row">
              <h3>Tickets by Priority</h3>
              <span>Priority Analysis</span>
            </div>
            {renderPieChart(priorityData)}
          </div>

          <div className="dark-card chart-card">
            <div className="chart-title-row">
              <h3>Tickets by Status</h3>
              <span>Status Flow</span>
            </div>
            {renderPieChart(statusData)}
          </div>

          <div className="dark-card chart-card">
            <div className="chart-title-row">
              <h3>Tickets by Domain</h3>
              <span>Domain Distribution</span>
            </div>
            {renderBarChart(domainData)}
          </div>

          <div className="dark-card chart-card">
            <div className="chart-title-row">
              <h3>Feedback Ratings</h3>
              <span>User Satisfaction</span>
            </div>
            {renderBarChart(feedbackRatingData)}
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
                    <th>Details</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTickets.map((ticket) => (
                    <tr key={ticket.id}>
                      <td>#{ticket.id}</td>
                      <td>{ticket.user_input}</td>
                      <td>{ticket.domain_name}</td>

                      <td>
                        <span
                          className={`priority-pill ${ticket.priority?.toLowerCase()}`}
                        >
                          {ticket.priority}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`status-pill ${ticket.status
                            ?.toLowerCase()
                            .replace(" ", "-")}`}
                        >
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

                      <td>
                        <button
                          className="view-detail-btn"
                          onClick={() => fetchTicketDetail(ticket.id)}
                        >
                          View Details
                        </button>
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

      {selectedTicket && (
        <div className="modal-overlay">
          <div className="ticket-modal">
            <div className="modal-header">
              <div>
                <h2>Ticket #{selectedTicket.id}</h2>
                <p>{selectedTicket.domain_name}</p>
              </div>

              <div className="modal-actions">
  <button
    className="download-pdf-btn"
    onClick={() => downloadTicketPdf(selectedTicket)}
  >
    Download PDF
  </button>

  <button className="modal-close-btn" onClick={closeTicketDetail}>
    ×
  </button>
</div>
            </div>

            {detailLoading ? (
              <p className="muted-text">Loading ticket details...</p>
            ) : (
              <>
                <div className="ticket-detail-grid">
                  <div>
                    <span>Priority</span>
                    <strong
                      className={`priority-pill ${selectedTicket.priority?.toLowerCase()}`}
                    >
                      {selectedTicket.priority}
                    </strong>
                  </div>

                  <div>
                    <span>Status</span>
                    <strong
                      className={`status-pill ${selectedTicket.status
                        ?.toLowerCase()
                        .replace(" ", "-")}`}
                    >
                      {selectedTicket.status}
                    </strong>
                  </div>

                  <div>
                    <span>Created At</span>
                    <strong>
                      {selectedTicket.created_at
                        ? new Date(selectedTicket.created_at).toLocaleString()
                        : "Not available"}
                    </strong>
                  </div>
                </div>

                <div className="ticket-detail-section">
                  <h3>User Issue</h3>
                  <p>{selectedTicket.user_input}</p>
                </div>

                <div className="ticket-detail-section">
                  <h3>Agent Responses</h3>

                  {selectedTicket.agent_responses?.length === 0 ? (
                    <p className="muted-text">No agent responses found.</p>
                  ) : (
                    selectedTicket.agent_responses?.map((response) => (
                      <div className="response-block" key={response.id}>
                        <strong>{response.agent_name}</strong>
                        <pre>{response.response_text}</pre>
                      </div>
                    ))
                  )}
                </div>

                <div className="ticket-detail-section">
                  <h3>Feedback</h3>

                  {selectedTicket.feedback?.length === 0 ? (
                    <p className="muted-text">
                      No feedback submitted for this ticket.
                    </p>
                  ) : (
                    selectedTicket.feedback?.map((item) => (
                      <div className="response-block" key={item.id}>
                        <strong>Rating: {item.rating}/5</strong>
                        <p>{item.comment}</p>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;