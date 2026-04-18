import { useState, useEffect } from 'react';
import { Languages, Video, Mic, Play, Info } from 'lucide-react';
import axios from 'axios';
import { AvatarViewer } from './components/AvatarViewer';
import { SignRecognizer } from './components/SignRecognizer';
import { UI_COLORS } from './lib/AvatarConstants';

type Tab = 'avatar' | 'webcam';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('avatar');
  const [inputText, setInputText] = useState('');
  const [avatarPoints, setAvatarPoints] = useState<number[][]>([]);
  const [caption, setCaption] = useState('');
  const [status, setStatus] = useState<'IDLE' | 'BUSY' | 'ERROR'>('IDLE');

  const playSign = async () => {
    if (!inputText) return;
    setStatus('BUSY');
    try {
      // Split text into words and process each (simplified ISL transform)
      const words = inputText.toLowerCase().replace(/[?.,!]/g, '').split(' ');
      
      for (const word of words) {
        setCaption(word);
        const response = await axios.get(`http://localhost:8080/api/avatar/ISL/${word}`);
        const frames = response.data;
        
        // Play frames at 30fps
        for (const frame of frames) {
          setAvatarPoints(frame);
          await new Promise(r => setTimeout(r, 33));
        }
        await new Promise(r => setTimeout(r, 100)); // Gap between words
      }
      setCaption('');
      setAvatarPoints([]);
      setStatus('IDLE');
    } catch (err) {
      console.error(err);
      setStatus('ERROR');
      setTimeout(() => setStatus('IDLE'), 2000);
    }
  };

  const startSpeech = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.onstart = () => setStatus('BUSY');
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
      setStatus('IDLE');
    };
    recognition.onerror = () => setStatus('ERROR');
    recognition.start();
  };

  return (
    <div className="app-container">
      <header className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: UI_COLORS.accent, width: 40, height: 40, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Languages color="white" size={24} />
          </div>
          <h1>SIGN CONVENTION</h1>
        </div>
        <div className={`status-badge ${status === 'IDLE' ? 'status-ready' : status === 'BUSY' ? 'status-busy' : 'status-error'}`}>
          {status}
        </div>
      </header>

      <main className="main-content">
        <aside className="panel panel-left">
          <div className="tabs">
            <div className={`tab ${activeTab === 'avatar' ? 'active' : ''}`} onClick={() => setActiveTab('avatar')}>
              Avatar
            </div>
            <div className={`tab ${activeTab === 'webcam' ? 'active' : ''}`} onClick={() => setActiveTab('webcam')}>
              Webcam
            </div>
          </div>

          {activeTab === 'avatar' ? (
            <div className="avatar-controls">
              <h3 style={{ marginBottom: '1rem', color: UI_COLORS.accent }}>Text to Sign</h3>
              <div className="input-group">
                <label>English Sentence</label>
                <textarea 
                  className="text-input" 
                  rows={4} 
                  placeholder="Type a sentence to see it in sign language..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <button className="btn btn-secondary" onClick={startSpeech}>
                  <Mic size={18} /> Voice
                </button>
                <button className="btn btn-primary" onClick={playSign} disabled={status === 'BUSY'}>
                  <Play size={18} /> Play
                </button>
              </div>

              <div style={{ marginTop: '2rem', padding: '1rem', background: '#252525', borderRadius: '8px', fontSize: '0.85rem', color: '#888' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#aaa' }}>
                  <Info size={14} /> Tips
                </div>
                Try phrases like "hello", "actor", or "aeroplane". Ensure the backend is running.
              </div>
            </div>
          ) : (
            <div className="recognition-controls">
              <h3 style={{ marginBottom: '1rem', color: UI_COLORS.accent_2 }}>Sign to Text</h3>
              <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '2rem' }}>
                Perform a sign in front of the camera and stop recording to identify it.
              </p>
              
              <div style={{ padding: '1rem', border: '1px dashed #444', borderRadius: '8px', textAlign: 'center' }}>
                <Video size={32} color="#444" style={{ marginBottom: '0.5rem' }} />
                <div style={{ fontSize: '0.8rem', color: '#666' }}>Camera strictly required</div>
              </div>
            </div>
          )}
        </aside>

        <section className="panel panel-right">
          {activeTab === 'avatar' ? (
            <AvatarViewer points={avatarPoints} caption={caption} />
          ) : (
            <SignRecognizer />
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
