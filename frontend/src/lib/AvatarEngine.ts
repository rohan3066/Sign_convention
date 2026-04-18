import { AVATAR_COLORS, FINGER_LANDMARKS, SKELETON_CONNECTIONS, UI_COLORS } from './AvatarConstants';

export class AvatarEngine {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private smoothedPoints: number[][] | null = null;
  private smoothingAlpha = 0.35; // Balance between smoothness and response
  private blinkState = 0;
  private blinkTimer = 0;

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
  }

  private lerpPoints(target: number[][]): number[][] {
    if (!this.smoothedPoints) {
      this.smoothedPoints = JSON.parse(JSON.stringify(target));
      return target;
    }

    const smoothed = target.map((p, i) => {
      const prev = this.smoothedPoints![i];
      // If target is missing (0,0), hold previous or fade
      if (p[0] === 0 && p[1] === 0) return prev;
      if (prev[0] === 0 && prev[1] === 0) return p;

      return [
        prev[0] + (p[0] - prev[0]) * this.smoothingAlpha,
        prev[1] + (p[1] - prev[1]) * this.smoothingAlpha
      ];
    });

    this.smoothedPoints = smoothed;
    return smoothed;
  }

  public draw(rawPoints: number[][], caption: string = "") {
    if (!rawPoints || rawPoints.length < 75) {
      this.clear();
      return;
    }

    const points = this.lerpPoints(rawPoints);
    const scaledPoints = points.map(p => [p[0] * this.width, p[1] * this.height]);
    this.clear();

    const getPt = (idx: number) => {
      if (idx >= scaledPoints.length) return null;
      const p = scaledPoints[idx];
      if (p[0] === 0 && p[1] === 0) return null;
      return p;
    };

    const nose = getPt(0);
    const p11 = getPt(11), p12 = getPt(12); // Shoulders
    const p13 = getPt(13), p14 = getPt(14); // Elbows
    const p15 = getPt(15), p16 = getPt(16); // Wrists
    const p23 = getPt(23), p24 = getPt(24); // Hips
    const p25 = getPt(25), p26 = getPt(26); // Knees
    const p27 = getPt(27), p28 = getPt(28); // Ankles

    // Proportions fix
    const shoulderDist = (p11 && p12) ? Math.sqrt(Math.pow(p11[0] - p12[0], 2) + Math.pow(p11[1] - p12[1], 2)) : 60;
    const headR = shoulderDist * 0.38; // Reduced from 0.45 for better proportions

    // 1. Hair Background
    if (nose) {
      this.drawEllipse(nose[0], nose[1] - headR * 0.3, headR * 2.2, headR * 2.4, AVATAR_COLORS.hair);
    }

    // 2. Neck
    if (nose && p11 && p12) {
      const midS = [(p11[0] + p12[0]) / 2, (p11[1] + p12[1]) / 2];
      this.drawPolygon([
        [nose[0] - headR * 0.4, nose[1] + headR * 0.5],
        [nose[0] + headR * 0.4, nose[1] + headR * 0.5],
        [midS[0] + 10, midS[1]],
        [midS[0] - 10, midS[1]]
      ], AVATAR_COLORS.skin);
    }

    // 3. Torso
    if (p11 && p12 && p23 && p24) {
      const waistL = [p23[0] - 8, p23[1]], waistR = [p24[0] + 8, p24[1]];
      this.drawPolygon([p11, p12, waistR, waistL], AVATAR_COLORS.jacket);
      
      // Shirt V-neck
      const midS = [(p11[0] + p12[0]) / 2, (p11[1] + p12[1]) / 2];
      const vW = shoulderDist * 0.15, vH = shoulderDist * 0.35;
      this.drawPolygon([
        [midS[0] - vW, midS[1]], 
        [midS[0] + vW, midS[1]], 
        [midS[0], midS[1] + vH]
      ], AVATAR_COLORS.shirt);
    }

    // 4. Volumetric Limbs (Arms)
    // Left Arm
    if (p11 && p13) this.drawTaperedLimb(p11, p13, 15, 12, AVATAR_COLORS.jacket);
    if (p13 && p15) this.drawTaperedLimb(p13, p15, 12, 8, AVATAR_COLORS.jacket);
    // Right Arm
    if (p12 && p14) this.drawTaperedLimb(p12, p14, 15, 12, AVATAR_COLORS.jacket);
    if (p14 && p16) this.drawTaperedLimb(p14, p16, 12, 8, AVATAR_COLORS.jacket);

    // 5. Legs
    if (p23 && p25) this.drawTaperedLimb(p23, p25, 18, 14, AVATAR_COLORS.pants);
    if (p25 && p27) this.drawTaperedLimb(p25, p27, 14, 10, AVATAR_COLORS.pants);
    if (p24 && p26) this.drawTaperedLimb(p24, p26, 18, 14, AVATAR_COLORS.pants);
    if (p26 && p28) this.drawTaperedLimb(p26, p28, 14, 10, AVATAR_COLORS.pants);

    // 6. Shoes
    if (p27) this.drawEllipse(p27[0], p27[1] + 5, 22, 10, AVATAR_COLORS.shoe);
    if (p28) this.drawEllipse(p28[0], p28[1] + 5, 22, 10, AVATAR_COLORS.shoe);

    // 7. Head & Face Polish
    if (nose) {
      this.drawEllipse(nose[0], nose[1], headR * 1.8, headR * 2.0, AVATAR_COLORS.skin);
      
      // Eyes (with blinking)
      this.blinkTimer++;
      if (this.blinkTimer > 150) {
        this.blinkState = 1;
        if (this.blinkTimer > 155) {
          this.blinkState = 0;
          this.blinkTimer = 0;
        }
      }

      const eX = headR * 0.4, eY = headR * 0.15;
      const eyeH = this.blinkState === 1 ? headR * 0.02 : headR * 0.12;
      this.drawEllipse(nose[0] - eX, nose[1] - eY, headR * 0.18, eyeH, AVATAR_COLORS.eye);
      this.drawEllipse(nose[0] + eX, nose[1] - eY, headR * 0.18, eyeH, AVATAR_COLORS.eye);
      
      // Nose & Mouth
      this.drawEllipse(nose[0], nose[1] + headR * 0.1, 8, 12, AVATAR_COLORS.nose);
      this.drawLine([nose[0] - 10, nose[1] + headR * 0.5], [nose[0] + 10, nose[1] + headR * 0.5], '#4e342e', 2);
      
      // Hair Swoop
      this.drawPolygon([
        [nose[0] - headR * 1.0, nose[1] - headR * 0.4],
        [nose[0] - headR * 0.8, nose[1] - headR * 1.1],
        [nose[0] + headR * 0.4, nose[1] - headR * 1.2],
        [nose[0] + headR * 0.9, nose[1] - headR * 0.7],
        [nose[0] + headR * 0.2, nose[1] - headR * 0.5]
      ], AVATAR_COLORS.hair);
    }

    // 8. Hands Skeleton Rigging (Enhanced)
    [33, 54].forEach(startIdx => {
      const rootPt = getPt(startIdx);
      if (!rootPt) return;
      const targetWrist = startIdx === 33 ? p15 : p16;
      if (targetWrist) {
        this.drawLine(targetWrist, rootPt, AVATAR_COLORS.skin, 4);
        Object.values(FINGER_LANDMARKS).forEach(ids => {
          let lastPt = rootPt;
          ids.slice(1).forEach(id => {
            const p = getPt(startIdx + id);
            if (p) {
              this.drawLine(lastPt, p, AVATAR_COLORS.skin, 3);
              this.drawCircle(p[0], p[1], 1.5, 'white');
              lastPt = p;
            }
          });
        });
        this.drawEllipse(rootPt[0], rootPt[1], 12, 10, AVATAR_COLORS.skin);
      }
    });

    // 9. Caption
    if (caption) {
      this.ctx.fillStyle = UI_COLORS.accent;
      this.ctx.font = "bold 28px Inter, sans-serif";
      this.ctx.textAlign = "right";
      this.ctx.fillText(caption.toUpperCase(), this.width - 30, this.height - 40);
    }
  }

  private drawTaperedLimb(p1: number[], p2: number[], w1: number, w2: number, color: string) {
    const angle = Math.atan2(p2[1] - p1[1], p2[0] - p1[0]);
    const perp = angle + Math.PI / 2;
    
    const pts = [
      [p1[0] + Math.cos(perp) * w1, p1[1] + Math.sin(perp) * w1],
      [p2[0] + Math.cos(perp) * w2, p2[1] + Math.sin(perp) * w2],
      [p2[0] - Math.cos(perp) * w2, p2[1] - Math.sin(perp) * w2],
      [p1[0] - Math.cos(perp) * w1, p1[1] - Math.sin(perp) * w1]
    ];
    this.drawPolygon(pts, color);
    
    // Joint roundness
    this.drawCircle(p1[0], p1[1], w1, color);
    this.drawCircle(p2[0], p2[1], w2, color);
  }

  private clear() {
    this.ctx.fillStyle = UI_COLORS.bg;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  private drawCircle(x: number, y: number, r: number, color: string) {
    this.ctx.beginPath();
    this.ctx.arc(x, y, r, 0, Math.PI * 2);
    this.ctx.fillStyle = color;
    this.ctx.fill();
  }

  private drawEllipse(x: number, y: number, rw: number, rh: number, color: string) {
    this.ctx.beginPath();
    this.ctx.ellipse(x, y, rw, rh, 0, 0, Math.PI * 2);
    this.ctx.fillStyle = color;
    this.ctx.fill();
  }

  private drawPolygon(pts: number[][], color: string) {
    if (pts.length < 2) return;
    this.ctx.beginPath();
    this.ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) this.ctx.lineTo(pts[i][0], pts[i][1]);
    this.ctx.closePath();
    this.ctx.fillStyle = color;
    this.ctx.fill();
  }

  private drawLine(p1: number[], p2: number[], color: string, width: number) {
    this.ctx.beginPath();
    this.ctx.moveTo(p1[0], p1[1]);
    this.ctx.lineTo(p2[0], p2[1]);
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = width;
    this.ctx.lineCap = 'round';
    this.ctx.stroke();
  }
}
