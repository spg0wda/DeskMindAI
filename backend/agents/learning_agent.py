from agents.state import ServiceDeskState


def generate_learning_note(state: ServiceDeskState) -> ServiceDeskState:
    domain = state["domain"]

    state["learning_note"] = (
        f"Store this issue under '{domain}' prompt memory. "
        f"Use the generated questions and resolution steps to improve future responses."
    )

    return state