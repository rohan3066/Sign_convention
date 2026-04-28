import { useState, useEffect } from 'react';
import { Languages, Mic, Play, Info, Sparkles, Terminal } from 'lucide-react';
import axios from 'axios';
import { AvatarViewer } from './components/AvatarViewer';
import { UI_COLORS } from './lib/AvatarConstants';

function App() {
  const [inputText, setInputText] = useState('');
  const [avatarPoints, setAvatarPoints] = useState<number[][]>([]);
  const [caption, setCaption] = useState('');
  const [status, setStatus] = useState<'IDLE' | 'BUSY'>('IDLE');

  /**
   * ELITE KINEMATIC INTEGRATION v26.0
   * Normalization Map: Ensures base forms are used for animations.
   */
  const lemmatize = (word: string): string => {
    const map: Record<string, string> = {
        'works': 'work',
        'buys': 'buy',
        'playing': 'play',
        'buying': 'buy',
        'working': 'work',
        'hospitalized': 'hospital',
        'nurses': 'nurse',
        'trains': 'train',
        'laptops': 'laptop'
    };
    return map[word] || word;
  };

  const islTransform = (text: string): string[] => {
    const fillers = new Set(["is", "am", "are", "the", "a", "an", "was", "were", "to", "of", "will", "has", "have", "been", "can", "could", "should", "would", "with"]);
    return text.toLowerCase()
               .replace(/[?.,!]/g, '')
               .split(/\s+/)
               .filter(w => w.length > 0 && !fillers.has(w))
               .map(w => lemmatize(w));
  };
  const generateCoordinateClip = (word: string): number[][][] => {
    const frames: number[][][] = [];
    const steps = 25; 
    
    for (let i = 0; i < steps; i++) {
        const t = i / (steps - 1);
        const pts = Array(75).fill(0).map(() => [0.0, 0.0]);
        const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        const swing = Math.sin(t * Math.PI);

        // Core Anatomy (Professional Model Proportions)
        pts[0] = [0.5, 0.22]; 
        let shL = [0.45, 0.44]; let shR = [0.55, 0.44];
        let wrL = [0.44, 0.8]; let wrR = [0.56, 0.8];
        let ebL = [0.38, 0.65]; let ebR = [0.62, 0.65];

        // Specific Pythonic Gestures
        if (word === 'nurse') {
            wrL = [0.5, 0.35 - 0.05 * ease]; // Hand to forehead
            ebL = [0.4, 0.45]; shL = [0.45, 0.46];
        } else if (word === 'hospital') {
            wrL = [0.4, 0.5 + 0.1 * swing]; wrR = [0.6, 0.5 - 0.1 * swing];
            ebL = [0.35, 0.55]; ebR = [0.65, 0.55];
        } else if (word === 'brother') {
            wrL = [0.5, 0.45 + 0.05 * swing]; 
            ebL = [0.42, 0.55];
        } else if (word === 'works' || word === 'buys') {
            const m = 0.12 * swing;
            wrL = [0.44 - m, 0.65]; wrR = [0.56 + m, 0.65];
        } else if (word === 'laptop') {
            const op = 0.12 * ease;
            wrL = [0.4, 0.7 - op]; wrR = [0.6, 0.7 - op];
        } else if (word === 'train') {
            wrL = [0.45 + 0.1 * ease, 0.65]; wrR = [0.55 - 0.1 * ease, 0.7];
        } else if (word === 'late' || word === 'today') {
            wrL = [0.4, 0.8 + 0.1 * ease]; wrR = [0.6, 0.8 + 0.1 * ease];
        } else if (word === 'i') {
            wrL = [0.48, 0.5 + 0.1 * swing]; ebL = [0.4, 0.55]; shL = [0.44, 0.45];
        } else if (word === 'want') {
            const pull = 0.12 * ease;
            wrL = [0.44 - pull, 0.65 + pull]; wrR = [0.56 + pull, 0.65 + pull];
        } else if (word === 'water') {
            wrL = [0.5, 0.4]; ebL = [0.45, 0.55];
        } else {
            wrL = [0.4 + 0.1 * Math.cos(t*Math.PI), 0.75 + 0.15 * swing];
            wrR = [0.6 - 0.1 * swing, 0.75 - 0.15 * Math.cos(t*Math.PI)];
        }

        pts[11] = shL; pts[12] = shR; pts[15] = wrL; pts[16] = wrR;
        pts[13] = ebL; pts[14] = ebR;
        pts[23] = [0.46, 0.95]; pts[24] = [0.54, 0.95];
        pts[33] = wrL; pts[54] = wrR;

        // FINGER RIG (Stabilized Anatonomy)
        [33, 54].forEach((start) => {
            const wrist = pts[start];
            for (let j = 1; j < 21; j++) {
                const fid = Math.floor((j - 1) / 4), rid = (j - 1) % 4;
                pts[start + j] = [wrist[0] + (fid-2)*0.015, wrist[1] - (rid+1)*0.022];
            }
        });
        
        frames.push(pts);
    }
    return frames;
  };

  const playSequence = async () => {
    if (!inputText) return;
    setStatus('BUSY');
    const words = islTransform(inputText);
    
    for (const word of words) {
        setCaption(word);
        let clip: number[][][] | null = null;
        try {
            // Try fetching from backend (Spring Boot API)
            const res = await axios.get(`http://localhost:8080/api/avatar/ISL/${word}`, { timeout: 1500 });
            clip = Array.isArray(res.data) ? res.data : JSON.parse(res.data);
        } catch (err) {
            console.log(`Backend missing '${word}', using procedural generator...`);
            clip = generateCoordinateClip(word);
        }

        if (clip) {
            for (const frame of clip) {
                setAvatarPoints(frame);
                // Adjust delay to match Python's 30ms target, considering React re-render overhead
                await new Promise(r => setTimeout(r, 40)); 
            }
            // Natural pause between words
            await new Promise(r => setTimeout(r, 350)); 
        }
    }
    setCaption('');
    setAvatarPoints([]);
    setStatus('IDLE');
  };

  return (
    <div className="app-container">
      <header className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: '#3b82f6', width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(59,130,246,0.3)' }}>
            <Terminal color="white" size={24} />
          </div>
          <h1>SIGN CONVETION v2.0</h1>
        </div>
        <div className={`status-badge ${status === 'IDLE' ? 'status-ready' : 'status-busy'}`}>
          {status}
        </div>
      </header>

      <main className="main-content">
        <aside className="panel panel-left" style={{ background: '#0e1117' }}>
          <div className="avatar-controls">
            <h3 style={{ marginBottom: '1.2rem', color: '#3b82f6', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px' }}>Animation Protocol Restored</h3>
            <textarea 
              className="text-input" 
              rows={5} 
              placeholder="Try: 'nurse works at hospital' or 'train is late today'..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem', marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" disabled={status === 'BUSY'}><Mic size={18} /> Voice</button>
              <button className="btn btn-primary" onClick={playSequence} disabled={status === 'BUSY'} style={{ background: '#3b82f6' }}><Play size={18} /> Execute</button>
            </div>

            <div style={{ marginTop: '2.5rem', padding: '1.5rem', background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.1)', borderRadius: '18px', fontSize: '0.8rem', color: '#94a3b8' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.8rem', color: '#3b82f6', fontWeight: '800' }}>
                <Info size={14} /> KINEMATIC RIG ENHANCED
              </div>
              Animation protocol restored from <b>Python Legacy Code</b>. Full vocabulary for Nurse, Hospital, Laptop, and Train now active with anatomical coordination.
            </div>
          </div>
        </aside>

        <section className="panel panel-right">
          <AvatarViewer points={avatarPoints} caption={caption} />
        </section>
      </main>
    </div>
  );
}

export default App;
