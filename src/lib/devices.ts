import type { Platform } from './project';

// Original frontal mockups. Dimensions come from the references in docs/device-frames.md.
// Radii, bezels and camera sizes are illustrative, not engineering measurements.
export const DEVICES = [
  { id: 'galaxy-s26', name: 'Samsung Galaxy S26', platform: 'Android', width: 71.7, height: 149.6, radius: 7, bezel: 1.25, camera: 'hole', cameraWidth: 2.5, rim: '#a6a4c6' },
  { id: 'pixel-8', name: 'Google Pixel 8', platform: 'Android', width: 70.8, height: 150.5, radius: 10, bezel: 1.8, camera: 'hole', cameraWidth: 2.8, rim: '#b5bbb4' },
  { id: 'pixel-7', name: 'Google Pixel 7', platform: 'Android', width: 73.2, height: 155.6, radius: 6, bezel: 2.0, camera: 'hole', cameraWidth: 3, rim: '#939a92' },
  { id: 'iphone-12', name: 'iPhone 12', platform: 'iOS', width: 71.5, height: 146.7, radius: 10.5, bezel: 2.0, camera: 'notch', cameraWidth: 31, rim: '#8dabc3' },
  { id: 'iphone-15', name: 'iPhone 15', platform: 'iOS', width: 71.6, height: 147.6, radius: 11.5, bezel: 1.7, camera: 'island', cameraWidth: 21, rim: '#bac8ba' },
  { id: 'iphone-17', name: 'iPhone 17', platform: 'iOS', width: 71.5, height: 149.6, radius: 12, bezel: 1.4, camera: 'island', cameraWidth: 20, rim: '#b7b0ce' },
  { id: 'iphone-18-pro', name: 'iPhone 18 Pro', platform: 'iOS', width: 71.9, height: 150, radius: 12, bezel: 1.35, camera: 'island', cameraWidth: 19, rim: '#adb4ba' },
] as const;
export type Device = typeof DEVICES[number];
export type DeviceId = Device['id'];
export const DEFAULT_DEVICES: Record<Platform, DeviceId> = { Android: 'galaxy-s26', iOS: 'iphone-17' };
export function deviceFor(platform: Platform, id?: DeviceId): Device {
  return DEVICES.find(d => d.id === id && d.platform === platform) ?? DEVICES.find(d => d.id === DEFAULT_DEVICES[platform])!;
}

export function deviceLayout(device: Device, landscape: boolean, maxWidth: number, maxHeight: number) {
  const scale = Math.min(maxWidth / (landscape ? device.height : device.width), maxHeight / (landscape ? device.width : device.height));
  return { scale, width: (landscape ? device.height : device.width) * scale, height: (landscape ? device.width : device.height) * scale };
}
