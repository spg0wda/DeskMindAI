import os
from pydantic import BaseModel
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from agents.supervisor_graph import run_service_desk_agents
from agents.llm_service import improve_with_groq

from database import Base, engine, get_db
from models import User, Domain, Ticket, Feedback, AgentResponse, PromptMemory
load_dotenv()
Base.metadata.create_all(bind=engine)

app = FastAPI(title="DeskMindAI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
class LoginRequest(BaseModel):
    email: str
    password: str
@app.post("/auth/login")
def login_admin(request: LoginRequest):
    admin_email = os.getenv("ADMIN_EMAIL", "admin@deskmind.ai")
    admin_password = os.getenv("ADMIN_PASSWORD", "admin123")

    if request.email != admin_email or request.password != admin_password:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    return {
        "message": "Login successful",
        "token": "demo-admin-token",
        "user": {
            "email": admin_email,
            "role": "Admin"
        }
    }

@app.get("/")
def home():
    return {
        "message": "DeskMindAI Backend Running with MySQL"
    }


@app.post("/tickets")
def create_ticket(user_input: str, db: Session = Depends(get_db)):
    domain = db.query(Domain).filter(Domain.name == "IT Support").first()

    if not domain:
        domain = Domain(
            name="IT Support",
            description="Default service desk support domain"
        )
        db.add(domain)
        db.commit()
        db.refresh(domain)

    ticket = Ticket(
        user_input=user_input,
        domain_id=domain.id,
        priority="Medium",
        status="Open"
    )

    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    agent_response = AgentResponse(
        ticket_id=ticket.id,
        agent_name="Basic Service Desk Agent",
        response_text="Ticket received. Our AI agent will analyze this issue."
    )

    db.add(agent_response)
    db.commit()

    return {
        "message": "Ticket created successfully",
        "ticket_id": ticket.id,
        "user_input": ticket.user_input,
        "domain": domain.name,
        "priority": ticket.priority,
        "status": ticket.status
    }


@app.post("/feedback")
def add_feedback(
    ticket_id: int,
    rating: int,
    comment: str,
    db: Session = Depends(get_db)
):
    feedback = Feedback(
        ticket_id=ticket_id,
        rating=rating,
        comment=comment
    )

    db.add(feedback)
    db.commit()
    db.refresh(feedback)

    return {
        "message": "Feedback saved successfully",
        "feedback_id": feedback.id
    }
@app.post("/feedback/learn")
def add_learning_feedback(
    ticket_id: int,
    rating: int,
    comment: str,
    db: Session = Depends(get_db)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()

    if not ticket:
        return {
            "message": "Ticket not found"
        }

    feedback = Feedback(
        ticket_id=ticket_id,
        rating=rating,
        comment=comment
    )

    db.add(feedback)
    db.commit()
    db.refresh(feedback)

    domain = db.query(Domain).filter(Domain.id == ticket.domain_id).first()

    domain_name = domain.name if domain else "General IT Support"

    learning_prompt = (
        f"Feedback received for domain: {domain_name}\n"
        f"Original issue: {ticket.user_input}\n"
        f"User rating: {rating}/5\n"
        f"User feedback: {comment}\n"
        f"Learning instruction: Improve future clarifying questions and resolution steps for similar {domain_name} issues."
    )

    prompt_memory = PromptMemory(
        domain_id=ticket.domain_id,
        prompt_text=learning_prompt,
        version=1,
        is_active=True
    )

    db.add(prompt_memory)
    db.commit()
    db.refresh(prompt_memory)

    return {
        "message": "Feedback saved and prompt memory updated successfully",
        "feedback_id": feedback.id,
        "prompt_memory_id": prompt_memory.id,
        "domain": domain_name
    }

@app.get("/dashboard/stats")
def dashboard_stats(db: Session = Depends(get_db)):
    return {
        "total_users": db.query(User).count(),
        "total_domains": db.query(Domain).count(),
        "total_tickets": db.query(Ticket).count(),
        "total_feedback": db.query(Feedback).count(),
        "total_agent_responses": db.query(AgentResponse).count(),
        "total_prompt_memory": db.query(PromptMemory).count()
    }


@app.get("/dashboard/tickets")
def get_tickets(db: Session = Depends(get_db)):
    tickets = db.query(Ticket).order_by(Ticket.id.desc()).all()

    return [
        {
            "id": ticket.id,
            "user_input": ticket.user_input,
            "priority": ticket.priority,
            "status": ticket.status,
            "domain_id": ticket.domain_id,
            "domain_name": ticket.domain.name if ticket.domain else "Unknown",
            "created_at": ticket.created_at
        }
        for ticket in tickets
    ]
@app.put("/tickets/{ticket_id}/status")
def update_ticket_status(
    ticket_id: int,
    status: str,
    db: Session = Depends(get_db)
):
    allowed_status = ["Open", "In Progress", "Resolved", "Closed"]

    if status not in allowed_status:
        raise HTTPException(
            status_code=400,
            detail="Invalid status. Allowed values: Open, In Progress, Resolved, Closed"
        )

    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found"
        )

    ticket.status = status
    db.commit()
    db.refresh(ticket)

    return {
        "message": "Ticket status updated successfully",
        "ticket_id": ticket.id,
        "new_status": ticket.status
    }
@app.get("/tickets/{ticket_id}")
def get_ticket_detail(ticket_id: int, db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found"
        )

    agent_responses = (
        db.query(AgentResponse)
        .filter(AgentResponse.ticket_id == ticket_id)
        .order_by(AgentResponse.id.desc())
        .all()
    )

    feedback_items = (
        db.query(Feedback)
        .filter(Feedback.ticket_id == ticket_id)
        .order_by(Feedback.id.desc())
        .all()
    )

    return {
        "id": ticket.id,
        "user_input": ticket.user_input,
        "priority": ticket.priority,
        "status": ticket.status,
        "domain_id": ticket.domain_id,
        "domain_name": ticket.domain.name if ticket.domain else "Unknown",
        "created_at": ticket.created_at,
        "agent_responses": [
            {
                "id": response.id,
                "agent_name": response.agent_name,
                "response_text": response.response_text,
                "created_at": response.created_at
            }
            for response in agent_responses
        ],
        "feedback": [
            {
                "id": item.id,
                "rating": item.rating,
                "comment": item.comment,
                "created_at": item.created_at
            }
            for item in feedback_items
        ]
    }

@app.get("/dashboard/domains")
def get_domains(db: Session = Depends(get_db)):
    domains = db.query(Domain).all()

    return [
        {
            "id": domain.id,
            "name": domain.name,
            "description": domain.description,
            "created_at": domain.created_at
        }
        for domain in domains
    ]


@app.get("/dashboard/feedback")
def get_feedback(db: Session = Depends(get_db)):
    feedback_list = db.query(Feedback).order_by(Feedback.id.desc()).all()

    return [
        {
            "id": feedback.id,
            "ticket_id": feedback.ticket_id,
            "rating": feedback.rating,
            "comment": feedback.comment,
            "created_at": feedback.created_at
        }
        for feedback in feedback_list
    ]
@app.get("/dashboard/prompt-memory")
def get_prompt_memory(db: Session = Depends(get_db)):
    memories = db.query(PromptMemory).order_by(PromptMemory.id.desc()).all()

    return [
        {
            "id": memory.id,
            "domain_id": memory.domain_id,
            "prompt_text": memory.prompt_text,
            "version": memory.version,
            "is_active": memory.is_active,
            "created_at": memory.created_at
        }
        for memory in memories
    ]   
@app.post("/agent/process")
def process_with_agents(user_input: str, db: Session = Depends(get_db)):
    agent_result = run_service_desk_agents(user_input)

    domain = db.query(Domain).filter(Domain.name == agent_result["domain"]).first()

    if not domain:
        domain = Domain(
            name=agent_result["domain"],
            description=f"Auto-created domain for {agent_result['domain']} issues"
        )
        db.add(domain)
        db.commit()
        db.refresh(domain)

    ticket = Ticket(
        user_input=user_input,
        domain_id=domain.id,
        priority=agent_result["priority"],
        status="Open"
    )

    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    agent_response_text = (
        "Questions:\n"
        + "\n".join(agent_result["questions"])
        + "\n\nResolution Steps:\n"
        + "\n".join(agent_result["resolution_steps"])
        + "\n\nLearning Note:\n"
        + agent_result["learning_note"]
    )

    agent_response = AgentResponse(
        ticket_id=ticket.id,
        agent_name="LangGraph Supervisor Agent",
        response_text=agent_response_text
    )

    db.add(agent_response)
    db.commit()

    return {
        "message": "LangGraph agents processed the ticket successfully",
        "ticket_id": ticket.id,
        "user_input": user_input,
        "domain": agent_result["domain"],
        "priority": agent_result["priority"],
        "questions": agent_result["questions"],
        "resolution_steps": agent_result["resolution_steps"],
        "learning_note": agent_result["learning_note"]
    }
@app.post("/agent/process-ai")
def process_with_ai_agents(user_input: str, db: Session = Depends(get_db)):
    agent_result = run_service_desk_agents(user_input)

    domain = db.query(Domain).filter(Domain.name == agent_result["domain"]).first()

    if not domain:
        domain = Domain(
            name=agent_result["domain"],
            description=f"Auto-created domain for {agent_result['domain']} issues"
        )
        db.add(domain)
        db.commit()
        db.refresh(domain)

    memory_rows = (
        db.query(PromptMemory)
        .filter(PromptMemory.domain_id == domain.id)
        .filter(PromptMemory.is_active == True)
        .order_by(PromptMemory.id.desc())
        .limit(3)
        .all()
    )

    memory_texts = [memory.prompt_text for memory in memory_rows]

    ai_result = improve_with_groq(
        user_input=user_input,
        domain=agent_result["domain"],
        priority=agent_result["priority"],
        questions=agent_result["questions"],
        resolution_steps=agent_result["resolution_steps"],
        memory_texts=memory_texts
    )

    ticket = Ticket(
        user_input=user_input,
        domain_id=domain.id,
        priority=agent_result["priority"],
        status="Open"
    )

    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    agent_response_text = (
        "AI Enhanced Questions:\n"
        + "\n".join(ai_result["questions"])
        + "\n\nAI Enhanced Resolution Steps:\n"
        + "\n".join(ai_result["resolution_steps"])
        + "\n\nAI Summary:\n"
        + ai_result["ai_summary"]
        + "\n\nLearning Note:\n"
        + agent_result["learning_note"]
    )

    agent_response = AgentResponse(
        ticket_id=ticket.id,
        agent_name="LangGraph Supervisor Agent + Groq AI",
        response_text=agent_response_text
    )

    db.add(agent_response)
    db.commit()

    return {
        "message": "AI agents processed the ticket successfully",
        "ticket_id": ticket.id,
        "user_input": user_input,
        "domain": agent_result["domain"],
        "priority": agent_result["priority"],
        "questions": ai_result["questions"],
        "resolution_steps": ai_result["resolution_steps"],
        "learning_note": agent_result["learning_note"],
        "ai_summary": ai_result["ai_summary"],
        "ai_used": ai_result["ai_used"]
    }