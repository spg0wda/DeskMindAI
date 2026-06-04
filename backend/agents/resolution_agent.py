from agents.state import ServiceDeskState


def suggest_resolution(state: ServiceDeskState) -> ServiceDeskState:
    domain = state["domain"]

    if domain == "Network / VPN":
        steps = [
            "Check internet connection.",
            "Restart VPN client.",
            "Clear saved VPN credentials and login again.",
            "Try connecting from another network.",
            "If issue continues, escalate to Network Support Team."
        ]

    elif domain == "Account / Access":
        steps = [
            "Verify username and password.",
            "Try password reset option.",
            "Check whether account is locked.",
            "Clear browser cache and retry.",
            "If still blocked, escalate to IAM/Admin team."
        ]

    elif domain == "Hardware":
        steps = [
            "Restart the device.",
            "Check cable, battery, or connection.",
            "Try using another port or accessory.",
            "Capture a photo or error message if possible.",
            "Escalate to hardware support if issue persists."
        ]

    elif domain == "Software":
        steps = [
            "Restart the application.",
            "Check for updates.",
            "Clear cache or temporary files.",
            "Reinstall the application if required.",
            "Escalate to software support team."
        ]

    elif domain == "Finance":
        steps = [
            "Verify request/reference ID.",
            "Check approval status.",
            "Confirm submitted documents.",
            "Contact finance team with transaction details."
        ]

    elif domain == "HR":
        steps = [
            "Verify employee ID and request type.",
            "Check HR portal status.",
            "Attach required documents.",
            "Contact HR team if status is pending for long time."
        ]

    else:
        steps = [
            "Collect more details from user.",
            "Identify affected system or department.",
            "Check whether issue is individual or organization-wide.",
            "Route to correct service desk team."
        ]

    state["resolution_steps"] = steps
    return state