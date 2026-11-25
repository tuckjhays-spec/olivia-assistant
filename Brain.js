// ==========================================
// O.L.I.V.I.A. NATURAL LANGUAGE BRAIN (brain.js)
// ==========================================

const ASSISTANT_CONFIG = {
  assistantName: "Olivia",
  userName: "Olivia",
  geminiApiKey: "", // Optional: Leave blank for 100% free mode!
  latitude: 53.5264,
  longitude: -114.0069
};

let conversationMemory = [];

// Helper: Checks if the user's sentence contains ANY of a list of words/phrases
function matchesAny(text, phrases) {
  return phrases.some(phrase => text.includes(phrase));
}

async function processCommand(userInput) {
  // Clean punctuation so "What's the time?" becomes "whats the time"
  const raw = userInput.trim();
  const text = raw.toLowerCase().replace(/[?!.,]/g, "").trim();

  // 1. GREETINGS & SMALL TALK
  if (matchesAny(text, ["hello", "hi ", "hey", "good morning", "good afternoon", "good evening"]) || text === "hi" || text === "olivia") {
    return `Online and ready, ${ASSISTANT_CONFIG.userName}. What can I do for you?`;
  }

  if (matchesAny(text, ["how are you", "how are you doing", "whats up", "what's up"])) {
    return `All systems running smoothly, ${ASSISTANT_CONFIG.userName}. Ready whenever you are!`;
  }

  if (matchesAny(text, ["thank you", "thanks", "appreciate it"])) {
    return `You're very welcome, ${ASSISTANT_CONFIG.userName}!`;
  }

  if (matchesAny(text, ["who are you", "your name", "what are you"])) {
    return `I am ${ASSISTANT_CONFIG.assistantName}, your personal digital assistant.`;
  }

  // 2. TIME & DATE
  if (matchesAny(text, ["time", "clock"])) {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `It is currently ${now}.`;
  }

  if (matchesAny(text, ["date", "what day", "today"])) {
    const today = new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
    return `Today is ${today}.`;
  }

  // 3. LIVE WEATHER
  if (matchesAny(text, ["weather", "temperature", "how hot", "how cold", "forecast"])) {
    return await getWeather();
  }

  // 4. JOKES & FUN TOOLS
  if (matchesAny(text, ["joke", "make me laugh", "funny"])) {
    const jokes = [
      "Why do programmers prefer dark mode? Because light attracts bugs.",
      "Why did the computer go to the doctor? Because it caught a virus!",
      "What do you call a bear with no teeth? A gummy bear.",
      "Why don't scientists trust atoms? Because they make up everything."
    ];
    return jokes[Math.floor(Math.random() * jokes.length)];
  }

  if (matchesAny(text, ["flip a coin", "heads or tails"])) {
    const result = Math.random() < 0.5 ? "Heads" : "Tails";
    return `I flipped a coin and got ${result}.`;
  }

  if (matchesAny(text, ["roll a dice", "roll a die", "random number"])) {
    const roll = Math.floor(Math.random() * 6) + 1;
    return `You rolled a ${roll}.`;
  }

  // 5. TIMERS (e.g., "Set a timer for 5 minutes" or "Timer 30 seconds")
  if (text.includes("timer")) {
    const match = text.match(/(\d+)\s*(second|seconds|minute|minutes)/);
    if (match) {
      const amount = parseInt(match);
      const unit = match;
      const ms = unit.startsWith("minute") ? amount * 60000 : amount * 1000;
      setTimeout(() => {
        alert(`⏰ Olivia Timer: Your ${amount} ${unit} timer is up!`);
      }, ms);
      return `Timer set for ${amount} ${unit}, ${ASSISTANT_CONFIG.userName}.`;
    }
    return "Tell me how long, like: set a timer for 5 minutes.";
  }

  // 6. NATURAL MATH (e.g., "what is 14 times 8", "calculate 50 + 25")
  const mathConverted = text
    .replace(/plus/g, "+")
    .replace(/minus/g, "-")
    .replace(/times|multiplied by|x/g, "*")
    .replace(/divided by|over/g, "/");

  const mathMatch = mathConverted.match(/(\d+(\.\d+)?\s*[\+\-\*\/]\s*\d+(\.\d+)?)/);
  if (mathMatch) {
    try {
      const result = Function(`"use strict"; return (${mathMatch})`)();
      return `That equals ${Number(result.toFixed(4))}.`;
    } catch {
      return "I couldn't quite solve that equation.";
    }
  }

  // 7. OPEN SITES OR SEARCH YOUTUBE / GOOGLE
  if (text.startsWith("youtube ") || text.includes("on youtube")) {
    const query = text.replace("youtube", "").replace("on youtube", "").replace("search", "").replace("play", "").trim();
    window.open(`https://youtube.com{encodeURIComponent(query)}`, "_blank");
    return `Searching YouTube for ${query}.`;
  }

  if (text.startsWith("search ") || text.startsWith("google ") || text.includes("look up ")) {
    const query = text.replace(/^(search for|search|google|look up)\s+/i, "").trim();
    window.open(`https://google.com{encodeURIComponent(query)}`, "_blank");
    return `Searching Google for ${query}.`;
  }

  if (text.startsWith("open ")) {
    const site = text.replace("open ", "").trim();
    const urls = {
      "youtube": "https://youtube.com",
      "google": "https://google.com",
      "github": "https://github.com",
      "classroom": "https://google.com",
      "docs": "https://google.com"
    };
    if (urls[site]) {
      window.open(urls[site], "_blank");
      return `Opening ${site}.`;
    }
  }

  // 8. WIKIPEDIA KNOWLEDGE LOOKUP (Answers "Who is...", "What is...", "Tell me about...")
  if (matchesAny(text, ["who is ", "who was ", "what is ", "what are ", "tell me about ", "define "])) {
    const topic = text
      .replace(/^(who is|who was|what is a|what is an|what is|what are|tell me about|define)\s+/i, "")
      .trim();
    if (topic) {
      return await searchWikipedia(topic);
    }
  }

  // 9. CLOUD AI FALLBACK (If you ever add a Gemini API key later)
  if (ASSISTANT_CONFIG.geminiApiKey) {
    return await askAIBrain(raw);
  }

  // Friendly fallback if nothing matched
  return `I'm not sure about "${raw}" yet, ${ASSISTANT_CONFIG.userName}. Try asking me "tell me about ${raw}" or "search ${raw}"!`;
}

// Helper: Live Local Weather
async function getWeather() {
  try {
    const url = `https://open-meteo.com{ASSISTANT_CONFIG.latitude}&longitude=${ASSISTANT_CONFIG.longitude}&current_weather=true`;
    const response = await fetch(url);
    const data = await response.json();
    return `Right now it is ${data.current_weather.temperature} degrees Celsius with winds at ${data.current_weather.windspeed} kilometers per hour.`;
  } catch {
    return "I couldn't reach the weather service right now.";
  }
}

// Helper: Free Wikipedia Answers (No API Key Needed!)
async function searchWikipedia(topic) {
  try {
    const url = `https://wikipedia.org{encodeURIComponent(topic)}`;
    const response = await fetch(url);
    if (!response.ok) {
      return `I couldn't find an article on "${topic}". Would you like me to say "search ${topic}" on Google?`;
    }
    const data = await response.json();
    if (data.extract) {
      // Return the first 2 sentences so it sounds natural spoken out loud
      const sentences = data.extract.split(". ").slice(0, 2).join(". ") + ".";
      return sentences;
    }
    return `I found a page for ${topic}, but no short summary was available.`;
  } catch {
    return "I had trouble connecting to my knowledge base.";
  }
}

// Helper: Optional Gemini AI Brain
async function askAIBrain(prompt) {
  conversationMemory.push({ role: "user", parts: [{ text: prompt }] });
  try {
    const url = `https://googleapis.com{ASSISTANT_CONFIG.geminiApiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: `You are Olivia, a helpful AI assistant. Address the user as ${ASSISTANT_CONFIG.userName}. Keep answers under 3 sentences.` }] },
        contents: conversationMemory
      })
    });
    const data = await response.json();
    const reply = data.candidates.content.parts.text;
    conversationMemory.push({ role: "model", parts: [{ text: reply }] });
    return reply;
  } catch {
    return "My connection to the cloud brain was interrupted.";
  }
}
