/**
 * Real-Time 2.5D Facial Animation & Lip-Sync Physics Engine
 * Generates natural human micro-gestures, breathing, eye blinks,
 * and audio-driven lip/jaw articulation at 60 FPS.
 */

export interface FaceMotionState {
  // Head transforms
  headRotateX: number; // Pitch (up/down nodding)
  headRotateY: number; // Yaw (left/right turn)
  headRotateZ: number; // Roll (tilt)
  headTranslateY: number; // Breathing vertical shift
  headScale: number; // Breathing chest expansion

  // Eyes & brows
  eyeBlink: number; // 0 (open) to 1 (closed)
  browLift: number; // -1 (furrowed/serious) to 1 (raised/inquisitive)
  eyeGazeX: number; // Subtle gaze shift (-1 to 1)
  eyeGazeY: number;

  // Mouth & Jaw lip-sync
  mouthOpen: number; // 0 (closed) to 1 (wide open for vowels)
  mouthWidth: number; // 0.8 (puckered O/U) to 1.2 (wide smile A/E)
  jawDrop: number; // 0 to 1
  isSpeaking: boolean;
}

export interface PersonaLandmarks {
  mouthCenter: { x: number; y: number }; // Percentage 0-100
  mouthWidth: number; // Percentage of portrait width
  mouthHeight: number;
  eyeLeft: { x: number; y: number };
  eyeRight: { x: number; y: number };
  skinTone: string;
  lipColor: string;
  lipInnerColor: string;
}

export const PERSONA_LANDMARKS: Record<'alex' | 'sophia', PersonaLandmarks> = {
  alex: {
    mouthCenter: { x: 50, y: 65 },
    mouthWidth: 16,
    mouthHeight: 7,
    eyeLeft: { x: 42, y: 40 },
    eyeRight: { x: 58, y: 40 },
    skinTone: '#d4a373',
    lipColor: '#a66a5c',
    lipInnerColor: '#3a1714',
  },
  sophia: {
    mouthCenter: { x: 50, y: 64.5 },
    mouthWidth: 15.5,
    mouthHeight: 6.8,
    eyeLeft: { x: 41.5, y: 39.5 },
    eyeRight: { x: 58.5, y: 39.5 },
    skinTone: '#e0ac8f',
    lipColor: '#b85d58',
    lipInnerColor: '#421415',
  },
};

export class FaceMotionEngine {
  private blinkTimer = 0;
  private isBlinking = false;
  private blinkProgress = 0;
  private nextBlinkInterval = 3200;

  private nodPhase = 0;
  private breathPhase = Math.random() * Math.PI * 2;
  private microSwayPhase = Math.random() * Math.PI * 2;

  // Smoothed lip-sync target
  private smoothedAudio = 0;
  private mouthOpenSmoothed = 0;
  private jawSmoothed = 0;

  /**
   * Compute the face motion frame at timestamp `now` (ms).
   * @param now Current timestamp in ms
   * @param voiceState Current interaction state ('idle' | 'listening' | 'thinking' | 'speaking')
   * @param audioLevel Instantaneous audio volume level (0 to 1)
   */
  public update(
    now: number,
    voiceState: 'idle' | 'listening' | 'thinking' | 'speaking',
    audioLevel: number
  ): FaceMotionState {
    const dt = 16; // approximate ms per frame

    // 1. Natural Breathing Harmonic (periodic 3.6s cycle)
    this.breathPhase += 0.028;
    const breathSin = Math.sin(this.breathPhase);
    const headTranslateY = breathSin * 2.2; // subtle 2px rise/fall
    const headScale = 1 + breathSin * 0.003;

    // 2. Micro Head Sway (organic human floating)
    this.microSwayPhase += 0.015;
    let headRotateZ = Math.sin(this.microSwayPhase) * 0.8; // +/- 0.8 deg tilt
    let headRotateY = Math.cos(this.microSwayPhase * 0.7) * 1.2; // +/- 1.2 deg turn
    let headRotateX = Math.sin(this.microSwayPhase * 0.5) * 0.9;

    // 3. Eye Blinking Mechanics
    this.blinkTimer += dt;
    let eyeBlink = 0;

    if (!this.isBlinking && this.blinkTimer > this.nextBlinkInterval) {
      this.isBlinking = true;
      this.blinkTimer = 0;
      this.blinkProgress = 0;
      // Randomize next blink: humans blink every 2.5s to 6s
      this.nextBlinkInterval = 2500 + Math.random() * 3500;
    }

    if (this.isBlinking) {
      this.blinkProgress += dt / 150; // blink takes ~150ms
      if (this.blinkProgress >= 1) {
        this.isBlinking = false;
        eyeBlink = 0;
      } else {
        // Bell curve for blink closure (smooth in and out)
        eyeBlink = Math.sin(this.blinkProgress * Math.PI);
      }
    }

    // 4. State-specific Human Gestures
    let browLift = 0;
    let eyeGazeX = 0;
    let eyeGazeY = 0;

    if (voiceState === 'listening') {
      // Attentive head nod when candidate is talking
      this.nodPhase += 0.04;
      const nod = Math.sin(this.nodPhase);
      if (nod > 0) {
        headRotateX += nod * 2.5; // Affirmative slight nod
      }
      headRotateZ += 1.5; // Attentive ear tilt
      browLift = 0.2; // Inquisitive, engaged brows
      eyeGazeY = 0.1;
    } else if (voiceState === 'thinking') {
      // Pondering: slight upward gaze and serious brows
      headRotateX -= 2.0;
      headRotateY += 2.0;
      browLift = -0.3; // slightly furrowed concentration
      eyeGazeY = -0.5; // looking slightly up/left
      eyeGazeX = -0.3;
    } else if (voiceState === 'speaking') {
      // Active conversational head emphasis synced to speech
      const speechBeat = Math.sin(now / 180) * audioLevel;
      headRotateX += speechBeat * 2.8;
      headRotateY += Math.cos(now / 240) * 1.5;
      browLift = Math.sin(now / 350) * 0.4 + 0.1; // animated eyebrows
    }

    // 5. Audio-Modulated Lip-Sync & Viseme Generator
    const isSpeaking = voiceState === 'speaking';
    const targetAudio = isSpeaking ? Math.max(0.12, audioLevel) : 0;

    // Smooth audio tracking (fast attack, smooth release)
    this.smoothedAudio += (targetAudio - this.smoothedAudio) * 0.45;

    let targetMouthOpen = 0;
    let targetJawDrop = 0;
    let mouthWidth = 1.0;

    if (isSpeaking && this.smoothedAudio > 0.06) {
      // Rapid phonetic cycling (simulates moving between vowels A/E/O and consonants)
      const phonemeCycle = Math.sin(now / 75);
      const vowelCycle = Math.cos(now / 130);

      const modulation = Math.max(0, (phonemeCycle + 1) * 0.5);
      targetMouthOpen = Math.min(1, this.smoothedAudio * 1.6 * (0.35 + modulation * 0.65));
      targetJawDrop = targetMouthOpen * 0.85;

      // Mouth width stretches on 'E/A' sounds, narrows on 'O/U'
      mouthWidth = 1.0 + vowelCycle * 0.18;
    }

    this.mouthOpenSmoothed += (targetMouthOpen - this.mouthOpenSmoothed) * 0.55;
    this.jawSmoothed += (targetJawDrop - this.jawSmoothed) * 0.45;

    return {
      headRotateX: Number(headRotateX.toFixed(2)),
      headRotateY: Number(headRotateY.toFixed(2)),
      headRotateZ: Number(headRotateZ.toFixed(2)),
      headTranslateY: Number(headTranslateY.toFixed(2)),
      headScale: Number(headScale.toFixed(4)),
      eyeBlink: Number(eyeBlink.toFixed(3)),
      browLift: Number(browLift.toFixed(2)),
      eyeGazeX: Number(eyeGazeX.toFixed(2)),
      eyeGazeY: Number(eyeGazeY.toFixed(2)),
      mouthOpen: Number(this.mouthOpenSmoothed.toFixed(3)),
      mouthWidth: Number(mouthWidth.toFixed(3)),
      jawDrop: Number(this.jawSmoothed.toFixed(3)),
      isSpeaking,
    };
  }
}
