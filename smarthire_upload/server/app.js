require('dotenv').config(); // Load .env file first

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const { CohereClient } = require('cohere-ai');

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY,
});

app.post('/analyze', upload.single('resume'), async (req, res) => {
  const file = req.file;
  const dataBuffer = fs.readFileSync(file.path);

  try {
    const pdfData = await pdfParse(dataBuffer);
    const resumeText = pdfData.text;

    const prompt = `Analyze this resume:\n\n${resumeText}\n\n1. Give feedback on grammar, formatting, skill gaps, and how to improve it for a software development job.\n2. Extract the top 5 skills or keywords from the resume.\n3. Give an ATS score out of 100 (based on formatting, keyword relevance, etc).`;

    const gptRes = await cohere.generate({
      model: "command",
      prompt,
      max_tokens: 600,
      temperature: 0.7,
    });

    const aiText = gptRes.generations[0].text;

    const jobMatches = [];
    const lowerText = resumeText.toLowerCase();

    const jobKeywords = {
      "Frontend Developer": ["html", "css", "javascript", "react"],
      "Backend Developer": ["node.js", "express", "mongodb", "api"],
      "Full Stack Developer": ["frontend", "backend", "api", "database"],
      "Data Analyst": ["excel", "python", "data", "analysis", "sql"],
      "DevOps Engineer": ["docker", "kubernetes", "aws", "ci/cd"]
    };

    for (const [jobTitle, keywords] of Object.entries(jobKeywords)) {
      const matches = keywords.filter(kw => lowerText.includes(kw));
      if (matches.length >= 2) {
        jobMatches.push(jobTitle);
      }
    }

    res.json({
      feedback: aiText,
      jobMatches: jobMatches.length ? jobMatches : ["No strong job match found."]
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error analyzing resume");
  } finally {
    fs.unlinkSync(file.path);
  }
});

app.listen(3000, () => console.log('✅ SmartHire server running at http://localhost:3000'));
