import { useState } from 'react';

const emptyResult = {
  matchPercentage: 0,
  matchedSkills: [],
  missingSkills: [],
  strengths: [],
  suggestions: [],
  interviewQuestions: [],
};

function ResultCard({ title, items, emptyText, tone = '' }) {
  return (
    <section className={`result-card ${tone}`}>
      <h3>{title}</h3>
      {items.length ? (
        <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>
      ) : (
        <p className="placeholder">{emptyText}</p>
      )}
    </section>
  );
}

export default function App() {
  const [resume, setResume] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [result, setResult] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setResult(null);
    setExtractedText('');

    if (!resume) {
      setError('Choose a resume PDF to continue.');
      return;
    }
    if (resume.type !== 'application/pdf' && !resume.name.toLowerCase().endsWith('.pdf')) {
      setError('Please choose a PDF file.');
      return;
    }
    if (!jobDescription.trim()) {
      setError('Paste a job description to continue.');
      return;
    }

    setLoading(true);
    setLoadingStage('extracting');
    try {
      const formData = new FormData();
      formData.append('resume', resume);

      const extractionResponse = await fetch('/api/extract-pdf', {
        method: 'POST',
        body: formData,
      });
      const extractionData = await extractionResponse.json();
      if (!extractionResponse.ok) {
        throw new Error(extractionData.message || 'Could not extract text from this PDF.');
      }

      setExtractedText(extractionData.text);

      setLoadingStage('analyzing');
      const analysisResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: extractionData.text, jobDescription }),
      });
      const analysisData = await analysisResponse.json();
      if (!analysisResponse.ok) throw new Error(analysisData.message || 'AI analysis could not be completed.');
      setResult(analysisData);
    } catch (requestError) {
      setError(requestError.message || 'Could not connect to the server. Is it running?');
    } finally {
      setLoading(false);
      setLoadingStage('');
    }
  }

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Matchwise home">
          <span className="brand-mark" aria-hidden="true">m</span>
          <span>matchwise<span className="brand-dot">.</span></span>
        </a>
        <span className="topbar-note"><span className="status-dot" /> Resume insights</span>
      </header>

      <section className="hero" id="top">
        <div className="eyebrow"><span className="sparkle">✳</span> YOUR NEXT OPPORTUNITY, IN FOCUS</div>
        <h1>AI Resume &amp; Job<br /><span>Match Analyzer</span></h1>
        <p className="hero-copy">See how your experience lines up with the role you want.<br className="desktop-break" /> Get a clearer picture of your strengths and what to work on.</p>
      </section>

      <section className="workspace" aria-label="Resume and job match analysis">
        <div className="form-panel">
          <div className="section-heading">
            <div><span className="step-label">01 — GET STARTED</span><h2>Bring the details</h2></div>
            <span className="required-note">Both fields required</span>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <label className="field-label" htmlFor="resume">Your resume <span>PDF</span></label>
            <label className={`upload-box ${resume ? 'has-file' : ''}`} htmlFor="resume">
              <input id="resume" type="file" accept="application/pdf,.pdf" onChange={(event) => setResume(event.target.files?.[0] || null)} />
              <span className="upload-icon" aria-hidden="true">↑</span>
              <span className="upload-copy"><strong>{resume ? resume.name : 'Choose a resume PDF'}</strong><small>{resume ? 'PDF selected' : 'Click to browse files'}</small></span>
              <span className="browse-button">Browse</span>
            </label>
            <label className="field-label job-label" htmlFor="job-description">Job description <span>PASTE BELOW</span></label>
            <textarea id="job-description" value={jobDescription} onChange={(event) => setJobDescription(event.target.value)} placeholder="Paste the role description you’re interested in…" rows="7" />
            <div className="form-footer">
              <span className="privacy-note"><span aria-hidden="true">◇</span> Not stored by this app</span>
              <button type="submit" disabled={loading}>
                {loading ? <><span className="spinner" /> {loadingStage === 'extracting' ? 'Reading PDF…' : 'Analyzing…'}</> : <>Analyze Resume <span aria-hidden="true">↗</span></>}
              </button>
            </div>
            {error && <p className="error-message" role="alert">{error}</p>}
            {loading && <p className="loading-message" role="status">{loadingStage === 'extracting' ? 'Extracting text from your resume…' : 'Gemini is comparing your resume with the job description…'}</p>}
          </form>
        </div>

        <aside className="preview-panel">
          <div className="preview-heading"><span className="step-label">02 — YOUR SNAPSHOT</span><span className="preview-sparkle">✳</span></div>
          <div className="match-summary">
            <div className="score-ring" style={{ '--score': `${result?.matchPercentage ?? 0}%` }}><div><strong>{result ? `${result.matchPercentage}%` : '—'}</strong><small>match</small></div></div>
            <div className="score-copy"><strong>{result ? 'Your snapshot is ready' : 'Your match at a glance'}</strong><span>{result ? 'A first look at your role fit.' : 'Your results will take shape here.'}</span></div>
          </div>
          <div className="preview-divider" />
          <div className="skill-preview">
            <div className="skill-row"><span>Skills in common</span><span className="mini-badge green">{result ? result.matchedSkills.length : '—'}</span></div>
            {result ? <div className="skill-chips">{result.matchedSkills.map((skill) => <span key={skill}>{skill}</span>)}</div> : <div className="skeleton-lines"><i /><i /><i /></div>}
            <div className="skill-row missing-row"><span>Room to grow</span><span className="mini-badge amber">{result ? result.missingSkills.length : '—'}</span></div>
            {result ? <div className="skill-chips missing-chips">{result.missingSkills.map((skill) => <span key={skill}>{skill}</span>)}</div> : <div className="skeleton-lines short"><i /><i /></div>}
          </div>
          <div className="preview-tip"><span className="tip-icon">✦</span><p>{result ? 'Use these insights to guide your next application.' : 'A thoughtful application starts with understanding the role.'}</p></div>
        </aside>
      </section>

      <section className="details-section" aria-live="polite">
        <div className="details-heading"><div><span className="step-label">03 — THE DETAILS</span><h2>{result ? 'Your role-fit notes' : 'Your insights, all in one place'}</h2></div><span className="coming-label">{result ? 'GEMINI ANALYSIS' : 'READY WHEN YOU ARE'}</span></div>
        <div className="results-grid">
          <ResultCard title="Your strengths" items={result?.strengths || emptyResult.strengths} emptyText="Your standout experience will appear here." />
          <ResultCard title="Ideas to strengthen your application" items={result?.suggestions || emptyResult.suggestions} emptyText="Practical suggestions will appear here." tone="warm" />
          <ResultCard title="Interview practice" items={result?.interviewQuestions || emptyResult.interviewQuestions} emptyText="Role-specific questions will appear here." tone="lavender" />
        </div>
        {extractedText && (
          <section className="extracted-preview">
            <div className="extracted-heading">
              <div><span className="step-label">RESUME TEXT</span><h3>Extracted text preview</h3></div>
              <span>Showing {Math.min(extractedText.length, 2000)} of {extractedText.length} characters</span>
            </div>
            <pre>{extractedText.slice(0, 2000)}</pre>
          </section>
        )}
        <p className="demo-note">The resume preview shows up to 2,000 characters. Gemini analyzes the extracted text with the job description.</p>
      </section>

      <footer><span>matchwise<span className="brand-dot">.</span></span><span>Made for your next chapter.</span></footer>
    </main>
  );
}
