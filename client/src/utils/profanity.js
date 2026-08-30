// Text validation and lightweight profanity filter

const PROFANITY_LIST = [
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "bastard",
  "cunt",
  "dick",
  "pussy",
  "whore",
  "nigger",
  "faggot",
];

// Starter prompt ideas for players who need an idea
export const STARTER_PROMPTS = [
  "A astronaut riding a giant dinosaur",
  "A cat wearing sunglasses on a skateboard",
  "Pizza party on the moon",
  "A superhero chef burning pancakes",
  "A robot trying to eat spaghetti",
  "A penguin surfing on a wave",
  "A detective dog looking for a bone",
  "A dragon trying to blow out birthday candles",
  "A monkey playing a guitar",
  "A alien drinking boba tea",
];

export function getRandomStarterPrompt() {
  const randomIndex = Math.floor(Math.random() * STARTER_PROMPTS.length);
  return STARTER_PROMPTS[randomIndex];
}

export function validateText(text) {
  if (!text || typeof text !== "string") {
    return { valid: false, error: "Text cannot be empty" };
  }

  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: "Please enter a valid phrase or guess" };
  }

  if (trimmed.length > 80) {
    return { valid: false, error: "Text is too long (max 80 characters)" };
  }

  return { valid: true, cleanText: trimmed };
}

export function sanitizeProfanity(text) {
  if (!text) return text;
  let cleaned = text;

  PROFANITY_LIST.forEach((word) => {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    cleaned = cleaned.replace(regex, "*".repeat(word.length));
  });

  return cleaned;
}
