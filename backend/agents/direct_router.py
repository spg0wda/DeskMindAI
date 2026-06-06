from agents.conversation_memory import get_conversation, update_conversation


def is_small_talk(message: str):
    text = message.lower().strip()

    greetings = [
        "hi",
        "hello",
        "hey",
        "good morning",
        "good afternoon",
        "good evening",
        "thanks",
        "thank you",
        "ok",
        "okay",
        "fine",
        "cool"
    ]

    return text in greetings


def detect_agent_from_message(message: str):
    text = message.lower()

    if any(word in text for word in ["vpn", "wifi", "internet", "network", "router", "connection"]):
        return "network_agent", "Network / VPN"

    if any(word in text for word in ["password", "login", "account", "access", "authentication", "otp"]):
        return "account_agent", "Account / Access"

    if any(word in text for word in ["salary", "payroll", "reimbursement", "invoice", "payment", "claim"]):
        return "finance_agent", "Finance"

    if any(word in text for word in ["leave", "attendance", "hr", "employee", "onboarding", "manager"]):
        return "hr_agent", "HR"

    if any(word in text for word in ["laptop", "keyboard", "mouse", "screen", "printer", "device", "monitor"]):
        return "hardware_agent", "Hardware"

    if any(word in text for word in ["software", "app", "application", "install", "update", "crash"]):
        return "software_agent", "Software"

    return "general_agent", "General IT Support"


def agent_to_domain(agent_name: str):
    mapping = {
        "network_agent": "Network / VPN",
        "account_agent": "Account / Access",
        "finance_agent": "Finance",
        "hr_agent": "HR",
        "hardware_agent": "Hardware",
        "software_agent": "Software",
        "general_agent": "General IT Support",
    }

    return mapping.get(agent_name, "General IT Support")


def clean_agent_name(agent_name: str):
    if not agent_name:
        return "Supervisor"

    return agent_name.replace("_", " ").title()


def agent_should_redirect(current_agent: str, message: str):
    detected_agent, detected_domain = detect_agent_from_message(message)

    if current_agent is None:
        return detected_agent, detected_domain, False, "Supervisor selected first agent"

    if is_small_talk(message):
        return current_agent, agent_to_domain(current_agent), False, (
            f"Small talk detected. Continuing session with: {current_agent}"
        )

    if detected_agent != "general_agent" and detected_agent != current_agent:
        return detected_agent, detected_domain, True, (
            f"{clean_agent_name(current_agent)} redirected to {clean_agent_name(detected_agent)}"
        )

    return current_agent, agent_to_domain(current_agent), False, (
        f"Skipping supervisor. Continuing with: {current_agent}"
    )


def generate_small_talk_response(agent_name: str):
    if agent_name is None:
        return (
            "Hello! I am DeskMindAI. Please tell me your service desk issue, "
            "and I will route it to the correct agent."
        )

    return (
        f"Hello! You are currently connected to {clean_agent_name(agent_name)}. "
        "You can continue with this issue, or describe a new issue and I will redirect you to the correct agent."
    )


def generate_agent_response(agent_name: str, message: str, redirected: bool):
    if is_small_talk(message):
        return generate_small_talk_response(agent_name)

    prefix = ""

    if redirected:
        prefix = f"Redirected to {clean_agent_name(agent_name)}.\n\n"

    if agent_name == "network_agent":
        return prefix + (
            "Network Agent: I will continue troubleshooting your network/VPN issue. "
            "Please confirm whether you are on office Wi-Fi, mobile hotspot, or home internet. "
            "Also share the exact VPN error message."
        )

    if agent_name == "account_agent":
        return prefix + (
            "Account Agent: I will help with your login/access issue. "
            "Please confirm the application name, whether your account is locked, "
            "and whether password reset was attempted."
        )

    if agent_name == "finance_agent":
        return prefix + (
            "Finance Agent: I will handle this finance-related request. "
            "Please provide the reimbursement, invoice, or reference ID and submission date."
        )

    if agent_name == "hr_agent":
        return prefix + (
            "HR Agent: I will handle this HR-related request. "
            "Please share whether this is about leave, attendance, onboarding, or employee records."
        )

    if agent_name == "hardware_agent":
        return prefix + (
            "Hardware Agent: I will troubleshoot your device issue. "
            "Please mention the device, when the problem started, and whether there is any physical damage."
        )

    if agent_name == "software_agent":
        return prefix + (
            "Software Agent: I will help with the application/software issue. "
            "Please share the app name, version, and exact error message."
        )

    return prefix + (
        "General IT Agent: I need a little more detail to route this correctly. "
        "Please describe the system, error, and when the issue started."
    )


def run_memory_router(thread_id: str, message: str):
    conversation = get_conversation(thread_id)
    current_agent = conversation["active_agent"]

    selected_agent, selected_domain, redirected, routing_message = agent_should_redirect(
        current_agent=current_agent,
        message=message
    )

    response = generate_agent_response(
        agent_name=selected_agent,
        message=message,
        redirected=redirected
    )

    update_conversation(
        thread_id=thread_id,
        active_agent=selected_agent,
        user_message=message,
        assistant_message=response
    )

    return {
        "thread_id": thread_id,
        "previous_agent": current_agent,
        "active_agent": selected_agent,
        "domain": selected_domain,
        "redirected": redirected,
        "routing_message": routing_message,
        "response": response,
        "history": get_conversation(thread_id)["history"]
    }