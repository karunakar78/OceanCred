import os
import json
import google.generativeai as genai
from PIL import Image

# ==============================================================================
# PASTE YOUR GEMINI API KEY BELOW (Do not share this key publicly)
# ==============================================================================
GOOGLE_API_KEY = "AIzaSyAMShFrVl8ViqcXUf6eV6ouvNnGRzKgQ1c"

# ==============================================================================
# TEST MODE: Set to True to allow random photos and bypass Gemini API strictly
# ==============================================================================
ENABLE_TEST_MODE = False

def analyze_waste_image(file_path: str) -> dict:
    """
    Analyzes an image using Gemini 1.5 Flash to determine if it's ocean waste.
    Returns:
    {
        "is_waste": bool,
        "waste_type": str,
        "estimated_weight_kg": float
    }
    """
    if ENABLE_TEST_MODE:
        print("TEST MODE IS ON: Bypassing Gemini AI and validating test photo as real waste.")
        import random
        return {
            "is_waste": True,
            "waste_type": "Test Mode Mock Waste",
            "estimated_weight_kg": round(random.uniform(1.0, 5.0), 2)
        }
        
    if GOOGLE_API_KEY == "YOUR_GEMINI_API_KEY_HERE" or not GOOGLE_API_KEY:
        print("WARNING: Gemini API Key not set! Using fallback data simulation.")
        return {
            "is_waste": True,
            "waste_type": "Simulated Generic Waste (No API Key)",
            "estimated_weight_kg": 2.5
        }

    try:
        genai.configure(api_key=GOOGLE_API_KEY)
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        img = Image.open(file_path)
        
        prompt = '''
        Analyze this image carefully. 
        Does it contain ocean, sea, or beach waste? 
        If it does NOT contain waste (e.g. it is a plain random selfie, normal landscape, etc.), strictly set "is_waste" to false and return 0 for weight.
        If it DOES contain waste, estimate its visible physical weight in kilograms based on the volume of plastic/debris depicted.
        Also, provide a brief description of the "waste_type" (e.g., "Plastic Bottles", "Fishing Nets", "Mixed Debris").
        
        Respond ONLY with a valid JSON strictly matching this exact schema. Do not wrap it in markdown codeblocks. Do not add conversational text:
        {
            "is_waste": true/false,
            "waste_type": "string",
            "estimated_weight_kg": float
        }
        '''
        
        response = model.generate_content([prompt, img])
        text_resp = response.text.strip()
        
        # Clean up any potential markdown formatting the AI might inject
        if text_resp.startswith("```json"):
            text_resp = text_resp[7:]
        if text_resp.startswith("```"):
            text_resp = text_resp[3:]
        if text_resp.endswith("```"):
            text_resp = text_resp[:-3]
            
        data = json.loads(text_resp.strip())
        
        return {
            "is_waste": bool(data.get("is_waste", False)),
            "waste_type": str(data.get("waste_type", "Unknown")),
            "estimated_weight_kg": float(data.get("estimated_weight_kg", 0.0))
        }
        
    except Exception as e:
        print(f"Vision API Error: {e}")
        return {
            "is_waste": False,
            "waste_type": f"Error parsing AI response: {e}",
            "estimated_weight_kg": 0.0
        }
