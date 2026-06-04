from typing import TypedDict, List


class ServiceDeskState(TypedDict):
    user_input: str
    domain: str
    priority: str
    questions: List[str]
    resolution_steps: List[str]
    learning_note: str