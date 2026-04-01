# Backend Environment Setup & APIs

This document outlines the required external integrations that the OceanCred backend depends on to process credits and validate images. 

## 1. Environment Variable Setup (.env)

The backend now uses python `dotenv` to aggressively manage secrets out of source code. You should never commit actual API keys directly into `.py` scripts.

1. Create a `.env` file directly inside your `backend/` folder (next to `run.py`).
2. If you are starting fresh, you can duplicate `.env.example` as a starting point.

## 2. Setting Up Gemini AI (Vision Service)

The mobile `/upload` endpoint depends completely on Google's Gemini 1.5 Flash Vision API to parse images and determine if a user really uploaded valid ocean waste.

### To Configure:
1. Ensure your Google AI Studio account is active.
2. Obtain a free **API Key**.
3. Place your key inside `backend/.env` according to this schema:
   
```ini
GEMINI_API_KEY=AIzaSy...Your_Key_Here
```

The system loader (`backend/app/services/vision_ai.py`) executes `os.getenv("GEMINI_API_KEY")` exactly to pull this config securely at runtime. 

### Testing / Bypassing the AI
During heavy development or when you lack actual ocean-waste photos on hand, you can skip Gemini's API processing entirely. 
In `vision_ai.py`, you will find a global configuration variable at the top `ENABLE_TEST_MODE`.
By enforcing `ENABLE_TEST_MODE = True`, the system skips validating with Google servers and accepts any mock-uploaded photos, immediately rewarding the test user 5 static credits.

## Important Note on Git
The `.env` file should be explicitly ignored in `.gitignore` to prevent secret leaks across distributed version control (like GitHub).
