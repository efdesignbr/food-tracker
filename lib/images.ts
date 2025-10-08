export function placeholderPng(): Uint8Array {
  // 1x1 transparent PNG
  const b64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAoMBgG3xw3cAAAAASUVORK5CYII=';
  return Uint8Array.from(Buffer.from(b64, 'base64'));
}

