/**
 * Opens WhatsApp chat with the given phone number and optional message.
 * Phone number should include country code without + sign (e.g., "966501234567")
 */
export function openWhatsApp(phoneNumber: string, message?: string): void {
  const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
  
  let url = `https://wa.me/${cleanNumber}`;
  
  if (message) {
    url += `?text=${encodeURIComponent(message)}`;
  }
  
  window.open(url, '_blank');
}

/**
 * Opens Google Maps with directions to the given coordinates.
 */
export function openMapsWithCoordinates(latitude: number, longitude: number): void {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
  window.open(url, '_blank');
}

/**
 * Opens the default maps app with the given coordinates.
 * Uses geo: URI scheme which works on mobile devices.
 */
export function openMapsNative(latitude: number, longitude: number, label?: string): void {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  
  if (isIOS) {
    const url = label 
      ? `maps://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=d`
      : `maps://maps.apple.com/?ll=${latitude},${longitude}`;
    window.location.href = url;
  } else {
    openMapsWithCoordinates(latitude, longitude);
  }
}

/**
 * Initiates a phone call to the given number.
 */
export function makePhoneCall(phoneNumber: string): void {
  const cleanNumber = phoneNumber.replace(/[^0-9+]/g, '');
  window.location.href = `tel:${cleanNumber}`;
}
