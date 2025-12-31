// Utility function to get dashboard route based on provider type
// All providers now use the unified /host/dashboard
export function getProviderDashboard(providerType: string): string {
  // Unified dashboard for all provider types
  return '/host/dashboard';
  
  // Legacy provider-specific dashboards (kept for reference)
  // case 'EXPERIENCE_HOST': return '/provider/experiences';
  // case 'GUIDE': return '/provider/guides';
  // case 'ACCOMMODATION_PROVIDER': return '/provider/hotels';
  // case 'DRIVER_PARTNER': return '/provider/drivers';
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

