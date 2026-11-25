// ==========================================
// O.L.I.V.I.A. CORE BRAIN (brain.js)
// ==========================================

const ASSISTANT_CONFIG = {
  assistantName: "Olivia",
  userName: "Olivia", // Change this if you want her to call you something else!
  // Optional: Ask a parent to generate a free key at ://google.com
  // Leave blank "" to run in offline/local-skills mode!
  geminiApiKey: "", 
  // Coordinates for weather (Stony Plain / Edmonton area)
  latitude: 53.5264,
  longitude: -114.0069
};

// System instructions so the AI acts like Olivia
const SYSTEM_PROMPT = `You are ${ASSISTANT_CONFIG.assistantName}, a polite, witty, and helpful personal AI assistant inspired by J.A.R.V.I.S. Address the user as ${ASSISTANT_CONFIG.userName}. Keep answers under 3 sentences so they sound natural when spoken out loud.`;

// Stores recent chat history so Olivia remembers context
let conversationMemory = [];

// Main function: Takes what you say and decides how to respond
async function processCommand(userInput) {
  const text = userInput.toLowerCase().trim();

  // 1. GREETINGS & WAKE PHRASES
  if (
    text.includes("hello") || 
    text.includes("hey olivia") || 
    text.includes("hi olivia") || 
    text === "olivia"
  ) {
    return `Online and ready, ${ASSISTANT_CONFIG.userName}. How can I assist you today?`;
  }

  // 2. IDENTITY CHECK
  if (text.includes("who are you") || text.includes("what is your name")) {
    return `I am ${ASSISTANT_CONFIG.assistantName}, your personal digital assistant.`;
  }

  // 3. TIME & DATE
  if (text.includes("time")) {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `It is currently ${now}, ${ASSISTANT_CONFIG.userName}.`;
  }
  if (text.includes("date") || text.includes("what day is it")) {
    const today = new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
    return `Today is ${today}.`;
  }

  // 4. LIVE WEATHER (Free API, no key required!)
  if (text.includes("weather") || text.includes("temperature")) {
    return await getWeather();
  }

  // 5. OPEN WEBSITES
  if (text.startsWith("open ")) {
    const site = text.replace("open ", "").trim();
    const urls = {
      "youtube": "https://youtube.com",
      "google": "https://google.com",
      "github": "https://github.com",
      "classroom": "https://google.com"
    };
    if (urls[site]) {
      window.open(urls[site], "_blank");
      return `Opening ${site} for you now.`;
    }
  }

  // 6. SIMPLE MATH (e.g., "calculate 14 * 8")
  if (text.startsWith("calculate ")) {
    try {
      const mathExpression = text.replace("calculate ", "").replace(/[^0-9+\-*/().]/g, "");
      const result = Function(`"use strict"; return (${mathExpression})`)();
      return `The answer is ${result}, ${ASSISTANT_CONFIG.userName}.`;
    } catch {
      return "I couldn't calculate that equation. Try using standard math symbols.";
    }
  }

  // 7. AI BRAIN FALLBACK (For any general question!)
  return await askAIBrain(userInput);
}

// Helper: Fetches live local weather from Open-Meteo
async function getWeather() {
  try {
    const url = `https://open-meteo.com{ASSISTANT_CONFIG.latitude}&longitude=${ASSISTANT_CONFIG.longitude}&current_weather=true`;
    const response = await fetch(url);
    const data = await response.json();
    const temp = data.current_weather.temperature;
    const wind = data.current_weather.windspeed;
    return `Outside right now, it is ${temp} degrees Celsius with winds at ${wind} kilometers per hour.`;
  } catch (error) {
    return "I'm having trouble reaching the weather satellites right now.";
  }
}

// Helper: Sends unknown questions to Gemini AI (if key is added)
async function askAIBrain(prompt) {
  if (!ASSISTANT_CONFIG.geminiApiKey) {
    return `I don't have a built-in command for "${prompt}" yet, and my cloud AI key isn't connected. Add a Gemini API key in my config to unlock full intelligence!`;
  }

  conversationMemory.push({ role: "user", parts: [{ text: prompt }] });

  try {
    const url = `https://googleapis.com{ASSISTANT_CONFIG.geminiApiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: conversationMemory
      })
    });

    const data = await response.json();
    const reply = data.candidates[0].content.parts[0].text;
    conversationMemory.push({ role: "model", parts: [{ text: reply }] });
    return reply;
  } catch (error) {
    return "My connection to the cloud brain was interrupted. Check your API key or internet.";
  }
}
