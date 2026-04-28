import React, { useEffect, useRef } from 'react';
import { AvatarEngine } from '../lib/AvatarEngine';

interface AvatarViewerProps {
  points: number[][];
  caption?: string;
}

/**
 * AvatarViewer Component
 * Renders the 2D high-fidelity avatar on a canvas.
 */
export const AvatarViewer: React.FC<AvatarViewerProps> = ({ points, caption = "" }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<AvatarEngine | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        // High-DPI support
        const dpr = window.devicePixelRatio || 1;
        const rect = canvasRef.current.getBoundingClientRect();
        canvasRef.current.width = rect.width * dpr;
        canvasRef.current.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        
        engineRef.current = new AvatarEngine(ctx, rect.width, rect.height);
      }
    }
  }, []);

  useEffect(() => {
    let animationFrame: number;
    const render = () => {
      if (engineRef.current) {
        engineRef.current.draw(points, caption);
      }
      animationFrame = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animationFrame);
  }, [points, caption]);

  return (
    <div className="avatar-viewer-container" style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', borderRadius: '24px', background: '#0a0c10', boxShadow: 'inset 0 0 40px rgba(0,0,0,0.5)' }}>
      <canvas 
        ref={canvasRef} 
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
      
      {/* Decorative Overlays */}
      <div style={{ position: 'absolute', top: 20, left: 20, pointerEvents: 'none' }}>
        <div style={{ fontSize: '10px', color: '#3b82f6', letterSpacing: '2px', fontWeight: 800, opacity: 0.6 }}>KINEMATIC ENGINE ACTIVE</div>
        <div style={{ width: '30px', height: '2px', background: '#3b82f6', marginTop: '4px', opacity: 0.4 }}></div>
      </div>
      
      <div style={{ position: 'absolute', bottom: 20, right: 20, textAlign: 'right', pointerEvents: 'none' }}>
        <div style={{ fontSize: '9px', color: '#94a3b8', opacity: 0.5 }}>V26.0 CORE PARITY</div>
      </div>
    </div>
  );
};
