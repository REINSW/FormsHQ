import { useState, useRef, useEffect } from 'react';
import api from '../utils/api';

/**
 * VoiceButton
 * Props:
 *   context   — 'intake' | 'wizard_principal' | 'wizard_property' | 'wizard_fees' | 'wizard_authority' | 'wizard_trust'
 *   onExtract — callback({ fields }) called with extracted field map
 *   label     — optional button label override
 */
export default function VoiceButton({ context = 'intake', onExtract, label }) {
  const [state, setState] = useState('idle'); // idle | listening | processing | done | error | no_support
  const [transcript, setTranscript] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef('');

  // Check browser support on mount
  const supported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const startListening = () => {
    if (!supported) { setState('no_support'); return; }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-AU';

    finalTranscriptRef.current = '';
    setTranscript('');
    setState('listening');
    setShowModal(true);

    recognition.onresult = (e) => {
      let interim = '';
      let final = finalTranscriptRef.current;
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) { final += t + ' '; }
        else { interim = t; }
      }
      finalTranscriptRef.current = final;
      setTranscript(final + interim);
    };

    recognition.onerror = (e) => {
      console.error('Speech recognition error:', e.error);
      if (e.error === 'no-speech') return; // ignore silence
      setErrorMsg(`Microphone error: ${e.error}`);
      setState('error');
    };

    recognition.onend = () => {
      // Only auto-process if we stopped intentionally (not by error)
      if (state !== 'error' && finalTranscriptRef.current.trim().length > 0) {
        processTranscript(finalTranscriptRef.current.trim());
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    // onend will trigger processTranscript
  };

  const processTranscript = async (text) => {
    if (!text) { setState('idle'); setShowModal(false); return; }
    setState('processing');
    try {
      const res = await api.post('/v1/voice/extract', { transcript: text, context });
      setState('done');
      if (onExtract) onExtract(res.data.fields || {});
      // Auto-close after brief success flash
      setTimeout(() => { setShowModal(false); setState('idle'); setTranscript(''); }, 1500);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to extract fields';
      if (msg.includes('not configured')) {
        setErrorMsg('Claude API key not set up yet — check .env file.');
      } else {
        setErrorMsg(msg);
      }
      setState('error');
    }
  };

  const reset = () => {
    if (recognitionRef.current) { recognitionRef.current.stop(); recognitionRef.current = null; }
    setState('idle');
    setTranscript('');
    setErrorMsg('');
    setShowModal(false);
  };

  if (!supported) {
    return (
      <span title="Voice input requires Chrome or Edge" style={{ fontSize: 12, color: 'var(--fhq-text-muted)', cursor: 'default' }}>
        🎤 Voice not supported in this browser
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => { if (state === 'idle') { startListening(); } else { setShowModal(true); } }}
        title="Fill form by voice"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '7px 14px', borderRadius: 'var(--fhq-radius-sm)',
          border: '1px solid var(--fhq-border)',
          background: state === 'listening' ? '#fee2e2' : 'var(--fhq-surface)',
          color: state === 'listening' ? '#dc2626' : 'var(--fhq-text)',
          cursor: 'pointer', fontSize: 13, fontWeight: 500,
          transition: 'all 0.2s',
        }}>
        <MicIcon pulsing={state === 'listening'} />
        {label || (state === 'listening' ? 'Listening…' : 'Voice input')}
      </button>

      {showModal && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) reset(); }}>
          <div className="modal" style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MicIcon pulsing={state === 'listening'} size={18} />
                {state === 'listening' ? 'Listening…' :
                 state === 'processing' ? 'Extracting fields…' :
                 state === 'done' ? '✓ Fields extracted!' :
                 state === 'error' ? 'Something went wrong' : 'Voice Input'}
              </h2>
              <button onClick={reset} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--fhq-text-muted)' }}>×</button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Instructions */}
              {state === 'listening' && (
                <div style={{ fontSize: 13, color: 'var(--fhq-text-muted)', lineHeight: 1.6 }}>
                  Speak naturally — for example:<br />
                  <em style={{ color: 'var(--fhq-text)' }}>
                    "The owner is Jane Smith, her email is jane@example.com, mobile 0412 345 678,
                    the property is a 3-bedroom house at 14 Example Street Newtown NSW 2042…"
                  </em>
                </div>
              )}

              {/* Live transcript */}
              {(state === 'listening' || state === 'processing') && (
                <div style={{
                  minHeight: 80, padding: '12px 14px',
                  background: 'var(--fhq-surface-muted)', borderRadius: 'var(--fhq-radius-sm)',
                  border: '1px solid var(--fhq-border)',
                  fontSize: 14, lineHeight: 1.6, color: transcript ? 'var(--fhq-text)' : 'var(--fhq-text-muted)',
                  fontStyle: transcript ? 'normal' : 'italic',
                }}>
                  {transcript || 'Start speaking…'}
                </div>
              )}

              {/* Processing spinner */}
              {state === 'processing' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--fhq-text-muted)' }}>
                  <div className="spinner" style={{ width: 16, height: 16 }} />
                  Claude is reading the transcript and extracting form fields…
                </div>
              )}

              {/* Success */}
              {state === 'done' && (
                <div className="alert alert-success">
                  ✓ Form fields have been populated from your speech. Review and adjust as needed.
                </div>
              )}

              {/* Error */}
              {state === 'error' && (
                <div style={{ padding: '12px 14px', background: '#fee2e2', borderRadius: 'var(--fhq-radius-sm)', fontSize: 13, color: '#dc2626' }}>
                  {errorMsg}
                </div>
              )}

              {/* Manual transcript edit (for corrections) */}
              {state === 'error' && transcript && (
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--fhq-text-muted)', display: 'block', marginBottom: 6 }}>
                    Transcript (edit and retry)
                  </label>
                  <textarea className="input" style={{ resize: 'vertical', minHeight: 80, fontSize: 13 }}
                    value={transcript}
                    onChange={e => setTranscript(e.target.value)} />
                </div>
              )}
            </div>

            <div className="modal-footer">
              {state === 'listening' && (
                <>
                  <button type="button" className="btn btn-ghost" onClick={reset}>Cancel</button>
                  <button type="button" className="btn btn-danger" onClick={stopListening}
                    style={{ background: '#dc2626', color: '#fff', border: 'none' }}>
                    ⏹ Stop & extract
                  </button>
                </>
              )}
              {state === 'error' && (
                <>
                  <button type="button" className="btn btn-ghost" onClick={reset}>Cancel</button>
                  <button type="button" className="btn btn-primary"
                    onClick={() => processTranscript(transcript)}>
                    Retry extraction
                  </button>
                </>
              )}
              {(state === 'idle' || state === 'processing' || state === 'done') && state !== 'listening' && (
                <button type="button" className="btn btn-ghost" onClick={reset}>Close</button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MicIcon({ pulsing, size = 14 }) {
  return (
    <span style={{
      display: 'inline-block', width: size, height: size,
      borderRadius: '50%',
      background: pulsing ? '#dc2626' : 'var(--fhq-text-muted)',
      boxShadow: pulsing ? '0 0 0 4px rgba(220,38,38,0.25)' : 'none',
      animation: pulsing ? 'mic-pulse 1.2s ease-in-out infinite' : 'none',
      flexShrink: 0,
    }} />
  );
}
