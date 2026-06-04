from agents.state import ServiceDeskState


def gather_requirements(state: ServiceDeskState) -> ServiceDeskState:
    domain = state["domain"]

    if domain == "Network / VPN":
        questions = [
            "Are you connected to office Wi-Fi or using mobile hotspot?",
            "What error message do you see while connecting to VPN?",
            "Did the VPN work earlier on the same laptop?",
            "Are other websites or apps working normally?"
        ]

    elif domain == "Account / Access":
        questions = [
            "Which application or portal are you unable to access?",
            "Are you seeing an incorrect password or account locked message?",
            "Did you recently change your password?",
            "Is this affecting only you or multiple users?"
        ]

    elif domain == "Hardware":
        questions = [
            "What device is having the issue?",
            "When did the issue start?",
            "Is there any physical damage?",
            "Have you tried restarting the device?"
        ]

    elif domain == "Software":
        questions = [
            "Which software/application is causing the issue?",
            "What version are you using?",
            "Do you see any error message?",
            "Did the issue start after an update or installation?"
        ]

    elif domain == "Finance":
        questions = [
            "Is this related to salary, reimbursement, invoice, or payment?",
            "What is the transaction/reference ID if available?",
            "When did you submit the request?",
            "Have you received any approval email?"
        ]

    elif domain == "HR":
        questions = [
            "Is this related to leave, attendance, onboarding, or employee records?",
            "What date or period is affected?",
            "Have you already raised a request with HR?",
            "Do you have any supporting document?"
        ]

    else:
        questions = [
            "Can you describe the issue in more detail?",
            "When did the issue start?",
            "Is this issue affecting only you or multiple users?",
            "Have you tried any troubleshooting steps already?"
        ]

    state["questions"] = questions
    return state