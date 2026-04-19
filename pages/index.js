import Head from 'next/head';
import { useState, useRef, useCallback, useEffect } from 'react';

const LOADING_STEPS = [
  { id: 1, label: 'Preprocessing retinal image', icon: '🔬' },
  { id: 2, label: 'Running AI analysis', icon: '🧠' },
  { id: 3, label: 'Identifying pathologies', icon: '🔍' },
  { id: 4, label: 'Generating recommendations', icon: '📋' },
];

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function getUrgencyClass(urgency = '') {
  const u = urgency.toLowerCase();
  if (u === 'immediate') return 'urgency-immediate';
  if (u === 'soon') return 'urgency-soon';
  if (u === 'routine') return 'urgency-routine';
  return 'urgency-normal';
}

function getUrgencyIcon(urgency = '') {
  const u = urgency.toLowerCase();
  if (u === 'immediate') return '🚨';
  if (u === 'soon') return '⚠️';
  if (u === 'routine') return '📅';
  return '✅';
}

function getConfidenceClass(confidence = '') {
  const c = confidence.toLowerCase();
  if (c === 'high') return 'confidence-high';
  if (c === 'moderate') return 'confidence-moderate';
  return 'confidence-low';
}

function getRemedyTypeClass(type = '') {
  const t = type.toLowerCase();
  if (t === 'medical') return 'type-medical';
  if (t === 'lifestyle') return 'type-lifestyle';
  if (t === 'surgical') return 'type-surgical';
  return 'type-monitoring';
}

export default function Home() {
  const [state, setState] = useState('upload'); // upload | preview | loading | results | error
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [doneSteps, setDoneSteps] = useState([]);
  const fileInputRef = useRef(null);
  const stepIntervalRef = useRef(null);

  const handleFile = useCallback((file) => {
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPEG, PNG, WebP).');
      setState('error');
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      setState('preview');
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  }, [handleFile]);

  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);

  const startLoadingSteps = () => {
    setActiveStep(0);
    setDoneSteps([]);
    let step = 0;
    stepIntervalRef.current = setInterval(() => {
      setDoneSteps(prev => [...prev, step]);
      step++;
      setActiveStep(step);
      if (step >= LOADING_STEPS.length) {
        clearInterval(stepIntervalRef.current);
      }
    }, 1800);
  };

  const handleAnalyze = async () => {
    if (!imageFile || !imagePreview) return;
    setState('loading');
    startLoadingSteps();

    try {
      const base64 = imagePreview.split(',')[1];
      const mediaType = imageFile.type;

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mediaType }),
      });

      clearInterval(stepIntervalRef.current);

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Analysis failed');
      }

      const data = await response.json();
      setAnalysis(data.analysis);
      setState('results');
    } catch (err) {
      clearInterval(stepIntervalRef.current);
      setError(err.message || 'Something went wrong. Please try again.');
      setState('error');
    }
  };

  const handleReset = () => {
    setState('upload');
    setImageFile(null);
    setImagePreview(null);
    setAnalysis(null);
    setError('');
    setActiveStep(0);
    setDoneSteps([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  useEffect(() => {
    return () => clearInterval(stepIntervalRef.current);
  }, []);

  return (
    <>
      <Head>
        <title>RetinalAI — Eye Disease Detection</title>
        <meta name="description" content="AI-powered retinal scan analysis for early eye disease detection" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>👁️</text></svg>" />
      </Head>

      <div className="page-wrapper">
        {/* Header */}
        <header className="header">
          <div className="header-logo">
            <div className="logo-icon">👁️</div>
            <span className="logo-text">Retinal<span>AI</span></span>
          </div>
          <div className="header-badge">
            <div className="pulse-dot"></div>
            AI System Online
          </div>
        </header>

        {/* Main */}
        <main className="main">
          {/* Upload state */}
          {state === 'upload' && (
            <>
              <div className="hero">
                <div className="hero-eyebrow">
                  <span>⚡</span> Powered by Claude Vision AI
                </div>
                <h1>Retinal Scan<br /><em>Disease Detection</em></h1>
                <p>Upload a retinal fundus image for instant AI-powered analysis. Identify potential eye diseases, get detailed precautions and treatment recommendations.</p>
              </div>

              <div className="upload-section">
                <div
                  className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  <div className="upload-icon-wrapper">👁️</div>
                  <h3>Drop your retinal scan here</h3>
                  <p>or click to browse from your device</p>
                  <div className="upload-formats">
                    {['JPEG', 'PNG', 'WebP', 'BMP'].map(f => (
                      <span key={f} className="format-tag">{f}</span>
                    ))}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="file-input"
                    accept="image/*"
                    onChange={e => handleFile(e.target.files?.[0])}
                  />
                </div>
              </div>
            </>
          )}

          {/* Preview state */}
          {state === 'preview' && imagePreview && (
            <div className="preview-section">
              <div className="preview-card">
                <div className="preview-header">
                  <div className="preview-title">
                    <span>🔬</span> Retinal Image Ready for Analysis
                  </div>
                  <button className="btn-secondary" onClick={handleReset}>
                    ✕ Change Image
                  </button>
                </div>
                <div className="preview-body">
                  <div className="image-container">
                    <div className="scan-overlay-wrapper">
                      <img
                        src={imagePreview}
                        alt="Retinal scan preview"
                        className="retinal-image"
                      />
                    </div>
                    <div className="image-meta">
                      <div className="meta-row">
                        <span className="meta-label">File Name</span>
                        <span className="meta-value">{imageFile?.name}</span>
                      </div>
                      <div className="meta-row">
                        <span className="meta-label">File Size</span>
                        <span className="meta-value">{formatFileSize(imageFile?.size || 0)}</span>
                      </div>
                      <div className="meta-row">
                        <span className="meta-label">Format</span>
                        <span className="meta-value">{imageFile?.type?.split('/')[1]?.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="preview-actions">
                    <h3>Ready to Analyze</h3>
                    <p>Our AI will examine the retinal image for signs of diseases, abnormalities, and pathological changes.</p>
                    <button className="btn-primary" onClick={handleAnalyze}>
                      <span>🧠</span> Analyze Retinal Scan
                    </button>
                    <button className="btn-secondary" onClick={handleReset}>
                      Upload Different Image
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loading state */}
          {state === 'loading' && (
            <div className="loading-section">
              <div className="scanning-animation">
                <div className="scan-circle scan-circle-1"></div>
                <div className="scan-circle scan-circle-2"></div>
                <div className="scan-circle scan-circle-3"></div>
                <div className="scan-eye">👁️</div>
              </div>
              <h3>Analyzing Retinal Scan</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Our AI model is examining the image for pathological signs
              </p>
              <div className="loading-steps">
                {LOADING_STEPS.map((step, i) => (
                  <div
                    key={step.id}
                    className={`loading-step ${doneSteps.includes(i) ? 'done' : activeStep === i ? 'active' : ''}`}
                  >
                    <span className="step-icon">
                      {doneSteps.includes(i) ? '✓' : activeStep === i ? '⟳' : step.icon}
                    </span>
                    {step.label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error state */}
          {state === 'error' && (
            <div className="error-card">
              <div className="error-icon">⚠️</div>
              <h3>Analysis Failed</h3>
              <p>{error || 'An unexpected error occurred. Please try again with a different image.'}</p>
              <div style={{ marginTop: '24px' }}>
                <button className="btn-primary" onClick={handleReset}>
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Results state */}
          {state === 'results' && analysis && (
            <div className="results-section">
              {/* Diagnosis Banner */}
              <div className={`diagnosis-banner ${getUrgencyClass(analysis.urgency)}`}>
                <div className="diagnosis-main">
                  <h2>
                    {analysis.primaryDiagnosis}
                    <span className={`confidence-pill ${getConfidenceClass(analysis.confidenceLevel)}`}>
                      {analysis.confidenceLevel} Confidence
                    </span>
                  </h2>
                  <p className="diagnosis-description">{analysis.description}</p>
                </div>
                <div className={`urgency-badge ${getUrgencyClass(analysis.urgency)}`}>
                  <div className="urgency-badge-icon">{getUrgencyIcon(analysis.urgency)}</div>
                  <div className="urgency-badge-label">Urgency</div>
                  <div className="urgency-badge-value">{analysis.urgency || 'Routine'}</div>
                </div>
              </div>

              <div className="results-grid">
                {/* Key Findings */}
                {analysis.findings?.length > 0 && (
                  <div className="result-card">
                    <div className="card-header">
                      <div className="card-icon cyan">🔍</div>
                      <span className="card-title">Key Findings</span>
                    </div>
                    <div className="card-body">
                      <div className="findings-list">
                        {analysis.findings.map((f, i) => (
                          <div key={i} className="finding-item">
                            <div className="finding-dot"></div>
                            <span>{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Differential Diagnosis */}
                {analysis.conditions?.length > 0 && (
                  <div className="result-card">
                    <div className="card-header">
                      <div className="card-icon blue">📊</div>
                      <span className="card-title">Differential Diagnosis</span>
                    </div>
                    <div className="card-body">
                      <div className="conditions-list">
                        {analysis.conditions.map((c, i) => (
                          <div key={i} className="condition-item">
                            <div className="condition-header">
                              <span className="condition-name">{c.name}</span>
                              <span className="condition-pct">{c.probability}%</span>
                            </div>
                            <div className="condition-bar">
                              <div
                                className="condition-fill"
                                style={{ width: `${c.probability}%` }}
                              ></div>
                            </div>
                            <div className="condition-desc">{c.description}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Precautions */}
                {analysis.precautions?.length > 0 && (
                  <div className="result-card">
                    <div className="card-header">
                      <div className="card-icon amber">⚠️</div>
                      <span className="card-title">Precautions</span>
                    </div>
                    <div className="card-body">
                      <div className="precautions-list">
                        {analysis.precautions.map((p, i) => (
                          <div key={i} className="precaution-item">
                            <div className="precaution-title">{p.title}</div>
                            <div className="precaution-detail">{p.detail}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Remedies */}
                {analysis.remedies?.length > 0 && (
                  <div className="result-card">
                    <div className="card-header">
                      <div className="card-icon green">💊</div>
                      <span className="card-title">Treatment & Remedies</span>
                    </div>
                    <div className="card-body">
                      <div className="remedies-list">
                        {analysis.remedies.map((r, i) => (
                          <div key={i} className="remedy-item">
                            <div className={`remedy-type-badge ${getRemedyTypeClass(r.type)}`}>{r.type}</div>
                            <div className="remedy-title">{r.title}</div>
                            <div className="remedy-detail">{r.detail}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Disclaimer */}
              <div className="disclaimer-box">
                <div className="disclaimer-icon">⚕️</div>
                <div className="disclaimer-text">
                  <strong>Medical Disclaimer</strong>
                  {analysis.disclaimer || 'This analysis is generated by an AI system for informational and educational purposes only. It does not constitute medical advice, diagnosis, or treatment. Always consult a qualified ophthalmologist or healthcare professional for proper diagnosis and treatment of any eye condition.'}
                </div>
              </div>

              {/* New scan */}
              <div className="new-scan-area">
                <button className="btn-primary" onClick={handleReset}>
                  <span>👁️</span> Analyze Another Scan
                </button>
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="footer">
          <span>© 2025 RetinalAI — For educational & research purposes only</span>
          <div className="footer-links">
            <a href="#" className="footer-link">Privacy Policy</a>
            <a href="#" className="footer-link">Terms of Use</a>
            <a href="#" className="footer-link">About</a>
          </div>
        </footer>
      </div>
    </>
  );
}
