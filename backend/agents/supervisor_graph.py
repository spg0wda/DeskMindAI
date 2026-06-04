from langgraph.graph import StateGraph, END

from agents.state import ServiceDeskState
from agents.domain_agent import classify_domain
from agents.requirement_agent import gather_requirements
from agents.priority_agent import detect_priority
from agents.resolution_agent import suggest_resolution
from agents.learning_agent import generate_learning_note


def build_service_desk_graph():
    graph = StateGraph(ServiceDeskState)

    graph.add_node("domain_agent", classify_domain)
    graph.add_node("requirement_agent", gather_requirements)
    graph.add_node("priority_agent", detect_priority)
    graph.add_node("resolution_agent", suggest_resolution)
    graph.add_node("learning_agent", generate_learning_note)

    graph.set_entry_point("domain_agent")

    graph.add_edge("domain_agent", "requirement_agent")
    graph.add_edge("requirement_agent", "priority_agent")
    graph.add_edge("priority_agent", "resolution_agent")
    graph.add_edge("resolution_agent", "learning_agent")
    graph.add_edge("learning_agent", END)

    return graph.compile()


service_desk_graph = build_service_desk_graph()


def run_service_desk_agents(user_input: str):
    initial_state: ServiceDeskState = {
        "user_input": user_input,
        "domain": "",
        "priority": "",
        "questions": [],
        "resolution_steps": [],
        "learning_note": ""
    }

    result = service_desk_graph.invoke(initial_state)
    return result