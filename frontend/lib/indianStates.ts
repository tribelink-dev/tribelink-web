// Indian States and Districts data
export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi'
];

// Districts for Kerala (can be expanded later)
export const DISTRICTS_BY_STATE: Record<string, string[]> = {
  'Kerala': [
    'Alappuzha', 'Ernakulam', 'Idukki', 'Kannur', 'Kasaragod',
    'Kollam', 'Kottayam', 'Kozhikode', 'Malappuram', 'Palakkad',
    'Pathanamthitta', 'Thiruvananthapuram', 'Thrissur', 'Wayanad'
  ],
  'Tamil Nadu': [
    'Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem',
    'Tirunelveli', 'Tiruppur', 'Erode', 'Vellore', 'Thoothukudi'
  ],
  'Karnataka': [
    'Bangalore', 'Mysore', 'Hubli', 'Mangalore', 'Belgaum',
    'Gulbarga', 'Davangere', 'Bellary', 'Bijapur', 'Raichur'
  ],
  'Maharashtra': [
    'Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad',
    'Solapur', 'Amravati', 'Kolhapur', 'Sangli', 'Satara'
  ],
  'Gujarat': [
    'Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar',
    'Jamnagar', 'Gandhinagar', 'Junagadh', 'Bharuch', 'Anand'
  ],
  'Rajasthan': [
    'Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Ajmer',
    'Udaipur', 'Bhilwara', 'Alwar', 'Bharatpur', 'Sikar'
  ],
  'West Bengal': [
    'Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri',
    'Malda', 'Jalpaiguri', 'Kharagpur', 'Bardhaman', 'Bardhaman'
  ],
  'Uttar Pradesh': [
    'Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Allahabad',
    'Meerut', 'Ghaziabad', 'Bareilly', 'Aligarh', 'Moradabad'
  ],
  'Delhi': [
    'New Delhi', 'Central Delhi', 'North Delhi', 'South Delhi',
    'East Delhi', 'West Delhi', 'North East Delhi', 'North West Delhi',
    'South West Delhi', 'Shahdara'
  ]
};

// Default districts if state not found
export const DEFAULT_DISTRICTS: string[] = [];

// City to Location Mapping - Maps city names to their state and district
export const CITY_TO_LOCATION: Record<string, { state: string; district: string }> = {
  // Major Cities - Maharashtra
  'Mumbai': { state: 'Maharashtra', district: 'Mumbai' },
  'Bombay': { state: 'Maharashtra', district: 'Mumbai' },
  'Pune': { state: 'Maharashtra', district: 'Pune' },
  'Nagpur': { state: 'Maharashtra', district: 'Nagpur' },
  'Nashik': { state: 'Maharashtra', district: 'Nashik' },
  'Aurangabad': { state: 'Maharashtra', district: 'Aurangabad' },
  
  // Major Cities - Karnataka
  'Bangalore': { state: 'Karnataka', district: 'Bangalore' },
  'Bengaluru': { state: 'Karnataka', district: 'Bangalore' },
  'Mysore': { state: 'Karnataka', district: 'Mysore' },
  'Mysuru': { state: 'Karnataka', district: 'Mysore' },
  'Mangalore': { state: 'Karnataka', district: 'Mangalore' },
  'Hubli': { state: 'Karnataka', district: 'Hubli' },
  
  // Major Cities - Tamil Nadu
  'Chennai': { state: 'Tamil Nadu', district: 'Chennai' },
  'Madras': { state: 'Tamil Nadu', district: 'Chennai' },
  'Coimbatore': { state: 'Tamil Nadu', district: 'Coimbatore' },
  'Madurai': { state: 'Tamil Nadu', district: 'Madurai' },
  
  // Major Cities - Delhi
  'Delhi': { state: 'Delhi', district: 'New Delhi' },
  'New Delhi': { state: 'Delhi', district: 'New Delhi' },
  
  // Major Cities - West Bengal
  'Kolkata': { state: 'West Bengal', district: 'Kolkata' },
  'Calcutta': { state: 'West Bengal', district: 'Kolkata' },
  
  // Major Cities - Gujarat
  'Ahmedabad': { state: 'Gujarat', district: 'Ahmedabad' },
  'Surat': { state: 'Gujarat', district: 'Surat' },
  'Vadodara': { state: 'Gujarat', district: 'Vadodara' },
  'Baroda': { state: 'Gujarat', district: 'Vadodara' },
  
  // Major Cities - Rajasthan
  'Jaipur': { state: 'Rajasthan', district: 'Jaipur' },
  'Jodhpur': { state: 'Rajasthan', district: 'Jodhpur' },
  'Udaipur': { state: 'Rajasthan', district: 'Udaipur' },
  'Kota': { state: 'Rajasthan', district: 'Kota' },
  
  // Major Cities - Uttar Pradesh
  'Agra': { state: 'Uttar Pradesh', district: 'Agra' },
  'Varanasi': { state: 'Uttar Pradesh', district: 'Varanasi' },
  'Benares': { state: 'Uttar Pradesh', district: 'Varanasi' },
  'Banaras': { state: 'Uttar Pradesh', district: 'Varanasi' },
  'Lucknow': { state: 'Uttar Pradesh', district: 'Lucknow' },
  'Kanpur': { state: 'Uttar Pradesh', district: 'Kanpur' },
  'Allahabad': { state: 'Uttar Pradesh', district: 'Allahabad' },
  'Prayagraj': { state: 'Uttar Pradesh', district: 'Allahabad' },
  
  // Kerala - Popular Destinations
  'Kochi': { state: 'Kerala', district: 'Ernakulam' },
  'Cochin': { state: 'Kerala', district: 'Ernakulam' },
  'Thiruvananthapuram': { state: 'Kerala', district: 'Thiruvananthapuram' },
  'Trivandrum': { state: 'Kerala', district: 'Thiruvananthapuram' },
  'Munnar': { state: 'Kerala', district: 'Idukki' },
  'Alleppey': { state: 'Kerala', district: 'Alappuzha' },
  'Alappuzha': { state: 'Kerala', district: 'Alappuzha' },
  'Kovalam': { state: 'Kerala', district: 'Thiruvananthapuram' },
  'Thekkady': { state: 'Kerala', district: 'Idukki' },
  'Wayanad': { state: 'Kerala', district: 'Wayanad' },
  'Kozhikode': { state: 'Kerala', district: 'Kozhikode' },
  'Calicut': { state: 'Kerala', district: 'Kozhikode' },
  
  // Goa
  'Goa': { state: 'Goa', district: 'North Goa' },
  'Panaji': { state: 'Goa', district: 'North Goa' },
  'Panjim': { state: 'Goa', district: 'North Goa' },
  
  // Himachal Pradesh
  'Shimla': { state: 'Himachal Pradesh', district: 'Shimla' },
  'Manali': { state: 'Himachal Pradesh', district: 'Kullu' },
  'Dharamshala': { state: 'Himachal Pradesh', district: 'Kangra' },
  
  // Uttarakhand
  'Dehradun': { state: 'Uttarakhand', district: 'Dehradun' },
  'Rishikesh': { state: 'Uttarakhand', district: 'Dehradun' },
  'Haridwar': { state: 'Uttarakhand', district: 'Haridwar' },
  'Mussoorie': { state: 'Uttarakhand', district: 'Dehradun' },
  
  // Odisha
  'Bhubaneswar': { state: 'Odisha', district: 'Khordha' },
  'Puri': { state: 'Odisha', district: 'Puri' },
  
  // Andhra Pradesh
  'Hyderabad': { state: 'Telangana', district: 'Hyderabad' },
  'Visakhapatnam': { state: 'Andhra Pradesh', district: 'Visakhapatnam' },
  'Vizag': { state: 'Andhra Pradesh', district: 'Visakhapatnam' },
  
  // Telangana
  'Warangal': { state: 'Telangana', district: 'Warangal' },
};

// Popular Destinations for Quick Selection
export interface PopularDestination {
  city: string;
  state: string;
  district: string;
  icon: string;
  description: string;
  category: 'beach' | 'hill-station' | 'cultural' | 'spiritual' | 'metropolitan' | 'wildlife' | 'heritage';
}

export const POPULAR_DESTINATIONS: PopularDestination[] = [
  {
    city: 'Mumbai',
    state: 'Maharashtra',
    district: 'Mumbai',
    icon: '🏙️',
    description: 'Financial capital & Bollywood',
    category: 'metropolitan'
  },
  {
    city: 'Delhi',
    state: 'Delhi',
    district: 'New Delhi',
    icon: '🏛️',
    description: 'Historic capital city',
    category: 'heritage'
  },
  {
    city: 'Goa',
    state: 'Goa',
    district: 'North Goa',
    icon: '🏖️',
    description: 'Beaches & Portuguese heritage',
    category: 'beach'
  },
  {
    city: 'Kerala',
    state: 'Kerala',
    district: '', // Empty district indicates "all districts in state"
    icon: '🌴',
    description: 'Backwaters & tropical paradise',
    category: 'beach'
  },
  {
    city: 'Jaipur',
    state: 'Rajasthan',
    district: 'Jaipur',
    icon: '🏰',
    description: 'Pink City & royal palaces',
    category: 'heritage'
  },
  {
    city: 'Agra',
    state: 'Uttar Pradesh',
    district: 'Agra',
    icon: '🕌',
    description: 'Taj Mahal & Mughal architecture',
    category: 'heritage'
  },
  {
    city: 'Varanasi',
    state: 'Uttar Pradesh',
    district: 'Varanasi',
    icon: '🕉️',
    description: 'Spiritual capital on the Ganges',
    category: 'spiritual'
  },
  {
    city: 'Bangalore',
    state: 'Karnataka',
    district: 'Bangalore',
    icon: '💻',
    description: 'IT hub & garden city',
    category: 'metropolitan'
  },
  {
    city: 'Manali',
    state: 'Himachal Pradesh',
    district: 'Kullu',
    icon: '⛰️',
    description: 'Mountain paradise & adventure',
    category: 'hill-station'
  },
  {
    city: 'Rishikesh',
    state: 'Uttarakhand',
    district: 'Dehradun',
    icon: '🧘',
    description: 'Yoga capital & adventure sports',
    category: 'spiritual'
  },
  {
    city: 'Munnar',
    state: 'Kerala',
    district: 'Idukki',
    icon: '🌿',
    description: 'Tea plantations & hill station',
    category: 'hill-station'
  },
  {
    city: 'Udaipur',
    state: 'Rajasthan',
    district: 'Udaipur',
    icon: '🏯',
    description: 'City of Lakes & palaces',
    category: 'heritage'
  },
  {
    city: 'Jodhpur',
    state: 'Rajasthan',
    district: 'Jodhpur',
    icon: '🔵',
    description: 'Blue City & desert forts',
    category: 'heritage'
  },
  {
    city: 'Kolkata',
    state: 'West Bengal',
    district: 'Kolkata',
    icon: '📚',
    description: 'Cultural capital & colonial heritage',
    category: 'cultural'
  },
  {
    city: 'Chennai',
    state: 'Tamil Nadu',
    district: 'Chennai',
    icon: '🎭',
    description: 'Temple city & classical arts',
    category: 'cultural'
  },
];

// Helper function to search cities
export function searchCity(query: string): Array<{ city: string; state: string; district: string; displayName: string }> {
  const lowerQuery = query.toLowerCase().trim();
  if (!lowerQuery) return [];
  
  const results: Array<{ city: string; state: string; district: string; displayName: string }> = [];
  const seen = new Set<string>();
  
  // First, check if query matches a state name exactly (prioritize state-level search)
  const matchedState = INDIAN_STATES.find(state => 
    state.toLowerCase() === lowerQuery || 
    state.toLowerCase().includes(lowerQuery)
  );
  
  if (matchedState) {
    // Add a special "All of [State]" option at the top
    results.push({
      city: `All of ${matchedState}`,
      state: matchedState,
      district: '', // Empty district indicates "all districts in state"
      displayName: `All of ${matchedState} (All Districts)`
    });
    seen.add(`${matchedState}-`);
  }
  
  // Search in city mappings
  for (const [cityName, location] of Object.entries(CITY_TO_LOCATION)) {
    if (cityName.toLowerCase().includes(lowerQuery) && !seen.has(`${location.state}-${location.district}`)) {
      results.push({
        city: cityName,
        state: location.state,
        district: location.district,
        displayName: `${cityName}, ${location.state}`
      });
      seen.add(`${location.state}-${location.district}`);
    }
  }
  
  // Search in popular destinations
  for (const dest of POPULAR_DESTINATIONS) {
    const key = `${dest.state}-${dest.district}`;
    if (!seen.has(key) && (
      dest.city.toLowerCase().includes(lowerQuery) ||
      dest.state.toLowerCase().includes(lowerQuery) ||
      dest.description.toLowerCase().includes(lowerQuery)
    )) {
      results.push({
        city: dest.city,
        state: dest.state,
        district: dest.district,
        displayName: `${dest.city}, ${dest.state}`
      });
      seen.add(key);
    }
  }
  
  // Search in districts
  for (const [state, districts] of Object.entries(DISTRICTS_BY_STATE)) {
    for (const district of districts) {
      const key = `${state}-${district}`;
      if (!seen.has(key) && district.toLowerCase().includes(lowerQuery)) {
        results.push({
          city: district,
          state: state,
          district: district,
          displayName: `${district}, ${state}`
        });
        seen.add(key);
      }
    }
  }
  
  return results.slice(0, 10); // Limit to 10 results
}

