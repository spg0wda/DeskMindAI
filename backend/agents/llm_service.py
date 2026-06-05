import os
import json
import re
from dotenv import load_dotenv
from groq import Groq

load_dotenv()


def extract_json(text: str):
    try:
        return json.loads(text)
    except Exception:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            return json.loads(match.group())
        raise ValueError("No valid JSON found in LLM response")


def improve_with_groq(
    user_input: str,
    domain: str,
    priority: str,
    questions: list,
    resolution_steps: list,
    memory_texts: list
):
    api_key = os.getenv("GROQ_API_KEY")

    if not api_key:
        return {
            "questions": questions,
            "resolution_steps": resolution_steps,
            "ai_summary": "Groq API key not configured. Rule-based agent output used.",
            "ai_used": False
        }

    client = Groq(api_key=api_key)

    memory_block = "\n\n".join(memory_texts) if memory_texts else "No previous prompt memory available."

    prompt = f"""
You are an enterprise service desk AI agent.

User issue:
{user_input}

Detected domain:
{domain}

Detected priority:
{priority}

Existing clarifying questions:
{questions}

Existing resolution steps:
{resolution_steps}

Previous learning memory for this domain:
{memory_block}

Improve the clarifying questions and resolution steps using the feedback memory.

Return only valid JSON in this format:

{{
  "questions": [
    "question 1",
    "question 2",
    "question 3",
    "question 4"
  ],
  "resolution_steps": [
    "step 1",
    "step 2",
    "step 3",
    "step 4"
  ],
  "ai_summary": "short explanation of how the response was improved"
}}
"""

    try:
        completion = client.chat.completions.create(
            model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful enterprise IT service desk AI assistant. Return only valid JSON."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.2
        )

        content = completion.choices[0].message.content
        data = extract_json(content)

        return {
            "questions": data.get("questions", questions),
            "resolution_steps": data.get("resolution_steps", resolution_steps),
            "ai_summary": data.get("ai_summary", "AI-enhanced response generated."),
            "ai_used": True
        }

    except Exception as error:
        return {
            "questions": questions,
            "resolution_steps": resolution_steps,
            "ai_summary": f"Groq failed, rule-based output used. Error: {str(error)}",
            "ai_used": False
        }