// server.js
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: "50mb" }));

// This endpoint receives the FULL Gemini response
// and extracts + returns the image automatically
app.post("/extract-image", (req, res) => {
    try {
        const geminiResponse = req.body;

        // Support both { data: { candidates: [...] } } and { candidates: [...] }
        const candidates = geminiResponse?.data?.candidates || geminiResponse?.candidates;

        if (!candidates || candidates.length === 0) {
            return res.status(400).json({ error: "No candidates found" });
        }

        const parts = candidates[0]?.content?.parts;

        if (!parts) {
            return res.status(400).json({ error: "No parts found" });
        }

        // Dynamically find inlineData — works regardless of index
        const imagePart = parts.find(part => part.inlineData);

        if (!imagePart) {
            return res.status(400).json({ error: "No inlineData found in parts" });
        }

        const base64Data = imagePart.inlineData.data;
        const mimeType = imagePart.inlineData.mimeType || "image/png";
        const ext = mimeType.split("/")[1];
        const buffer = Buffer.from(base64Data, "base64");

        res.setHeader("Content-Type", mimeType);
        res.setHeader("Content-Disposition", `attachment; filename=output.${ext}`);
        res.send(buffer);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(port, () => console.log(`Server running on port ${port}`));
