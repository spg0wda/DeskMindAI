from agents.state import ServiceDeskState


def detect_priority(state: ServiceDeskState) -> ServiceDeskState:
    user_input = state["user_input"].lower()

    critical_words = ["server down", "system down", "all users", "production", "urgent", "critical"]
    high_words = ["not working", "unable", "blocked", "cannot access", "vpn", "login failed"]
    medium_words = ["slow", "delay", "issue", "problem"]

    if any(word in user_input for word in critical_words):
        priority = "Critical"
    elif any(word in user_input for word in high_words):
        priority = "High"
    elif any(word in user_input for word in medium_words):
        priority = "Medium"
    else:
        priority = "Low"

    state["priority"] = priority
    return state