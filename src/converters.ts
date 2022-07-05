function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i !== bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

export function strToHex(str: string): string {
  return bytesToHex(new TextEncoder().encode(str));
}

export function hexToStr(hex: string): string {
  return new TextDecoder().decode(hexToBytes(hex));
}
