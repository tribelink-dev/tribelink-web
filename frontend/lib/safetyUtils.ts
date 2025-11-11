// Safety utility functions

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  accuracy?: number;
}

export interface EmergencyContact {
  _id?: string;
  name: string;
  phone: string;
  email?: string;
  relationship: 'family' | 'friend' | 'colleague' | 'other';
  isPrimary: boolean;
}

export interface EmergencyInfo {
  medicalInfo?: string;
  bloodType?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  allergies?: string[];
  medications?: string[];
  insuranceInfo?: {
    provider?: string;
    policyNumber?: string;
    emergencyContact?: string;
  };
}

/**
 * Get user's current location using browser Geolocation API
 */
export async function getCurrentLocation(): Promise<Location> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy || undefined
        });
      },
      (error) => {
        reject(new Error(`Location error: ${error.message}`));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
}

/**
 * Reverse geocode coordinates to get address
 */
export async function getAddressFromCoordinates(lat: number, lng: number): Promise<string> {
  try {
    // Using OpenStreetMap Nominatim API (free, no key required)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
    );
    const data = await response.json();
    
    if (data.display_name) {
      return data.display_name;
    }
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
}

/**
 * Format emergency numbers for display
 */
export function formatEmergencyNumbers(numbers: any): string {
  if (!numbers) return 'Not available';
  
  const parts = [];
  if (numbers.police) parts.push(`Police: ${numbers.police}`);
  if (numbers.fire) parts.push(`Fire: ${numbers.fire}`);
  if (numbers.ambulance) parts.push(`Ambulance: ${numbers.ambulance}`);
  if (numbers.emergency) parts.push(`Emergency: ${numbers.emergency}`);
  
  return parts.join(' | ') || 'Not available';
}

/**
 * Validate emergency contact
 */
export function validateEmergencyContact(contact: Partial<EmergencyContact>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!contact.name || contact.name.trim().length === 0) {
    errors.push('Name is required');
  }

  if (!contact.phone || contact.phone.trim().length === 0) {
    errors.push('Phone number is required');
  } else {
    // Basic phone validation
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    const cleanedPhone = contact.phone.replace(/[\s\-\(\)]/g, '');
    if (!phoneRegex.test(cleanedPhone)) {
      errors.push('Please enter a valid phone number');
    }
  }

  if (contact.email && contact.email.trim().length > 0) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contact.email)) {
      errors.push('Please enter a valid email address');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get country code from location (simplified - can be enhanced)
 */
export function getCountryCodeFromLocation(lat: number, lng: number): Promise<string> {
  return new Promise((resolve) => {
    // Default to US if reverse geocoding fails
    resolve('US');
    
    // Try to get country from reverse geocoding
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=3`)
      .then(res => res.json())
      .then(data => {
        if (data.address?.country_code) {
          resolve(data.address.country_code.toUpperCase());
        }
      })
      .catch(() => {
        resolve('US');
      });
  });
}

