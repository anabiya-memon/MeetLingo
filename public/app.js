const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const clearBtn = document.getElementById("clearBtn");
const suggestBtn = document.getElementById("suggestBtn");
const transcriptEl = document.getElementById("transcript");
const translationEl = document.getElementById("translation");
const statusText = document.getElementById("statusText");
const statusDot = document.getElementById("statusDot");
const notice = document.getElementById("notice");

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let listening = false;
let finalText = "";
let translationQueue = Promise.resolve();
let latestSentence = "";

function setStatus(active, message) {
  statusText.textContent = message;
  statusDot.classList.toggle("active", active);
}

function showTranscript() {
  transcriptEl.classList.toggle("empty-state", !finalText);
  transcriptEl.textContent = finalText || "Your English speech will appear here when you start listening.";
}

async function translateSentence(sentence) {
  const response = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: sentence, source: "en", target: "ur" })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Translation failed.");
  return data.translation;
}

function queueTranslation(sentence) {
  if (!sentence || sentence.trim().length < 2) return;
  latestSentence = sentence.trim();
  translationQueue = translationQueue.then(async () => {
    try {
      translationEl.classList.remove("empty-state");
      translationEl.textContent = "ترجمہ ہو رہا ہے...";
      const translated = await translateSentence(sentence.trim());
      translationEl.textContent = translated || "ترجمہ دستیاب نہیں۔";
    } catch (error) {
      translationEl.textContent = `ترجمہ نہیں ہو سکا: ${error.message}`;
      notice.textContent = "Translation service is unavailable or has reached its limit. Please try again shortly.";
    }
  });
}

function startListening() {
  if (!SpeechRecognition) {
    notice.textContent = "Speech recognition is not supported in this browser. Please use the latest Chrome or Edge.";
    return;
  }
  if (listening) return;

  recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    listening = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    setStatus(true, "Listening to microphone");
    notice.textContent = "Listening in English. Your microphone may hear both the meeting audio and your own voice.";
  };

  recognition.onresult = (event) => {
    let interim = "";
    let newlyFinal = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const phrase = event.results[i][0].transcript.trim();
      if (event.results[i].isFinal && phrase) {
        newlyFinal += phrase + " ";
      } else {
        interim += phrase + " ";
      }
    }
    if (newlyFinal.trim()) {
      finalText += (finalText ? " " : "") + newlyFinal.trim();
      showTranscript();
      queueTranslation(newlyFinal);
    }
    if (interim.trim()) {
      transcriptEl.classList.remove("empty-state");
      transcriptEl.textContent = (finalText ? finalText + " " : "") + interim.trim();
    } else {
      showTranscript();
    }
  };

  recognition.onerror = (event) => {
    const messages = {
      "not-allowed": "Microphone permission was blocked. Allow microphone access in your browser.",
      "no-speech": "No speech detected. Check microphone volume and try again.",
      "audio-capture": "No microphone was found. Check your microphone connection.",
      "network": "Speech recognition needs an internet connection."
    };
    notice.textContent = messages[event.error] || `Speech recognition issue: ${event.error}`;
  };

  recognition.onend = () => {
    listening = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    setStatus(false, "Microphone is off");
  };

  try {
    recognition.start();
  } catch (error) {
    notice.textContent = "Could not start microphone. Please wait a moment and try again.";
  }
}

function stopListening() {
  if (recognition && listening) recognition.stop();
}

function makeSuggestions(text) {
  const t = text.toLowerCase();
  let simple = "Thank you for explaining. I understand.";
  let professional = "Thank you for the clarification. I understand your point and will take it into consideration.";

  if (/\b(question|any questions|queries)\b/.test(t)) {
    simple = "Yes, I have one question. Could you please explain that part again?";
    professional = "Thank you. I do have a question regarding this point. Could you please clarify it further?";
  } else if (/\b(deadline|when can|by when|timeline)\b/.test(t)) {
    simple = "I can work on this and share an update soon.";
    professional = "I can take ownership of this and will confirm a realistic timeline shortly.";
  } else if (/\b(price|cost|budget|payment)\b/.test(t)) {
    simple = "I will review the details and get back to you.";
    professional = "I will review the pricing details carefully and follow up with a clear response.";
  } else if (/\b(problem|issue|error|not working)\b/.test(t)) {
    simple = "I understand the issue. I will check it and update you.";
    professional = "I understand the concern. I will investigate the issue and share an update with the next steps.";
  } else if (/\b(send|share|email|document|file)\b/.test(t)) {
    simple = "Sure, I will share it with you.";
    professional = "Certainly. I will prepare the relevant information and share it with you shortly.";
  } else if (/\b(agree|sounds good|okay|fine)\b/.test(t)) {
    simple = "That sounds good to me. Thank you.";
    professional = "That works for me. Thank you for confirming.";
  } else if (/\b(introduce|about yourself|your experience)\b/.test(t)) {
    simple = "I am learning and improving my skills, and I am happy to discuss my experience.";
    professional = "I am continuously developing my skills and would be pleased to share more about my experience and relevant work.";
  }
  document.getElementById("simpleReply").textContent = simple;
  document.getElementById("professionalReply").textContent = professional;
}

startBtn.addEventListener("click", startListening);
stopBtn.addEventListener("click", stopListening);
clearBtn.addEventListener("click", () => {
  finalText = "";
  latestSentence = "";
  showTranscript();
  translationEl.textContent = "آپ کا اردو ترجمہ یہاں نظر آئے گا۔";
  translationEl.classList.add("empty-state");
  document.getElementById("simpleReply").textContent = "Start listening, then select “Suggest replies”.";
  document.getElementById("professionalReply").textContent = "A more polished response will appear here.";
  notice.textContent = "Transcript cleared.";
});
suggestBtn.addEventListener("click", () => {
  const text = finalText || latestSentence;
  if (!text) {
    notice.textContent = "Start listening first so MeetLingo has some conversation text.";
    return;
  }
  makeSuggestions(text);
});
document.querySelectorAll(".copy-btn").forEach(button => {
  button.addEventListener("click", async () => {
    const text = document.getElementById(button.dataset.copy).textContent;
    try {
      await navigator.clipboard.writeText(text);
      button.textContent = "Copied!";
      setTimeout(() => button.textContent = "Copy reply", 1400);
    } catch {
      notice.textContent = "Copy was blocked by your browser. Select the reply text and copy it manually.";
    }
  });
});

if (!SpeechRecognition) {
  notice.textContent = "This browser may not support speech recognition. Please open MeetLingo in the latest Chrome or Edge.";
}
