import Phaser from 'phaser';
import type { SceneView } from './model';
import { createCharacterTexture, createPropTexture, createRoomTexture } from './art';

class EnterpriseScene extends Phaser.Scene {
  private ready = false;
  private view: SceneView | null = null;
  private backdrop: Phaser.GameObjects.Image | null = null;
  private player: Phaser.GameObjects.Sprite | null = null;
  private crew: Phaser.GameObjects.Image[] = [];
  private props: Phaser.GameObjects.Image[] = [];
  private roomKey = '';
  private moving: Phaser.Tweens.Tween | null = null;
  private settleWalk: (() => void) | null = null;

  constructor(private floorClick: (x: number, y: number) => void) {
    super('enterprise');
  }

  create(): void {
    this.ready = true;
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.floorClick(pointer.x, pointer.y);
    });
    if (this.view) this.present(this.view);
  }

  present(view: SceneView): void {
    this.view = view;
    if (!this.ready) return;
    const texture = `room-${view.room.visual}-${view.room.atmosphere}`;
    if (!this.textures.exists(texture)) {
      this.textures.addCanvas(texture, createRoomTexture(view.room.visual, view.room.atmosphere));
    }
    if (!this.backdrop) this.backdrop = this.add.image(0, 0, texture).setOrigin(0);
    else this.backdrop.setTexture(texture);
    for (const actor of this.crew) actor.destroy();
    this.crew = [];
    for (const prop of this.props) prop.destroy();
    this.props = [];
    for (const target of view.hotspots) {
      if (target.prop) {
        const key = `prop-${target.prop}`;
        if (!this.textures.exists(key)) this.textures.addCanvas(key, createPropTexture(target.prop));
        this.props.push(this.add.image(target.x, target.y, key)
          .setOrigin(0).setDepth(target.y + target.height));
      }
      const speaker = view.speakers.find((entry) => entry.id === target.speaker);
      if (target.kind !== 'person' || !speaker) continue;
      const key = `actor-${speaker.id}`;
      if (!this.textures.exists(key)) this.textures.addCanvas(key, createCharacterTexture(speaker.appearance));
      const feet = target.y + target.height;
      const actor = this.add.image(target.x + target.width / 2, feet, key).setOrigin(0.5, 1).setDepth(feet);
      this.crew.push(actor);
    }
    if (!this.player) {
      for (const pose of ['stand', 'step-left', 'step-right'] as const) {
        const key = `player-${pose}`;
        if (!this.textures.exists(key)) this.textures.addCanvas(key, createCharacterTexture(view.player.appearance, pose));
      }
      this.player = this.add.sprite(235, 273, 'player-stand').setOrigin(0.5, 1).setDepth(273);
    }
    if (this.roomKey !== view.room.id) {
      this.cancelWalk();
      this.player?.setPosition(235, 273).setDepth(273);
      this.roomKey = view.room.id;
      if (!view.reducedMotion) this.cameras.main.fadeIn(240, 4, 9, 17);
    }
  }

  walk(x: number, y: number): Promise<void> {
    this.cancelWalk();
    const player = this.player;
    if (!player || !this.ready) return Promise.resolve();
    const toX = Phaser.Math.Clamp(x, 28, 454);
    const toY = Phaser.Math.Clamp(y, 230, 282);
    if (this.view?.reducedMotion) {
      player.setPosition(toX, toY).setDepth(toY);
      return Promise.resolve();
    }
    const distance = Phaser.Math.Distance.Between(player.x, player.y, toX, toY);
    return new Promise((resolve) => {
      this.settleWalk = resolve;
      this.moving = this.tweens.add({
        targets: player, x: toX, y: toY,
        duration: Math.max(100, Math.min(650, distance * 3.4)),
        onUpdate: (tween: Phaser.Tweens.Tween) => {
          player.setDepth(player.y);
          player.setTexture(Math.floor(tween.elapsed / 100) % 2 ? 'player-step-left' : 'player-step-right');
        },
        onComplete: () => {
          player.setTexture('player-stand');
          this.moving = null;
          this.settleWalk = null;
          resolve();
        },
      });
    });
  }

  private cancelWalk(): void {
    this.moving?.stop();
    this.moving = null;
    this.player?.setTexture('player-stand');
    this.settleWalk?.();
    this.settleWalk = null;
  }
}

export class GameScene {
  private scene: EnterpriseScene;
  private game: Phaser.Game;

  constructor(parent: HTMLElement, onFloor: (x: number, y: number) => void) {
    this.scene = new EnterpriseScene(onFloor);
    this.game = new Phaser.Game({
      type: Phaser.CANVAS, parent, width: 480, height: 300,
      backgroundColor: '#080f1b', pixelArt: true, antialias: false,
      banner: false, audio: { noAudio: true },
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      fps: { target: 30, forceSetTimeOut: true },
      scene: [this.scene],
    });
  }

  present(view: SceneView): void { this.scene.present(view); }
  walk(x: number, y: number): Promise<void> { return this.scene.walk(x, y); }
  resize(): void { this.game.scale.refresh(); }
}
