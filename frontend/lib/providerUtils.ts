// Utility function to get dashboard route based on provider type
export function getProviderDashboard(providerType: string): string {
  switch (providerType) {
    case 'GUIDE':
      return '/provider/guides';
    case 'DRIVER_PARTNER':
      return '/provider/drivers';
    case 'ACCOMMODATION_PROVIDER':
      return '/provider/hotels';
    case 'EXPERIENCE_HOST':
    default:
      return '/host/dashboard';
  }
}

// Get welcome message based on provider type
export function getProviderWelcomeMessage(providerType: string): string {
  switch (providerType) {
    case 'EXPERIENCE_HOST':
      return 'Manage your experiences and activities';
    case 'GUIDE':
      return 'Manage your guided tours and travel services';
    case 'ACCOMMODATION_PROVIDER':
      return 'Manage your hotel properties';
    case 'DRIVER_PARTNER':
      return 'Manage your driver services';
    default:
      return 'Manage your services';
  }
}

// Host logout function
export function hostLogout() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('host');
    localStorage.removeItem('userType');
    window.location.href = '/host/login';
  }
}

