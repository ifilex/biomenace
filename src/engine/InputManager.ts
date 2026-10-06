/**
 * @file /src/engine/InputManager.ts
 * Multi-input manager supporting Keyboard, Gamepad API (with haptic rumble),
 * and Virtual Mobile Touch Joysticks, with Real-Time Input Entropy Tracking.
 */

export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  jump: boolean;
  jumpPressed: boolean; // edge trigger
  shoot: boolean;
  shootPressed: boolean;
  grenade: boolean;
  grenadePressed: boolean;
  dash: boolean;
  dashPressed: boolean;
  nextWeapon: boolean;
  prevWeapon: boolean;
  pause: boolean;
}

export class InputManager {
  public state: InputState = {
    left: false,
    right: false,
    up: false,
    down: false,
    jump: false,
    jumpPressed: false,
    shoot: false,
    shootPressed: false,
    grenade: false,
    grenadePressed: false,
    dash: false,
    dashPressed: false,
    nextWeapon: false,
    prevWeapon: false,
    pause: false
  };

  private prevRawState = { ...this.state };
  private keyMap: Record<string, boolean> = {};
  public gamepadConnected: boolean = false;
  public gamepadName: string = '';

  // Virtual touch controls state
  public touchState: Partial<InputState> = {};

  // Input Entropy & Panic Mashing Tracker for Neuro-Cognitive Assessment
  private keyPressTimestamps: number[] = [];
  public currentEntropyHz: number = 0; // inputs per second

  constructor() {
    this.bindKeyboardEvents();
    this.bindGamepadEvents();
  }

  private bindKeyboardEvents() {
    window.addEventListener('keydown', (e) => {
      // Prevent scrolling with arrows/space
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Space'].includes(e.key)) {
        e.preventDefault();
      }

      if (!this.keyMap[e.code]) {
        // Edge press recorded for neuro-cognitive tracking
        this.recordKeyAction();
      }
      this.keyMap[e.code] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keyMap[e.code] = false;
    });

    window.addEventListener('blur', () => {
      this.keyMap = {};
    });
  }

  private bindGamepadEvents() {
    window.addEventListener('gamepadconnected', (e) => {
      this.gamepadConnected = true;
      this.gamepadName = e.gamepad.id || 'Mando Genérico';
    });

    window.addEventListener('gamepaddisconnected', () => {
      this.gamepadConnected = false;
      this.gamepadName = '';
    });
  }

  private recordKeyAction() {
    const now = performance.now();
    this.keyPressTimestamps.push(now);
    // Keep window of last 2 seconds
    this.keyPressTimestamps = this.keyPressTimestamps.filter((t) => now - t <= 2000);
    this.currentEntropyHz = (this.keyPressTimestamps.length / 2); // inputs per sec
  }

  public update() {
    // 1. Keyboard readings
    const k = this.keyMap;
    const rawLeft = !!(k['ArrowLeft'] || k['KeyA']);
    const rawRight = !!(k['ArrowRight'] || k['KeyD']);
    const rawUp = !!(k['ArrowUp'] || k['KeyW']);
    const rawDown = !!(k['ArrowDown'] || k['KeyS']);
    const rawJump = !!(k['Space'] || k['KeyK'] || k['KeyZ']);
    const rawShoot = !!(k['KeyJ'] || k['KeyX'] || k['ControlLeft']);
    const rawGrenade = !!(k['KeyG'] || k['KeyC']);
    const rawDash = !!(k['ShiftLeft'] || k['ShiftRight'] || k['KeyL']);
    const rawNextWeapon = !!(k['KeyE'] || k['Digit2']);
    const rawPrevWeapon = !!(k['KeyQ'] || k['Digit1']);
    const rawPause = !!(k['KeyP'] || k['Escape']);

    // 2. Gamepad readings
    let gpLeft = false;
    let gpRight = false;
    let gpUp = false;
    let gpDown = false;
    let gpJump = false;
    let gpShoot = false;
    let gpGrenade = false;
    let gpDash = false;
    let gpNextW = false;
    let gpPrevW = false;
    let gpPause = false;

    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = gamepads.find((g) => g !== null && g.connected);

    if (gp) {
      this.gamepadConnected = true;
      this.gamepadName = gp.id || 'Mando detectado';
      // Stick Axes with deadzone
      const axisX = gp.axes[0] || 0;
      const axisY = gp.axes[1] || 0;
      const deadzone = 0.25;

      if (axisX < -deadzone || gp.buttons[14]?.pressed) gpLeft = true;
      if (axisX > deadzone || gp.buttons[15]?.pressed) gpRight = true;
      if (axisY < -deadzone || gp.buttons[12]?.pressed) gpUp = true;
      if (axisY > deadzone || gp.buttons[13]?.pressed) gpDown = true;

      // Buttons (Standard mapping: A=0, B=1, X=2, Y=3, LB=4, RB=5, Start=9)
      gpJump = !!gp.buttons[0]?.pressed; // A button / Cross
      gpShoot = !!(gp.buttons[2]?.pressed || gp.buttons[7]?.pressed); // X button or RT
      gpGrenade = !!(gp.buttons[1]?.pressed || gp.buttons[3]?.pressed); // B or Y
      gpDash = !!(gp.buttons[4]?.pressed || gp.buttons[5]?.pressed); // LB or RB
      gpNextW = !!gp.buttons[5]?.pressed;
      gpPrevW = !!gp.buttons[4]?.pressed;
      gpPause = !!gp.buttons[9]?.pressed; // Start
    }

    // 3. Merge Keyboard, Gamepad, and Virtual Touch controls
    const curLeft = rawLeft || gpLeft || !!this.touchState.left;
    const curRight = rawRight || gpRight || !!this.touchState.right;
    const curUp = rawUp || gpUp || !!this.touchState.up;
    const curDown = rawDown || gpDown || !!this.touchState.down;
    const curJump = rawJump || gpJump || !!this.touchState.jump;
    const curShoot = rawShoot || gpShoot || !!this.touchState.shoot;
    const curGrenade = rawGrenade || gpGrenade || !!this.touchState.grenade;
    const curDash = rawDash || gpDash || !!this.touchState.dash;
    const curNextW = rawNextWeapon || gpNextW;
    const curPrevW = rawPrevWeapon || gpPrevW;
    const curPause = rawPause || gpPause || !!this.touchState.pause;

    // Edge triggers
    this.state.jumpPressed = curJump && !this.prevRawState.jump;
    this.state.shootPressed = curShoot && !this.prevRawState.shoot;
    this.state.grenadePressed = curGrenade && !this.prevRawState.grenade;
    this.state.dashPressed = curDash && !this.prevRawState.dash;
    this.state.nextWeapon = curNextW && !this.prevRawState.nextWeapon;
    this.state.prevWeapon = curPrevW && !this.prevRawState.prevWeapon;
    this.state.pause = curPause && !this.prevRawState.pause;

    // Continuous states
    this.state.left = curLeft;
    this.state.right = curRight;
    this.state.up = curUp;
    this.state.down = curDown;
    this.state.jump = curJump;
    this.state.shoot = curShoot;
    this.state.grenade = curGrenade;
    this.state.dash = curDash;

    this.prevRawState = {
      ...this.state,
      jump: curJump,
      shoot: curShoot,
      grenade: curGrenade,
      dash: curDash,
      nextWeapon: curNextW,
      prevWeapon: curPrevW,
      pause: curPause
    };

    // Update entropy
    const now = performance.now();
    this.keyPressTimestamps = this.keyPressTimestamps.filter((t) => now - t <= 2000);
    this.currentEntropyHz = (this.keyPressTimestamps.length / 2);
  }

  // Haptic rumble feedback if gamepad supports vibrationActuator
  public vibrate(durationMs: number = 100, weakMag: number = 0.5, strongMag: number = 0.5) {
    try {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      const gp = gamepads.find((g) => g !== null && g.connected);
      if (gp && 'vibrationActuator' in gp && (gp as unknown as { vibrationActuator?: { playEffect?: Function } }).vibrationActuator?.playEffect) {
        (gp as unknown as { vibrationActuator: { playEffect: Function } }).vibrationActuator.playEffect('dual-rumble', {
          startDelay: 0,
          duration: durationMs,
          weakMagnitude: weakMag,
          strongMagnitude: strongMag
        });
      }
    } catch {}
  }
}

export const input = new InputManager();
