# DeskMindAI

## Enterprise Multi-Agent Service Desk Chatbot using LangGraph Supervisor Architecture

DeskMindAI is an AI-powered enterprise service desk chatbot that uses a multi-agent architecture to classify user issues, route them to specialized agents, generate resolution steps, manage tickets, collect feedback, and improve future responses using prompt memory.

The system is designed for enterprise helpdesk scenarios where users may raise issues related to VPN, login, hardware, software, HR, finance, and general IT support.

---

## Project Overview

Traditional chatbots usually use one general assistant to answer all questions. DeskMindAI improves this by using multiple specialized agents. A supervisor-style routing system decides which agent should handle the user query. The system also remembers the current active agent, so follow-up questions can continue directly with the same agent instead of always going back to the supervisor.

If the user changes the topic, the current agent can redirect the conversation to another suitable agent.

Example:

```text
User: My VPN is not working
Supervisor routes to Network Agent

User: It still does not connect
Continues directly with Network Agent

User: My salary reimbursement is delayed
Network Agent redirects to Finance Agent
```

---

## Key Features

* Multi-agent service desk chatbot
* Supervisor-based routing architecture
* Agent memory and direct routing
* Agent-to-agent redirection
* Groq AI integration
* MySQL database storage
* React admin dashboard
* Streamlit multi-agent demo UI
* Voice-to-voice interaction
* Ticket creation and management
* Ticket status update
* Search and filter dashboard
* Ticket detail view
* Analytics charts
* PDF ticket report export
* Feedback learning loop
* Prompt memory storage
* Admin login page
* GitHub version control

---

## Specialized Agents

DeskMindAI currently supports the following agents:

| Agent            | Responsibility                                              |
| ---------------- | ----------------------------------------------------------- |
| Network Agent    | VPN, Wi-Fi, internet, router and network issues             |
| Account Agent    | Login, password, access and authentication issues           |
| Finance Agent    | Salary, payroll, reimbursement, invoice and payment issues  |
| HR Agent         | Leave, attendance, onboarding and employee record issues    |
| Hardware Agent   | Laptop, keyboard, mouse, printer, screen and device issues  |
| Software Agent   | Application, installation, update and software crash issues |
| General IT Agent | General service desk issues                                 |

---

## System Architecture

```text
User
 ↓
React Frontend / Streamlit UI
 ↓
FastAPI Backend
 ↓
Supervisor Router / Agent Memory Router
 ↓
Specialized Agents
 ↓
Groq AI
 ↓
MySQL Database
 ↓
Dashboard / Analytics / Prompt Memory / PDF Reports
```

---

## Tech Stack

| Layer           | Technology                              |
| --------------- | --------------------------------------- |
| Frontend        | React + Vite                            |
| Backend         | FastAPI                                 |
| Database        | MySQL                                   |
| AI Workflow     | LangGraph-style Supervisor Architecture |
| LLM             | Groq AI                                 |
| Voice STT/TTS   | Groq Speech-to-Text and Text-to-Speech  |
| Demo UI         | Streamlit                               |
| Charts          | Recharts                                |
| PDF Export      | jsPDF                                   |
| Version Control | Git + GitHub                            |

---

## Main Modules

### 1. React Admin Dashboard

The React dashboard provides:

* Admin login
* Ticket creation
* AI-generated response
* Feedback form
* Dashboard analytics
* Ticket status update
* Search and filter
* Ticket detail modal
* PDF report download
* Prompt memory logs

### 2. FastAPI Backend

The backend handles:

* API routes
* Agent workflow
* Ticket storage
* Feedback storage
* Prompt memory
* Dashboard data
* Login validation
* Agent memory routing

### 3. MySQL Database

The database stores:

* Users
* Domains
* Tickets
* Agent responses
* Feedback
* Prompt memory

### 4. Streamlit Multi-Agent Demo

The Streamlit UI demonstrates:

* Active agent memory
* Direct routing
* Agent-to-agent redirection
* Voice input
* Speech-to-text
* Bot voice response

---

## How to Run Locally

### 1. Clone the Repository

```bash
git clone https://github.com/spg0wda/DeskMindAI.git
cd DeskMindAI
```

---

### 2. Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file inside the `backend` folder:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=deskmindai_db

GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile

ADMIN_EMAIL=admin@deskmind.ai
ADMIN_PASSWORD=admin123
```

Run the backend:

```bash
python -m uvicorn main:app --reload
```

Backend URL:

```text
http://127.0.0.1:8000
```

Swagger API Docs:

```text
http://127.0.0.1:8000/docs
```

---

### 3. Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

Demo login:

```text
Email: admin@deskmind.ai
Password: admin123
```

---

### 4. Streamlit Demo Setup

Open another terminal from project root:

```bash
backend\venv\Scripts\python.exe -m streamlit run streamlit_app.py
```

Streamlit URL:

```text
http://localhost:8501
```

---

## Example Test Inputs

```text
My VPN is not working
```

```text
I forgot my password and cannot login
```

```text
My salary reimbursement is delayed
```

```text
My laptop screen is flickering
```

```text
I want to apply leave for tomorrow
```

---

## Agent Memory Example

```text
User: My VPN is not working
System: Supervisor routes to Network Agent

User: It still does not connect
System: Skipping supervisor. Continuing with Network Agent

User: My salary reimbursement is delayed
System: Network Agent redirects to Finance Agent
```

---

## Screenshots

Add your project screenshots here:

```text
screenshots/login-page.png
screenshots/dashboard.png
screenshots/ticket-detail.png
screenshots/streamlit-agent-memory.png
screenshots/voice-demo.png
```

---

## Future Enhancements

* Real JWT authentication
* Role-based access control
* Email notification integration
* Cloud deployment
* Vector database for long-term memory
* More advanced LangGraph checkpoint memory
* Real-time voice conversation
* SLA tracking and escalation rules
* Team assignment for tickets
* Notification system

---

## Project Status

DeskMindAI is currently under active development and includes a working backend, frontend dashboard, database integration, multi-agent routing, agent memory, Streamlit demo, voice interaction, analytics, and PDF report generation.

---

## Author

**Shiv Prakash**

Project: DeskMindAI
Category: Enterprise AI Service Desk / Multi-Agent Chatbot
