import type { Coordinates, Overlay } from '@guidenav/types';

export function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  return prefix ? `${prefix}_${timestamp}${randomPart}` : `${timestamp}${randomPart}`;
}

export function normalizeOverlayPosition(
  x: number,
  y: number,
  containerWidth: number,
  containerHeight: number
): { x: number; y: number } {
  return {
    x: Math.max(0, Math.min(1, x / containerWidth)),
    y: Math.max(0, Math.min(1, y / containerHeight)),
  };
}

export function denormalizeOverlayPosition(
  normalizedX: number,
  normalizedY: number,
  containerWidth: number,
  containerHeight: number
): { x: number; y: number } {
  return {
    x: normalizedX * containerWidth,
    y: normalizedY * containerHeight,
  };
}

export function generateMapsUrl(coordinates: Coordinates): string {
  const { latitude, longitude } = coordinates;
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}

export function generateAppleMapsUrl(coordinates: Coordinates): string {
  const { latitude, longitude } = coordinates;
  return `https://maps.apple.com/?q=${latitude},${longitude}`;
}

export function formatAvailabilityTime(
  startTs: string | null,
  endTs: string | null,
  timezone: string = 'Asia/Riyadh'
): string {
  if (!startTs || !endTs) {
    return '';
  }

  const formatTime = (ts: string): string => {
    const date = new Date(ts);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: timezone,
    });
  };

  return `${formatTime(startTs)} - ${formatTime(endTs)}`;
}

export function isLinkExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}

export function calculateExpiryDate(createdAt: Date, durationMinutes: number): Date {
  return new Date(createdAt.getTime() + durationMinutes * 60 * 1000);
}
