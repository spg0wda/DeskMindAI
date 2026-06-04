from fastapi import FastAPI

app = FastAPI(title="DeskMindAI API")

@app.get("/")
def home():
    return {
        "message": "DeskMindAI Backend Running Successfully"
    }
