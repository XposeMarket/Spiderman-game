export class InputManager {
  private keys = new Set<string>();
  private pressed = new Set<string>();
  private mouseButtons = new Set<number>();
  private mousePressed = new Set<number>();
  public mouseDX = 0;
  public mouseDY = 0;
  public pointerLocked = false;

  constructor(private element: HTMLElement) {
    window.addEventListener('keydown', (event) => {
      if (!this.keys.has(event.code)) this.pressed.add(event.code);
      this.keys.add(event.code);
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
        event.preventDefault();
      }
    });
    window.addEventListener('keyup', (event) => this.keys.delete(event.code));
    window.addEventListener('mousedown', (event) => {
      if (!this.mouseButtons.has(event.button)) this.mousePressed.add(event.button);
      this.mouseButtons.add(event.button);
    });
    window.addEventListener('mouseup', (event) => this.mouseButtons.delete(event.button));
    window.addEventListener('mousemove', (event) => {
      if (!this.pointerLocked) return;
      this.mouseDX += event.movementX;
      this.mouseDY += event.movementY;
    });
    document.addEventListener('pointerlockchange', () => {
      this.pointerLocked = document.pointerLockElement === this.element;
    });
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.mouseButtons.clear();
    });
  }

  isDown(code: string): boolean { return this.keys.has(code); }
  wasPressed(code: string): boolean { return this.pressed.has(code); }
  mouseDown(button: number): boolean { return this.mouseButtons.has(button); }
  mouseWasPressed(button: number): boolean { return this.mousePressed.has(button); }

  requestPointerLock(): void {
    this.element.requestPointerLock();
  }

  endFrame(): void {
    this.pressed.clear();
    this.mousePressed.clear();
    this.mouseDX = 0;
    this.mouseDY = 0;
  }
}
