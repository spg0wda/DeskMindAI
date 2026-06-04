from agents.state import ServiceDeskState


def classify_domain(state: ServiceDeskState) -> ServiceDeskState:
    user_input = state["user_input"].lower()

    if any(word in user_input for word in ["vpn", "wifi", "internet", "network", "router"]):
        domain = "Network / VPN"
    elif any(word in user_input for word in ["password", "login", "account", "access"]):
        domain = "Account / Access"
    elif any(word in user_input for word in ["salary", "payroll", "reimbursement", "invoice"]):
        domain = "Finance"
    elif any(word in user_input for word in ["leave", "attendance", "hr", "employee"]):
        domain = "HR"
    elif any(word in user_input for word in ["laptop", "keyboard", "mouse", "screen", "printer"]):
        domain = "Hardware"
    elif any(word in user_input for word in ["software", "app", "application", "install"]):
        domain = "Software"
    else:
        domain = "General IT Support"

    state["domain"] = domain
    return state