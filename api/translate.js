module.exports = async function handler(req, res) {
  // Shared handler for Vercel serverless deployment and the local Express server.
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST for translation." });
  }

  try {
    const body = req.body || {};
    const text = String(body.text || "").trim();
    const source = String(body.source || "en").trim();
    const target = String(body.target || "ur").trim();

    if (!text) return res.status(400).json({ error: "Please provide text to translate." });
    if (text.length > 4500) return res.status(413).json({ error: "Text is too long. Please translate a shorter sentence." });

    const params = new URLSearchParams({
      q: text,
      langpair: `${source}|${target}`
    });

    const upstream = await fetch(`https://api.mymemory.translated.net/get?${params.toString()}`, {
      headers: { "Accept": "application/json" }
    });

    if (!upstream.ok) {
      return res.status(502).json({ error: "Translation service is temporarily unavailable." });
    }

    const data = await upstream.json();
    const translated = data && data.responseData && data.responseData.translatedText;

    if (!translated || data.responseStatus === 403 || data.responseStatus === 429) {
      return res.status(502).json({ error: "Translation service limit reached. Please try again later." });
    }

    return res.status(200).json({
      translation: decodeEntities(String(translated)),
      source,
      target
    });
  } catch (error) {
    console.error("Translation error:", error);
    return res.status(500).json({ error: "Could not translate right now. Check your internet connection and try again." });
  }
};

function decodeEntities(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}
