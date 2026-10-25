import { createPixelTexture } from '../art';
import { drawSaucer, drawStardrive, galaxySections, translatedPainter } from './space-art';

export function createGalaxyRenderer(context: CanvasRenderingContext2D):
  (section: keyof typeof galaxySections, x: number, y: number, scale?: number) => void {
  const textureFor = (section: keyof typeof galaxySections) => {
    const bounds = galaxySections[section];
    return createPixelTexture(bounds.right - bounds.left, bounds.bottom - bounds.top, (p) => {
      const paint = section === 'saucer' ? drawSaucer : drawStardrive;
      paint(translatedPainter(p, -bounds.left, -bounds.top));
    });
  };
  const textures = { stardrive: textureFor('stardrive'), saucer: textureFor('saucer') };
  return (section, x, y, scale = 1) => {
    const bounds = galaxySections[section];
    const texture = textures[section];
    context.drawImage(texture, Math.round(x + bounds.left * scale), Math.round(y + bounds.top * scale),
      Math.round(texture.width * scale), Math.round(texture.height * scale));
  };
}
