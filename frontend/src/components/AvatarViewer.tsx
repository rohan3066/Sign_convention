import React, { useEffect, useRef } from 'react';
import { AvatarEngine } from '../lib/AvatarEngine';

interface AvatarViewerProps {
  points: number[][];
  caption?: string;
}

export const AvatarViewer: React.FC<AvatarViewerProps> = ({ points, caption }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<AvatarEngine | null>(null);
  const requestRef = useRef<number>(0);
  const targetPointsRef = useRef<number[][]>(points);
  const targetCaptionRef = useRef<string | undefined>(caption);

  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        engineRef.current = new AvatarEngine(ctx, canvasRef.current.width, canvasRef.current.height);
      }
    }

    const animate = () => {
      if (engineRef.current) {
        engineRef.current.draw(targetPointsRef.current, targetCaptionRef.current);
      }
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, []);

  useEffect(() => {
    targetPointsRef.current = points;
    targetCaptionRef.current = caption;
  }, [points, caption]);

  return (
    <div className="avatar-container">
      <canvas 
        ref={canvasRef} 
        width={1280} 
        height={720} 
        style={{ width: '100%', height: 'auto', borderRadius: '12px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
      />
    </div>
  );
};

