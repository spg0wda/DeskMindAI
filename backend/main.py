from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import Base, engine, get_db
from models import User, Domain, Ticket, Feedback, AgentResponse, PromptMemory

Base.metadata.create_all(bind=engine)

app = FastAPI(title="DeskMindAI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
            "created_at": ticket.created_at
        }
        for ticket in tickets
    ]


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