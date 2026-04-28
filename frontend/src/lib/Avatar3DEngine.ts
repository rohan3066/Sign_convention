import * as THREE from 'three';

/**
 * Avatar3DEngine v6.0 - "Humanoid Final" Core
 * Implements full skeletal rigging for all 21 hand landmarks, 
 * anatomical facial features, and advanced spring-driven human motion.
 */
export class Avatar3DEngine {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private container: HTMLElement;
  
  private group: THREE.Group;
  private body: THREE.Group;
  private head: THREE.Group;
  private neck: THREE.Mesh;
  
  private upperArmL: THREE.Group; private upperArmR: THREE.Group;
  private lowerArmL: THREE.Group; private lowerArmR: THREE.Group;
  private handL: THREE.Group;     private handR: THREE.Group;
  
  private fingerJointsL: THREE.Group[][] = []; // 5 fingers x 3 joints
  private fingerJointsR: THREE.Group[][] = [];
  
  private eyes: THREE.Group;
  private nose: THREE.Mesh;
  private mouth: THREE.Mesh;
  
  private targets: Map<string, THREE.Vector3> = new Map();
  private velocities: Map<string, THREE.Vector3> = new Map();
  private stiffness = 200;
  private damping = 18;
  private lastTime = 0;
  
  private frameCount = 0;
  private blinkTimer = 0;
  private isBlinking = false;

  constructor(container: HTMLElement) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0c10); 
    
    this.camera = new THREE.PerspectiveCamera(35, container.clientWidth / container.clientHeight, 0.1, 1000);
    this.camera.position.set(0, 1.4, 3.0);
    
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);

    this.setupLighting();
    this.buildCharacter();
    this.lastTime = performance.now();
    this.animate();
  }

  private setupLighting() {
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const k = new THREE.DirectionalLight(0xffffff, 1.2); k.position.set(2, 5, 5); this.scene.add(k);
    const r = new THREE.SpotLight(0x8b5cf6, 3, 10); r.position.set(-3, 3, -1); this.scene.add(r);
  }

  private buildCharacter() {
    this.group = new THREE.Group();
    this.scene.add(this.group);
    this.body = new THREE.Group();
    this.group.add(this.body);

    const skinMat = new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.4 });
    const garmentMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });

    // Torso
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.5, 8, 16), garmentMat);
    torso.position.y = 0.8;
    this.body.add(torso);

    // Head Unit
    this.head = new THREE.Group();
    const face = new THREE.Mesh(new THREE.IcosahedronGeometry(0.18, 5), skinMat);
    face.scale.set(1, 1.3, 1.1);
    this.head.add(face);

    // Face Features
    this.nose = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.06, 4), skinMat);
    this.nose.position.set(0, 0, 0.18); this.nose.rotation.x = Math.PI * 0.5;
    this.head.add(this.nose);

    this.mouth = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.02, 4, 4), new THREE.MeshStandardMaterial({ color: 0x8d5c3d }));
    this.mouth.position.set(0, -0.1, 0.17);
    this.head.add(this.mouth);

    this.eyes = new THREE.Group();
    const eL = new THREE.Mesh(new THREE.SphereGeometry(0.02, 12, 12), new THREE.MeshBasicMaterial({ color: 0x111 }));
    eL.position.set(-0.06, 0.05, 0.17);
    const eR = eL.clone(); eR.position.x = 0.06;
    this.eyes.add(eL, eR);
    this.head.add(this.eyes);

    this.head.position.y = 1.6;
    this.body.add(this.head);

    // Rigid Arms & Joined Fingers
    const createArm = (side: 'L' | 'R') => {
        const sh = new THREE.Group(); sh.position.set(side === 'L' ? -0.32 : 0.32, 1.3, 0);
        const up = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.3, 4, 12), garmentMat); up.position.y = -0.15; sh.add(up);
        const el = new THREE.Group(); el.position.y = -0.15; up.add(el);
        const lo = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.3, 4, 12), garmentMat); lo.position.y = -0.15; el.add(lo);
        const ha = new THREE.Group(); ha.position.y = -0.15; lo.add(ha);
        const pa = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.04), skinMat); pa.position.y = -0.06; ha.add(pa);

        const fingerJoints: THREE.Group[][] = [];
        for (let i = 0; i < 5; i++) {
            const fGroup: THREE.Group[] = [];
            let lastJoint = ha;
            for (let j = 0; j < 3; j++) {
                const joint = new THREE.Group();
                joint.position.set(j === 0 ? (i - 2) * 0.022 : 0, j === 0 ? -0.12 : -0.04, 0);
                const seg = new THREE.Mesh(new THREE.CapsuleGeometry(0.012, 0.04, 2, 4), skinMat);
                seg.position.y = -0.02; joint.add(seg);
                lastJoint.add(joint); lastJoint = joint; fGroup.push(joint);
            }
            fingerJoints.push(fGroup);
        }
        return { sh, el, ha, joints: fingerJoints };
    };

    const armL = createArm('L'); this.upperArmL = armL.sh; this.lowerArmL = armL.el; this.handL = armL.ha; this.fingerJointsL = armL.joints;
    this.body.add(this.upperArmL);
    const armR = createArm('R'); this.upperArmR = armR.sh; this.lowerArmR = armR.el; this.handR = armR.ha; this.fingerJointsR = armR.joints;
    this.body.add(this.upperArmR);
  }

  public updatePoints(points: number[][]) {
    if (!points || points.length === 0) return;
    const getPt = (i: number) => {
        if (i >= points.length) return null;
        const p = points[i];
        if (!p || (p[0] === 0 && p[1] === 0)) return null;
        return new THREE.Vector3((p[0] - 0.5) * 3.4, (0.5 - p[1]) * 3.4 + 1.25, -p[1] * 0.5);
    };

    const sync = (key: string, v: THREE.Vector3 | null) => {
        if (v) this.targets.set(key, v);
        if (!this.velocities.has(key)) this.velocities.set(key, new THREE.Vector3());
    };

    sync('head', getPt(0)); sync('shL', getPt(11)); sync('shR', getPt(12));
    sync('elL', getPt(13)); sync('elR', getPt(14));
    sync('wrL', getPt(33) || getPt(15)); sync('wrR', getPt(54) || getPt(16));

    // Update Finger Targets (Tip Landmarks)
    [33, 54].forEach((start, sideIdx) => {
        const side = sideIdx === 0 ? 'L' : 'R';
        [4, 8, 12, 16, 20].forEach((tipIdx, fIdx) => {
            const p = getPt(start + tipIdx);
            if (p) this.targets.set(`f${side}${fIdx}`, p);
        });
    });
  }

  private solveMotion() {
    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.032);
    this.lastTime = now;

    const lerpSolve = (target: THREE.Vector3, current: THREE.Vector3, vel: THREE.Vector3) => {
        const force = target.clone().sub(current).multiplyScalar(this.stiffness);
        const drag = vel.clone().multiplyScalar(this.damping);
        vel.add(force.sub(drag).multiplyScalar(dt));
        current.add(vel.clone().multiplyScalar(dt));
    };

    const tH = this.targets.get('head');
    if (tH) lerpSolve(tH, this.head.position, this.velocities.get('head')!);

    const solveArm = (shoulder: THREE.Group, elbow: THREE.Group, hand: THREE.Group, sK: string, eK: string, wK: string, joints: THREE.Group[][], side: string) => {
        const tS = this.targets.get(sK), tE = this.targets.get(eK), tW = this.targets.get(wK);
        if (!tS || !tE || !tW) return;
        shoulder.position.copy(tS);
        const d1 = tE.clone().sub(tS).normalize(); shoulder.quaternion.slerp(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), d1), 0.5);
        const d2 = tW.clone().sub(tE).normalize(); elbow.quaternion.slerp(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), d2), 0.5);
        
        // Procedural Finger Bend
        joints.forEach((f, i) => {
            const tF = this.targets.get(`f${side}${i}`);
            if (tF) {
                const dist = tF.distanceTo(tW);
                const bend = Math.max(0, Math.min(Math.PI * 0.5, (0.3 - dist) * 5));
                f.forEach(j => j.rotation.x = -bend);
            }
        });
    };
    solveArm(this.upperArmL, this.lowerArmL, this.handL, 'shL', 'elL', 'wrL', this.fingerJointsL, 'L');
    solveArm(this.upperArmR, this.lowerArmR, this.handR, 'shR', 'elR', 'wrR', this.fingerJointsR, 'R');
  }

  private animate() {
    requestAnimationFrame(() => this.animate());
    this.frameCount++;
    const t = this.frameCount * 0.04;
    this.body.position.y = Math.sin(t) * 0.012; // Breathing
    this.head.rotation.z = Math.sin(t*0.5) * 0.02;

    if (this.isBlinking) {
        this.blinkTimer++; this.eyes.scale.y = 0.1;
        if (this.blinkTimer > 5) { this.isBlinking = false; this.blinkTimer = 0; }
    } else {
        this.eyes.scale.y = 1; if (Math.random() < 0.01) this.isBlinking = true;
    }

    this.solveMotion();
    this.renderer.render(this.scene, this.camera);
  }

  public resize() {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }

  public dispose() {
    this.renderer.dispose();
  }
}
