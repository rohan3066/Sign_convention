import React, { useRef, useState, useEffect } from 'react';
import { Video, StopCircle } from 'lucide-react';
import axios from 'axios';

// Access MediaPipe via globals (loaded from CDN in index.html)
const { Pose, POSE_CONNECTIONS } = (window as any);
const { Hands, HAND_CONNECTIONS } = (window as any);
const { Camera } = (window as any);
const { drawConnectors, drawLandmarks } = (window as any);

export const SignRecognizer: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [result, setResult] = useState<string>('IDLE');
  const [confidence, setConfidence] = useState<number>(0);
  const recordedFramesRef = useRef<any[]>([]);

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const pose = new Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5/${file}`,
    });

    const hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/${file}`,
    });

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    const ctx = canvasRef.current.getContext('2d');

    const onResults = (poseResults: any, handResults: any) => {
      if (!ctx || !canvasRef.current) return;

      // We process both if available, otherwise just what we have
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      // Extract current frame landmarks (matching Python 75 points structure)
      const frameData = new Array(75).fill([0, 0]);

      if (poseResults && poseResults.poseLandmarks) {
        poseResults.poseLandmarks.forEach((lm: any, i: number) => {
          if (i < 33) frameData[i] = [lm.x, lm.y];
        });

        drawConnectors(ctx, poseResults.poseLandmarks, POSE_CONNECTIONS, { color: '#00e5ff', lineWidth: 2 });
        drawLandmarks(ctx, poseResults.poseLandmarks, { color: '#ff69b4', lineWidth: 1, radius: 2 });
      }

      if (handResults && handResults.multiHandLandmarks) {
        handResults.multiHandLandmarks.forEach((handLM: any, index: number) => {
          const label = handResults.multiHandedness[index].label;
          const startIndex = label === 'Left' ? 33 : 54;
          handLM.forEach((lm: any, i: number) => {
            if (startIndex + i < 75) frameData[startIndex + i] = [lm.x, lm.y];
          });

          drawConnectors(ctx, handLM, HAND_CONNECTIONS, { color: '#ffffff', lineWidth: 2 });
          drawLandmarks(ctx, handLM, { color: label === 'Left' ? '#00e5ff' : '#ff69b4', radius: 1 });
        });
      }

      if (isRecording) {
        recordedFramesRef.current.push(frameData);
      }
    };

    // Use refs to store latest results to simulate synchronization
    let latestPose: any = null;
    let latestHands: any = null;

    const handlePoseResults = (results: any) => {
      latestPose = results;
      onResults(latestPose, latestHands);
    };

    const handleHandResults = (results: any) => {
      latestHands = results;
      onResults(latestPose, latestHands);
    };

    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        if (videoRef.current) {
          await pose.send({ image: videoRef.current });
          await hands.send({ image: videoRef.current });
        }
      },
      width: 1280,
      height: 720,
    });
    camera.start();

    pose.onResults(handlePoseResults);
    hands.onResults(handleHandResults);

    return () => {
      camera.stop();
      pose.close();
      hands.close();
    };
  }, [isRecording]);

  const toggleRecording = async () => {
    if (isRecording) {
      setIsRecording(false);
      setResult('ANALYZING...');
      try {
        const response = await axios.post('http://localhost:8080/api/recognize', recordedFramesRef.current);
        setResult(response.data.word.toUpperCase());
        setConfidence(Math.round(response.data.confidence));
      } catch (err) {
        setResult('ERROR');
      }
      recordedFramesRef.current = [];
    } else {
      setIsRecording(true);
      setResult('RECORDING');
      recordedFramesRef.current = [];
    }
  };

  return (
    <div className="camera-preview">
      <video ref={videoRef} className="camera-video" playsInline muted />
      <canvas ref={canvasRef} className="camera-canvas" width={1280} height={720} />

      <div style={{ position: 'absolute', bottom: '2rem', left: '2rem', display: 'flex', gap: '1rem' }}>
        <button
          className={`btn ${isRecording ? 'btn-primary' : 'btn-secondary'}`}
          onClick={toggleRecording}
        >
          {isRecording ? <StopCircle size={20} /> : <Video size={20} />}
          {isRecording ? 'Stop' : 'Start Recording'}
        </button>
      </div>

      <div style={{ position: 'absolute', top: '2rem', right: '2rem', textAlign: 'right' }}>
        <div className={`status-badge ${isRecording ? 'status-busy' : 'status-ready'}`}>
          {result} {confidence > 0 && `(${confidence}%)`}
        </div>
      </div>
    </div>
  );
};
