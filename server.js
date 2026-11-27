const express = require("express");
const path = require("path");
const translateHandler = require("./api/translate");

const app = express();
app.use(express.json({ limit: "100kb" }));
app.post("/api/translate", (req, res) => translateHandler(req, res));
app.use(express.static(path.join(__dirname, "public")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`MeetLingo is ready at http://localhost:${port}`);
});
