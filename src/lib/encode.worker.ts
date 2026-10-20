import { encode } from 'fast-png';
import { rgbaToRgb } from './project';
self.onmessage = (event: MessageEvent<{ rgba: Uint8ClampedArray; width: number; height: number }>) => {
  try {
    const { rgba, width, height } = event.data;
    const png = encode({ width, height, data: rgbaToRgb(rgba), channels: 3, depth: 8 });
    self.postMessage({ png }, { transfer: [png.buffer] });
  } catch (error) { self.postMessage({ error: String(error) }); }
};
