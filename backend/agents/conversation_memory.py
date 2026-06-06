conversation_store = {}


def get_conversation(thread_id: str):
    if thread_id not in conversation_store:
        conversation_store[thread_id] = {
            "active_agent": None,
            "history": []
        }

    return conversation_store[thread_id]


def update_conversation(
    thread_id: str,
    active_agent: str,
    user_message: str,
    assistant_message: str
):
    conversation = get_conversation(thread_id)

    conversation["active_agent"] = active_agent

    conversation["history"].append({
        "role": "user",
        "content": user_message
    })

    conversation["history"].append({
        "role": "assistant",
        "content": assistant_message
    })

    return conversation


def reset_conversation(thread_id: str):
    if thread_id in conversation_store:
        del conversation_store[thread_id]

    return {
        "message": "Conversation reset successfully",
        "thread_id": thread_id
    }