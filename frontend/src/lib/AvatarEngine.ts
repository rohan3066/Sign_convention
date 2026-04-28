import { AVATAR_COLORS, FINGER_LANDMARKS, UI_COLORS } from './AvatarConstants';

/**
 * AvatarEngine v26.0 - "Python Parity Core"
 * Restores 100% visual identity from the legacy Python matplotlib model.
 * Features: Multi-layered Torso, Segmented Rigging, and High-Fidelity Micro-animations.
 */
export class AvatarEngine {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  
  private currentPoints: number[][] | null = null;
  private targetPoints: number[][] | null = null;
  private lerpFactor = 0.22; 

  private frameCount = 0;
  private isBlinking = false;
  private blinkTimer = 0;

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
  }

  private updatePoints() {
    if (!this.targetPoints || !this.currentPoints) return;
    for (let i = 0; i < this.targetPoints.length; i++) {
        const target = this.targetPoints[i];
        const current = this.currentPoints[i];
        if (target[0] === 0 && target[1] === 0) continue;
        current[0] += (target[0] - current[0]) * this.lerpFactor;
        current[1] += (target[1] - current[1]) * this.lerpFactor;
    }
  }

  public draw(rawPoints: number[][], caption: string = "") {
    this.frameCount++;
    if (this.isBlinking) {
        this.blinkTimer++;
        if (this.blinkTimer > 6) { this.isBlinking = false; this.blinkTimer = 0; }
    } else if (Math.random() < 0.01) this.isBlinking = true;

    // Default resting pose if no points provided
    let activePoints = rawPoints && rawPoints.length >= 33 ? rawPoints : this.getRestingPose();
    this.targetPoints = activePoints;
    if (!this.currentPoints) {
        this.currentPoints = JSON.parse(JSON.stringify(activePoints));
    }

    this.updatePoints();
    this.clear();

    const getPt = (idx: number) => {
      if (!this.currentPoints || idx >= this.currentPoints.length) return null;
      const p = this.currentPoints[idx];
      return [p[0] * this.width, p[1] * this.height];
    };

    this.ctx.save();
    // Centering and Scaling
    this.ctx.translate(this.width * 0.5, this.height * 0.45);
    this.ctx.scale(0.85, 0.85);
    this.ctx.translate(-this.width * 0.5, -this.height * 0.45);

    const t = this.frameCount;
    const breath = Math.sin(t * 0.05) * 3; // Subtle breathing
    const nose = getPt(0);
    const p11 = getPt(11), p12 = getPt(12); // Shoulders
    const p13 = getPt(13), p14 = getPt(14); // Elbows
    const p15 = getPt(15), p16 = getPt(16); // Wrists
    const p23 = getPt(23), p24 = getPt(24); // Hips
    const p27 = getPt(27), p28 = getPt(28); // Ankles

    if (nose && p11 && p12 && p23 && p24) {
      const shoulderDist = Math.sqrt(Math.pow(p11[0] - p12[0], 2) + Math.pow(p11[1] - p12[1], 2));
      const headR = shoulderDist * 0.45;
      const midShoulder = [(p11[0] + p12[0]) / 2, (p11[1] + p12[1]) / 2 + breath];
      const neckBottom = [midShoulder[0], midShoulder[1] + shoulderDist * 0.1];
      const waistL = [p23[0] - 10, p23[1]];
      const waistR = [p24[0] + 10, p24[1]];
      const hipMid = [(p23[0] + p24[0]) / 2, (p23[1] + p24[1]) / 2];

      // --- 1. LOWER TORSO (Pants) ---
      this.ctx.fillStyle = AVATAR_COLORS.pants;
      this.ctx.beginPath();
      this.ctx.moveTo(waistL[0], waistL[1]);
      this.ctx.lineTo(waistR[0], waistR[1]);
      this.ctx.lineTo(p24[0], p24[1] + 25);
      this.ctx.lineTo(p23[0], p23[1] + 25);
      this.ctx.closePath();
      this.ctx.fill();

      // --- 2. THE RIGID TORSO (Python Multi-layer) ---
      const pW = shoulderDist * 0.2;
      
      // Orange Shirt Center
      this.ctx.fillStyle = AVATAR_COLORS.shirt;
      this.ctx.beginPath();
      this.ctx.moveTo(neckBottom[0] - pW, neckBottom[1]);
      this.ctx.lineTo(neckBottom[0] + pW, neckBottom[1]);
      this.ctx.lineTo(hipMid[0] + pW, hipMid[1]);
      this.ctx.lineTo(hipMid[0] - pW, hipMid[1]);
      this.ctx.closePath();
      this.ctx.fill();

      // Jacket Left
      this.ctx.fillStyle = AVATAR_COLORS.jacket;
      this.ctx.beginPath();
      this.ctx.moveTo(p11[0], p11[1] + breath);
      this.ctx.lineTo(neckBottom[0] - pW * 0.8, neckBottom[1]);
      this.ctx.lineTo(hipMid[0] - pW * 0.8, hipMid[1]);
      this.ctx.lineTo(waistL[0], waistL[1]);
      this.ctx.closePath();
      this.ctx.fill();

      // Jacket Right
      this.ctx.beginPath();
      this.ctx.moveTo(p12[0], p12[1] + breath);
      this.ctx.lineTo(neckBottom[0] + pW * 0.8, neckBottom[1]);
      this.ctx.lineTo(hipMid[0] + pW * 0.8, hipMid[1]);
      this.ctx.lineTo(waistR[0], waistR[1]);
      this.ctx.closePath();
      this.ctx.fill();

      // Lapels
      this.ctx.fillStyle = AVATAR_COLORS.lapel;
      const lW = shoulderDist * 0.25, lH = shoulderDist * 0.5;
      // Left Lapel
      this.ctx.beginPath();
      this.ctx.moveTo(neckBottom[0] - pW * 0.8, neckBottom[1]);
      this.ctx.lineTo(neckBottom[0] - pW * 0.8 - lW, neckBottom[1] + lH);
      this.ctx.lineTo(neckBottom[0] - pW * 0.8, neckBottom[1] + lH * 0.3);
      this.ctx.fill();
      // Right Lapel
      this.ctx.beginPath();
      this.ctx.moveTo(neckBottom[0] + pW * 0.8, neckBottom[1]);
      this.ctx.lineTo(neckBottom[0] + pW * 0.8 + lW, neckBottom[1] + lH);
      this.ctx.lineTo(neckBottom[0] + pW * 0.8, neckBottom[1] + lH * 0.3);
      this.ctx.fill();

      // --- 3. LIMBS & SHOES ---
      const drawSegmentedLimb = (segments: number[][], color: string, weights: number[]) => {
        for (let i = 0; i < segments.length - 1; i++) {
          const s = segments[i], e = segments[i+1];
          if (s && e) {
            this.drawLine(s, e, color, weights[i]);
          }
        }
      };

      if (p11 && p13 && p15) drawSegmentedLimb([p11, p13, p15], AVATAR_COLORS.jacket, [40, 36]);
      if (p12 && p14 && p16) drawSegmentedLimb([p12, p14, p16], AVATAR_COLORS.jacket, [40, 36]);
      if (p23 && p27) drawSegmentedLimb([p23, p27], AVATAR_COLORS.pants, [38]);
      if (p24 && p28) drawSegmentedLimb([p24, p28], AVATAR_COLORS.pants, [38]);

      if (p27) this.drawEllipse(p27[0], p27[1] + 5, 24, 12, AVATAR_COLORS.shoe);
      if (p28) this.drawEllipse(p28[0], p28[1] + 5, 24, 12, AVATAR_COLORS.shoe);

      // --- 4. HEAD & FACE ---
      const fX = nose[0], fY = nose[1];
      
      // Hair Back
      this.ctx.fillStyle = AVATAR_COLORS.hair;
      this.ctx.beginPath();
      this.ctx.ellipse(fX, fY - headR * 0.2, headR * 1.2, headR * 1.3, 0, 0, Math.PI * 2);
      this.ctx.fill();

      // Head Circle
      this.ctx.fillStyle = AVATAR_COLORS.skin;
      this.ctx.beginPath();
      this.ctx.ellipse(fX, fY, headR * 1.05, headR * 1.15, 0, 0, Math.PI * 2);
      this.ctx.fill();

      // Hair Swoop (The Iconic Look)
      this.ctx.fillStyle = AVATAR_COLORS.hair;
      this.ctx.beginPath();
      this.ctx.moveTo(fX - headR * 1.1, fY - headR * 0.35);
      this.ctx.lineTo(fX - headR * 0.9, fY - headR * 0.9);
      this.ctx.lineTo(fX + headR * 0.2, fY - headR * 1.1);
      this.ctx.lineTo(fX + headR * 1.1, fY - headR * 0.8);
      this.ctx.lineTo(fX + headR * 1.0, fY - headR * 0.2);
      this.ctx.lineTo(fX + headR * 0.2, fY - headR * 0.4);
      this.ctx.lineTo(fX - headR * 0.6, fY - headR * 0.1);
      this.ctx.closePath();
      this.ctx.fill();

      // Eyes
      const eX = headR * 0.45, eY = fY - headR * 0.1;
      if (!this.isBlinking) {
        this.drawCircle(fX - eX, eY, 6, "white");
        this.drawCircle(fX + eX, eY, 6, "white");
        this.drawCircle(fX - eX, eY, 3, AVATAR_COLORS.eye);
        this.drawCircle(fX + eX, eY, 3, AVATAR_COLORS.eye);
      } else {
        this.drawLine([fX - eX - 5, eY], [fX - eX + 5, eY], AVATAR_COLORS.eye, 2);
        this.drawLine([fX + eX - 5, eY], [fX + eX + 5, eY], AVATAR_COLORS.eye, 2);
      }

      // Nose & Mouth
      this.ctx.fillStyle = AVATAR_COLORS.nose;
      this.ctx.beginPath();
      this.ctx.ellipse(fX, fY + headR * 0.15, 5, 8, 0, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.drawLine([fX - 10, fY + headR * 0.55], [fX + 10, fY + headR * 0.55], '#4e342e', 2);

      // --- 5. HANDS ---
      [33, 54].forEach(startIdx => {
        const wrist = getPt(startIdx); if (!wrist) return;
        this.drawCircle(wrist[0], wrist[1], 15, AVATAR_COLORS.skin);
        Object.entries(FINGER_LANDMARKS).forEach(([name, ids]) => {
          for (let i = 0; i < ids.length - 1; i++) {
            const s = getPt(startIdx + ids[i]), e = getPt(startIdx + ids[i+1]);
            if (s && e) {
              const weight = (name === 'thumb' ? 18 : 14) * (1 - i * 0.12);
              this.drawLine(s, e, AVATAR_COLORS.skinShadow, weight + 2); 
              this.drawLine(s, e, AVATAR_COLORS.skin, weight);
            }
          }
        });
      });
    }

    this.ctx.restore();
    if (caption) {
      this.ctx.fillStyle = UI_COLORS.accent; 
      this.ctx.font = "800 56px 'Segoe UI', system-ui, sans-serif"; 
      this.ctx.textAlign = "center";
      this.ctx.shadowBlur = 15;
      this.ctx.shadowColor = 'rgba(59, 130, 246, 0.4)';
      this.ctx.fillText(caption.toUpperCase(), this.width / 2, this.height - 70);
    }
  }

  private clear() {
    this.ctx.fillStyle = UI_COLORS.bg; 
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  private drawLine(p1: number[], p2: number[], color: string, w: number) {
    this.ctx.beginPath(); this.ctx.moveTo(p1[0], p1[1]); this.ctx.lineTo(p2[0], p2[1]);
    this.ctx.strokeStyle = color; this.ctx.lineWidth = w; this.ctx.lineCap = 'round'; this.ctx.stroke();
  }

  private drawCircle(x: number, y: number, r: number, color: string) {
    this.ctx.beginPath(); this.ctx.arc(x, y, r, 0, Math.PI * 2); this.ctx.fillStyle = color; this.ctx.fill();
  }

  private drawEllipse(x: number, y: number, rx: number, ry: number, color: string) {
    this.ctx.beginPath(); this.ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); this.ctx.fillStyle = color; this.ctx.fill();
  }

  private getRestingPose(): number[][] {
    const pts = Array(75).fill(0).map(() => [0.0, 0.0]);
    pts[0] = [0.5, 0.22]; pts[11] = [0.45, 0.44]; pts[12] = [0.55, 0.44];
    pts[13] = [0.39, 0.65]; pts[14] = [0.61, 0.65]; 
    pts[15] = [0.46, 0.85]; pts[16] = [0.54, 0.85];
    pts[23] = [0.47, 0.95]; pts[24] = [0.53, 0.95];
    pts[27] = [0.48, 1.0]; pts[28] = [0.52, 1.0];
    pts[33] = pts[15]; pts[54] = pts[16];
    [33, 54].forEach((start) => {
        for (let j = 1; j < 21; j++) {
            const fid = Math.floor((j - 1) / 4), rid = (j - 1) % 4;
            pts[start + j] = [pts[start][0] + (fid-2)*0.015, pts[start][1] - (rid+1)*0.022];
        }
    });
    return pts;
  }
}
