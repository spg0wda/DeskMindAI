import os
import uuid
import tempfile

import requests
import streamlit as st
from dotenv import load_dotenv
from groq import Groq


API_BASE_URL = "http://127.0.0.1:8000"

load_dotenv("backend/.env")


st.set_page_config(
    page_title="DeskMindAI Multi-Agent Chat",
    page_icon="🤖",
    layout="centered"
)


st.markdown(
    """
    <style>
    .stApp {
        background: radial-gradient(circle at top left, #102a43, #0b0f19 45%, #050816);
        color: white;
    }

    h1 {
        color: #ffffff;
        font-size: 46px !important;
        font-weight: 800 !important;
    }

    .agent-tags {
        color: #cbd5e1;
        font-size: 16px;
        margin-bottom: 18px;
    }

    .agent-box {
        background: rgba(15, 23, 42, 0.85);
        border: 1px solid rgba(148, 163, 184, 0.25);
        padding: 16px;
        border-radius: 14px;
        margin-bottom: 18px;
    }

    .agent-label {
        color: #38bdf8;
        font-weight: 800;
    }

    .routing-box {
        background: rgba(37, 99, 235, 0.12);
        border-left: 4px solid #38bdf8;
        padding: 12px 14px;
        border-radius: 10px;
        margin-bottom: 16px;
        color: #dbeafe;
    }

    .redirect-box {
        background: rgba(245, 158, 11, 0.12);
        border-left: 4px solid #f59e0b;
        padding: 12px 14px;
        border-radius: 10px;
        margin-bottom: 16px;
        color: #fde68a;
    }

    .voice-box {
        background: rgba(168, 85, 247, 0.12);
        border: 1px solid rgba(168, 85, 247, 0.25);
        border-left: 4px solid #a855f7;
        padding: 18px;
        border-radius: 14px;
        margin-bottom: 20px;
    }

    .voice-title {
        color: #e9d5ff;
        font-weight: 900;
        margin-bottom: 8px;
    }

    .transcript-box {
        background: rgba(34, 197, 94, 0.12);
        border-left: 4px solid #22c55e;
        padding: 12px 14px;
        border-radius: 10px;
        margin-top: 12px;
        color: #bbf7d0;
    }
    </style>
    """,
    unsafe_allow_html=True
)


if "thread_id" not in st.session_state:
    st.session_state.thread_id = f"streamlit-{uuid.uuid4()}"

if "messages" not in st.session_state:
    st.session_state.messages = []

if "active_agent" not in st.session_state:
    st.session_state.active_agent = "No active agent yet"

if "routing_message" not in st.session_state:
    st.session_state.routing_message = "Start a conversation to route to an agent."

if "redirected" not in st.session_state:
    st.session_state.redirected = False

if "last_transcript" not in st.session_state:
    st.session_state.last_transcript = ""

if "last_bot_audio" not in st.session_state:
    st.session_state.last_bot_audio = None


def get_groq_client():
    api_key = os.getenv("GROQ_API_KEY")

    if not api_key:
        raise ValueError("GROQ_API_KEY missing. Add it inside backend/.env")

    return Groq(api_key=api_key)


def send_message_to_backend(user_message: str):
    response = requests.post(
        f"{API_BASE_URL}/agent/chat-memory",
        json={
            "thread_id": st.session_state.thread_id,
            "message": user_message
        },
        timeout=30
    )

    response.raise_for_status()
    return response.json()


def transcribe_audio(uploaded_file):
    client = get_groq_client()

    audio_bytes = uploaded_file.getvalue()

    transcription = client.audio.transcriptions.create(
        file=(uploaded_file.name, audio_bytes),
        model=os.getenv("GROQ_STT_MODEL", "whisper-large-v3-turbo"),
        response_format="json"
    )

    if hasattr(transcription, "text"):
        return transcription.text

    if isinstance(transcription, dict):
        return transcription.get("text", "")

    return str(transcription)


def generate_bot_voice(text: str):
    client = get_groq_client()

    safe_text = text[:3500]

    speech_response = client.audio.speech.create(
        model=os.getenv("GROQ_TTS_MODEL", "canopylabs/orpheus-v1-english"),
        voice=os.getenv("GROQ_TTS_VOICE", "troy"),
        input=safe_text,
        response_format="wav"
    )

    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_audio:
        audio_path = temp_audio.name

    if hasattr(speech_response, "write_to_file"):
        speech_response.write_to_file(audio_path)
    elif hasattr(speech_response, "content"):
        with open(audio_path, "wb") as audio_file:
            audio_file.write(speech_response.content)
    else:
        with open(audio_path, "wb") as audio_file:
            audio_file.write(speech_response.read())

    with open(audio_path, "rb") as audio_file:
        audio_bytes = audio_file.read()

    return audio_bytes


def process_user_message(user_message: str, generate_voice: bool = False):
    st.session_state.messages.append(
        {
            "role": "user",
            "content": user_message
        }
    )

    result = send_message_to_backend(user_message)

    bot_response = result.get("response", "No response received.")
    active_agent = result.get("active_agent", "unknown_agent")
    routing_message = result.get("routing_message", "No routing message.")
    redirected = result.get("redirected", False)

    st.session_state.active_agent = active_agent
    st.session_state.routing_message = routing_message
    st.session_state.redirected = redirected

    st.session_state.messages.append(
        {
            "role": "assistant",
            "content": bot_response
        }
    )

    if generate_voice:
        st.session_state.last_bot_audio = generate_bot_voice(bot_response)

    return bot_response


def reset_memory():
    try:
        requests.post(
            f"{API_BASE_URL}/agent/reset-memory",
            json={
                "thread_id": st.session_state.thread_id
            },
            timeout=30
        )
    except Exception:
        pass

    st.session_state.thread_id = f"streamlit-{uuid.uuid4()}"
    st.session_state.messages = []
    st.session_state.active_agent = "No active agent yet"
    st.session_state.routing_message = "Memory reset. Start a new conversation."
    st.session_state.redirected = False
    st.session_state.last_transcript = ""
    st.session_state.last_bot_audio = None


st.title("🤖 Multi-Agent AI System")

st.markdown(
    """
    <div class="agent-tags">
    Network | Account | Finance | HR | Hardware | Software | General
    </div>
    """,
    unsafe_allow_html=True
)

st.markdown(
    f"""
    <div class="agent-box">
        <span class="agent-label">Current Agent:</span> {st.session_state.active_agent}
    </div>
    """,
    unsafe_allow_html=True
)

if st.session_state.redirected:
    st.markdown(
        f"""
        <div class="redirect-box">
        🔁 {st.session_state.routing_message}
        </div>
        """,
        unsafe_allow_html=True
    )
else:
    st.markdown(
        f"""
        <div class="routing-box">
        🧭 {st.session_state.routing_message}
        </div>
        """,
        unsafe_allow_html=True
    )


col1, col2 = st.columns([1, 1])

with col1:
    if st.button("🔄 Reset Agent Memory"):
        reset_memory()
        st.rerun()

with col2:
    st.caption(f"Thread ID: {st.session_state.thread_id[:18]}...")


st.markdown(
    """
    <div class="voice-box">
      <div class="voice-title">🎙️ Voice-to-Voice Interaction</div>
      Upload a .wav or .mp3 file. The system will transcribe it, route it to the active agent, and return a voice response.
    </div>
    """,
    unsafe_allow_html=True
)

uploaded_audio = st.file_uploader(
    "Upload voice file",
    type=["wav", "mp3", "m4a"]
)

if uploaded_audio is not None:
    st.audio(uploaded_audio)

    if st.button("🎧 Process Voice Message"):
        try:
            with st.spinner("Transcribing voice..."):
                transcript = transcribe_audio(uploaded_audio)

            st.session_state.last_transcript = transcript

            st.markdown(
                f"""
                <div class="transcript-box">
                <b>Transcript:</b> {transcript}
                </div>
                """,
                unsafe_allow_html=True
            )

            with st.spinner("Sending transcript to agent and generating voice response..."):
                process_user_message(transcript, generate_voice=True)

            st.rerun()

        except requests.exceptions.ConnectionError:
            st.error("Backend is not running. Start FastAPI on http://127.0.0.1:8000")

        except Exception as error:
            st.error(f"Voice processing failed: {error}")


if st.session_state.last_transcript:
    st.markdown(
        f"""
        <div class="transcript-box">
        <b>Last Voice Transcript:</b> {st.session_state.last_transcript}
        </div>
        """,
        unsafe_allow_html=True
    )

if st.session_state.last_bot_audio:
    st.subheader("🔊 Bot Voice Response")
    st.audio(st.session_state.last_bot_audio, format="audio/wav")


for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.write(message["content"])


user_input = st.chat_input("Ask something...")

if user_input:
    try:
        process_user_message(user_input, generate_voice=False)
        st.rerun()

    except requests.exceptions.ConnectionError:
        st.error("Backend is not running. Start FastAPI on http://127.0.0.1:8000")

    except Exception as error:
        st.error(f"Something went wrong: {error}")