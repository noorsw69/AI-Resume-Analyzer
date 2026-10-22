# AI Resume & Job Match Analyzer

A simple full-stack portfolio MVP. Step 1 created the React/Vite UI and Express API. Step 2 added in-memory PDF text extraction. Step 3 sends the extracted resume text and job description to Gemini and displays its structured analysis.

## Requirements

- Node.js 20.19+ or 22.12+ (Node.js 24 also works)
- npm
- A Gemini API key configured on the backend

## Configure the Gemini API key

Open `server/.env` and set the `GEMINI_API_KEY` variable to your own key. The backend loads it with dotenv; it is only read by the server. `server/.env.example` contains an empty placeholder and can be used as a reference.

Never commit `server/.env` or put the key in frontend files, frontend environment variables, source control, screenshots, or logs. `server/.gitignore` excludes `.env` files. If a key is exposed, revoke it and create a replacement in Google AI Studio.

## Install dependencies

From the project root, install the backend and frontend packages separately:

```bash
cd server
npm install
cd ../client
npm install
```

On Windows PowerShell, use `npm.cmd` instead of `npm` if the PowerShell execution policy blocks the npm script.

## Run the backend

In a terminal from the project root:

```bash
cd server
npm run dev
```

The API runs at `http://localhost:5000`. Check its health at `http://localhost:5000/api/health`.

## Run the frontend

Open a second terminal from the project root:

```bash
cd client
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`. The Vite development server proxies `/api` calls to the backend.

## How analysis works

1. React sends the selected PDF to `POST /api/extract-pdf` as multipart form data.
2. Multer holds the PDF in memory. The backend checks it and `pdf-parse` extracts selectable text.
3. React preserves that full extracted text for analysis while showing only its first 2,000 characters in the preview.
4. React sends the full extracted resume text and the job description as JSON to `POST /api/analyze`.
5. The Express backend uses the official `@google/genai` SDK and the Gemini `gemini-3.8-flash` model. The API key stays on the server.
6. Gemini is prompted to compare evidence in the two texts and return a JSON object. The backend parses and validates it, then React displays the match percentage, skills, strengths, suggestions, and five interview questions.

The Gemini result is an AI-generated estimate. Review it before making career decisions. The score is not an objective hiring assessment.

## API endpoints

- `GET /api/health` returns server status.
- `POST /api/extract-pdf` accepts one PDF in the `resume` multipart field and returns its filename and extracted text.
- `POST /api/analyze` accepts JSON with `resumeText` and `jobDescription`; it returns `matchPercentage`, `matchedSkills`, `missingSkills`, `strengths`, `suggestions`, and `interviewQuestions`.

## Limitations

- Resume uploads are limited to 10 MB and are held in memory, not saved by this app to disk.
- Text extraction does not include OCR, so image-only scanned resumes have no selectable text to analyze.
- The extracted text is limited to 100,000 characters and the job description to 50,000 characters per analysis request.
- Gemini requires a valid API key, network access, and available quota. Service or quota errors are returned as a general message without exposing the key or provider details.
- No authentication, database, deployment, or long-term storage is included.
