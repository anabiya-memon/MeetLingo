const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const listenBadge = document.getElementById('listenBadge');
const listenMessage = document.getElementById('listenMessage');
const micVisual = document.getElementById('micVisual');
const emptyState = document.getElementById('emptyState');
const captionsList = document.getElementById('captionsList');
const interimRow = document.getElementById('interimRow');
const interimText = document.getElementById('interimText');
const sessionClock = document.getElementById('sessionClock');
const sentenceCount = document.getElementById('sentenceCount');
const manualForm = document.getElementById('manualForm');
const manualInput = document.getElementById('manualInput');
const charCount = document.getElementById('charCount');
const manualResult = document.getElementById('manualResult');
const translateBtn = document.getElementById('translateBtn');
const toast = document.getElementById('toast');

let recognition = null;
let isListening = false;
let startedAt = null;
let clockInterval = null;
let translationQueue = Promise.resolve();
let count = 0;
let toastTimer = null;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3600);
}

function setListening(active) {
  isListening = active;
  startBtn.disabled = active;
  stopBtn.disabled = !active;
  listenBadge.className = `state-badge ${active ? 'live' : 'idle'}`;
  listenBadge.innerHTML = active ? '<i></i> Listening' : '<i></i> Not listening';
  listenMessage.textContent = active
    ? 'Listening for English speech from your meeting…'
    : 'Your microphone is ready when you are.';
  micVisual.classList.toggle('is-live', active);
  if (active && !startedAt) {
    startedAt = Date.now();
    clockInterval = setInterval(updateClock, 1000);
  }
}

function updateClock() {
  if (!startedAt) return;
  const total = Math.floor((Date.now() - startedAt) / 1000);
  const minutes = String(Math.floor(total / 60)).padStart(2, '0');
  const seconds = String(total % 60).padStart(2, '0');
  sessionClock.textContent = `${minutes}:${seconds}`;
}

function stopClock() {
  clearInterval(clockInterval);
  clockInterval = null;
}

function decodeHtml(value) {
  const element = document.createElement('textarea');
  element.innerHTML = value;
  return element.value;
}

function addCaptionRow(english, translation = 'Translating…') {
  emptyState.classList.add('hidden');
  const row = document.createElement('article');
  row.className = 'caption-row';
  const englishCell = document.createElement('div');
  englishCell.className = 'caption-cell';
  const englishMeta = document.createElement('span');
  englishMeta.className = 'caption-meta';
  englishMeta.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const englishText = document.createElement('span');
  englishText.textContent = english;
  englishCell.append(englishMeta, englishText);

  const urduCell = document.createElement('div');
  urduCell.className = 'caption-cell pending';
  urduCell.dir = 'rtl';
  urduCell.textContent = translation;
  row.append(englishCell, urduCell);
  captionsList.appendChild(row);
  captionsList.scrollTop = captionsList.scrollHeight;
  count += 1;
  sentenceCount.textContent = `${count} ${count === 1 ? 'sentence' : 'sentences'}`;
  return urduCell;
}

async function requestTranslation(text) {
  const response = await fetch('/api/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Translation failed. Please try again.');
  return decodeHtml(data.translation || '');
}

function queueTranslation(text, onSuccess, onError) {
  translationQueue = translationQueue
    .then(async () => {
      const result = await requestTranslation(text);
      onSuccess(result);
    })
    .catch((error) => {
      onError(error);
    });
  return translationQueue;
}

function addSpeechSentence(text) {
  const cleanText = text.trim();
  if (!cleanText) return;
  const translationCell = addCaptionRow(cleanText);
  queueTranslation(cleanText,
    (translated) => {
      translationCell.classList.remove('pending');
      translationCell.textContent = translated;
    },
    (error) => {
      translationCell.classList.remove('pending');
      translationCell.textContent = `Translation unavailable: ${error.message}`;
      showToast(error.message);
    }
  );
}

function startListening() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    showToast('Live speech recognition needs Google Chrome or Microsoft Edge on a computer.');
    return;
  }
  if (!recognition) {
    recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setListening(true);
    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) addSpeechSentence(text);
        else interim += text;
      }
      interimText.textContent = interim || 'Listening…';
      interimRow.classList.toggle('hidden', !interim);
    };
    recognition.onerror = (event) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setListening(false);
        showToast('Microphone permission was blocked. Allow microphone access in your browser settings.');
      } else if (event.error === 'audio-capture') {
        setListening(false);
        showToast('No microphone was found. Check your Windows input device.');
      } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
        showToast(`Speech recognition: ${event.error}`);
      }
    };
    recognition.onend = () => {
      if (isListening) {
        try { recognition.start(); } catch (_) { /* The browser may still be closing the previous session. */ }
      } else {
        setListening(false);
        interimRow.classList.add('hidden');
      }
    };
  }

  try {
    recognition.start();
    setListening(true);
    showToast('Listening started. Allow microphone access if your browser asks.');
  } catch (error) {
    if (error.name === 'InvalidStateError') return;
    showToast('Could not start the microphone. Please check browser permissions.');
  }
}

function stopListening() {
  setListening(false);
  interimRow.classList.add('hidden');
  if (recognition) {
    try { recognition.stop(); } catch (_) { /* Already stopped. */ }
  }
  stopClock();
}

startBtn.addEventListener('click', startListening);
stopBtn.addEventListener('click', stopListening);

document.getElementById('clearBtn').addEventListener('click', () => {
  captionsList.innerHTML = '';
  count = 0;
  sentenceCount.textContent = '0 sentences';
  emptyState.classList.remove('hidden');
  showToast('This screen’s translation history has been cleared.');
});

manualInput.addEventListener('input', () => {
  charCount.textContent = `${manualInput.value.length} / 500 characters`;
});

manualForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const text = manualInput.value.trim();
  if (!text) {
    showToast('Please type or paste an English sentence first.');
    manualInput.focus();
    return;
  }
  translateBtn.disabled = true;
  translateBtn.textContent = 'Translating…';
  manualResult.classList.remove('hidden');
  manualResult.textContent = 'ترجمہ ہو رہا ہے…';
  try {
    manualResult.textContent = await requestTranslation(text);
  } catch (error) {
    manualResult.textContent = error.message;
    showToast(error.message);
  } finally {
    translateBtn.disabled = false;
    translateBtn.innerHTML = 'Translate <span>→</span>';
  }
});

// The server is local; this check lets the page show a useful error if it was opened as a file.
fetch('/api/health').catch(() => showToast('Please open this app through http://localhost:3000, not by double-clicking index.html.'));

window.addEventListener('beforeunload', () => {
  if (recognition) {
    isListening = false;
    try { recognition.stop(); } catch (_) { /* Ignore shutdown errors. */ }
  }
  stopClock();
});
