import { useState, useEffect, useRef } from 'react'
import './JaaduKeyboard.css'
import OrbitalVisual from './OrbitalVisual'
import FlatSurfaceVisual from './FlatSurfaceVisual'

interface KeyProps {
  sublabel?: string
  index: number
  onPress?: () => void
}

const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

function Key({ sublabel, index, onPress }: KeyProps) {
  const [pressed, setPressed] = useState(false)
  const pressedRef = useRef(false);
  const soundRef = useRef<any>(null);

  const startSound = () => {
    if (soundRef.current) stopSound(); // Avoid duplicates
    
    const frequencies = [130.81, 146.83, 164.81, 174.61, 196.00, 220.00, 246.94, 261.63];
    const freq = frequencies[index] || 220;
    
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const oscMain = audioCtx.createOscillator();
    const oscSub = audioCtx.createOscillator();
    const oscVibrato = audioCtx.createOscillator();
    const vibratoGain = audioCtx.createGain();
    const gainNode = audioCtx.createGain();
    
    const f1 = audioCtx.createBiquadFilter();
    const f2 = audioCtx.createBiquadFilter();
    const lowPass = audioCtx.createBiquadFilter();

    oscMain.type = 'sawtooth';
    oscSub.type = 'triangle';
    oscMain.frequency.setValueAtTime(freq, audioCtx.currentTime);
    oscSub.frequency.setValueAtTime(freq / 2, audioCtx.currentTime);
    
    oscVibrato.type = 'sine';
    oscVibrato.frequency.setValueAtTime(4.5, audioCtx.currentTime); 
    vibratoGain.gain.setValueAtTime(freq * 0.012, audioCtx.currentTime); // Reduced vibrato
    oscVibrato.connect(vibratoGain);
    vibratoGain.connect(oscMain.frequency);
    vibratoGain.connect(oscSub.frequency);

    f1.type = 'peaking';
    f1.frequency.setValueAtTime(500, audioCtx.currentTime);
    f1.Q.setValueAtTime(5, audioCtx.currentTime);
    f1.gain.setValueAtTime(15, audioCtx.currentTime);

    f2.type = 'peaking';
    f2.frequency.setValueAtTime(900, audioCtx.currentTime);
    f2.Q.setValueAtTime(5, audioCtx.currentTime);
    f2.gain.setValueAtTime(10, audioCtx.currentTime);

    lowPass.type = 'lowpass';
    lowPass.frequency.setValueAtTime(1500, audioCtx.currentTime);
    lowPass.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 1.2); // Lightened: 800Hz instead of 450Hz

    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.35, audioCtx.currentTime + 0.1); // Slightly lower gain for a 'lighter' feel

    oscMain.connect(f1); oscSub.connect(f1);
    f1.connect(f2); f2.connect(lowPass);
    lowPass.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscMain.start(); oscSub.start(); oscVibrato.start();
    soundRef.current = { oscMain, oscSub, oscVibrato, gainNode };
  };

  const stopSound = () => {
    if (soundRef.current) {
      const { oscMain, oscSub, oscVibrato, gainNode } = soundRef.current;
      const releaseTime = 0.6;
      gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
      gainNode.gain.setValueAtTime(gainNode.gain.value, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + releaseTime);
      
      setTimeout(() => {
        try {
          oscMain.stop(); oscSub.stop(); oscVibrato.stop();
        } catch(e) {}
      }, releaseTime * 1000);
      
      soundRef.current = null;
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const keyMap: Record<string, number> = {
        'a': 0, 's': 1, 'd': 2, 'f': 3,
        'z': 4, 'x': 5, 'c': 6, 'v': 7,
      }
      const k = e.key.toLowerCase();
      if (keyMap[k] === index && !pressedRef.current) {
        pressedRef.current = true;
        setPressed(true);
        onPress?.();
        startSound();
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      const keyMap: Record<string, number> = {
        'a': 0, 's': 1, 'd': 2, 'f': 3,
        'z': 4, 'x': 5, 'c': 6, 'v': 7,
      }
      const k = e.key.toLowerCase();
      if (keyMap[k] === index) {
        pressedRef.current = false;
        setPressed(false);
        stopSound();
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      stopSound();
    }
  }, [index, onPress]); // Stable listeners

  return (
    <div className="jaadoo-key-wrapper">
      <div 
        className={`jaadoo-key ${pressed ? 'pressed' : ''}`}
        onMouseDown={() => { if(!pressedRef.current) { pressedRef.current = true; setPressed(true); startSound(); } }}
        onMouseUp={() => { if(pressedRef.current) { pressedRef.current = false; setPressed(false); stopSound(); } }}
        onMouseLeave={() => { if(pressedRef.current) { pressedRef.current = false; setPressed(false); stopSound(); } }}
      >
        <div className="key-glow" />
        <div className="key-body">
          <div className="key-top-surface" />
        </div>
      </div>
      {sublabel && <span className="key-sublabel">{sublabel}</span>}
    </div>
  )
}

function App() {
  const keys = [
    [{ sublabel: 'A' }, { sublabel: 'S' }, { sublabel: 'D' }, { sublabel: 'F' }],
    [{ sublabel: 'Z' }, { sublabel: 'X' }, { sublabel: 'C' }, { sublabel: 'V' }],
  ]

  useEffect(() => {
    const resumeAudio = () => {
      if (audioCtx.state === 'suspended') audioCtx.resume();
    };
    window.addEventListener('mousedown', resumeAudio);
    return () => window.removeEventListener('mousedown', resumeAudio);
  }, []);

  return (
    <div className="app-container">
      <div className="scanlines" />
      <div className="noise-overlay" />

      <div className="visual-section">
        <div className="visual-column left">
          <OrbitalVisual />
          <div className="monitor-overlay">
            <div className="monitor-label">RECEIVING...</div>
          </div>
        </div>
        
        <div className="visual-column right">
          <FlatSurfaceVisual />
          <div className="monitor-overlay">
            <div className="monitor-label">SENDING...</div>
          </div>
        </div>
      </div>
      
      <div className="device-layer">
        <div className="sticker-area left">
          <img src="/roshan.png" className="sticker" alt="Roshan Sticker" />
        </div>
        
        <div className="jaadoo-keyboard-container">
          <div className="keyboard">
            {keys.map((row, rowIndex) => (
              <div key={rowIndex} className="key-row">
                {row.map((key, keyIndex) => (
                  <Key
                    key={keyIndex}
                    sublabel={key.sublabel}
                    index={rowIndex * 4 + keyIndex}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="sticker-area right">
          <img src="/jadoo.png" className="sticker" alt="Jadoo Sticker" />
        </div>
      </div>
    </div>
  )
}

export default App