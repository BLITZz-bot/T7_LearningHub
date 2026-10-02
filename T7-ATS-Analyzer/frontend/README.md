# T7 ATS Resume Analyzer — Frontend

Web client for the T7 ATS Resume Analyzer component of the T7 Learning Hub.

## Overview

The ATS Resume Analyzer frontend provides students with an interactive user interface to upload resumes (PDF/DOCX), choose target career roles, view real-time ATS scoring rubrics, and inspect keyword gap analyses and bullet point rewrite suggestions.

## Features

- **Document Upload**: Supports PDF and DOCX resume parsing.
- **Role Alignment**: Match resumes against specific software and engineering job roles.
- **ATS Metrics Dashboard**: Displays parseability, impact quantification, skill match, and formatting scores.
- **Keyword & Bullet Rewrites**: Clear suggestions to convert passive bullet points into high-impact, quantified achievements.

## Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Backend Service**: Connects to the FastAPI / Python backend (`https://t7-learninghub-ats.onrender.com` or local `http://localhost:8000`) and the LangGraph `/api/gemini-agent` orchestrator.

## Development

```bash
# Install dependencies
npm install

# Start local dev server
npm run dev

# Production build
npm run build
```
