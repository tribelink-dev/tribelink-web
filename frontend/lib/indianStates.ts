// Indian States and Districts data
export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi'
];

// Districts for all major states
export const DISTRICTS_BY_STATE: Record<string, string[]> = {
  'Kerala': [
    'Alappuzha', 'Ernakulam', 'Idukki', 'Kannur', 'Kasaragod',
    'Kollam', 'Kottayam', 'Kozhikode', 'Malappuram', 'Palakkad',
    'Pathanamthitta', 'Thiruvananthapuram', 'Thrissur', 'Wayanad'
  ],
  'Tamil Nadu': [
    'Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem',
    'Tirunelveli', 'Tiruppur', 'Erode', 'Vellore', 'Thoothukudi',
    'Thanjavur', 'Dindigul', 'Kanchipuram', 'Tiruvallur', 'Karur',
    'Nagercoil', 'Ooty', 'Kodaikanal', 'Rameswaram', 'Mahabalipuram'
  ],
  'Karnataka': [
    'Bangalore', 'Mysore', 'Hubli', 'Mangalore', 'Belgaum',
    'Gulbarga', 'Davangere', 'Bellary', 'Bijapur', 'Raichur',
    'Udupi', 'Shimoga', 'Chikmagalur', 'Hampi', 'Gokarna',
    'Coorg', 'Chikballapur', 'Tumkur', 'Hassan', 'Mandya'
  ],
  'Maharashtra': [
    'Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad',
    'Solapur', 'Amravati', 'Kolhapur', 'Sangli', 'Satara',
    'Thane', 'Raigad', 'Ratnagiri', 'Sindhudurg', 'Lonavala',
    'Mahabaleshwar', 'Alibaug', 'Shirdi', 'Ajanta', 'Ellora'
  ],
  'Gujarat': [
    'Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar',
    'Jamnagar', 'Gandhinagar', 'Junagadh', 'Bharuch', 'Anand',
    'Dwarka', 'Somnath', 'Palanpur', 'Mehsana', 'Porbandar',
    'Kutch', 'Gir', 'Saputara', 'Patan', 'Diu'
  ],
  'Rajasthan': [
    'Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Ajmer',
    'Udaipur', 'Bhilwara', 'Alwar', 'Bharatpur', 'Sikar',
    'Pushkar', 'Mount Abu', 'Chittorgarh', 'Bundi', 'Jaisalmer',
    'Banswara', 'Barmer', 'Churu', 'Dausa', 'Hanumangarh'
  ],
  'West Bengal': [
    'Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri',
    'Malda', 'Jalpaiguri', 'Kharagpur', 'Bardhaman', 'Darjeeling',
    'Kalimpong', 'Kurseong', 'Mirik', 'Sunderbans', 'Shantiniketan',
    'Murshidabad', 'Cooch Behar', 'Bankura', 'Purulia', 'Birbhum'
  ],
  'Uttar Pradesh': [
    'Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Allahabad',
    'Meerut', 'Ghaziabad', 'Bareilly', 'Aligarh', 'Moradabad',
    'Mathura', 'Ayodhya', 'Prayagraj', 'Sarnath', 'Fatehpur Sikri',
    'Noida', 'Greater Noida', 'Gorakhpur', 'Jhansi', 'Saharanpur'
  ],
  'Delhi': [
    'New Delhi', 'Central Delhi', 'North Delhi', 'South Delhi',
    'East Delhi', 'West Delhi', 'North East Delhi', 'North West Delhi',
    'South West Delhi', 'Shahdara'
  ],
  'Himachal Pradesh': [
    'Shimla', 'Manali', 'Dharamshala', 'Kullu', 'Kangra',
    'Mandi', 'Chamba', 'Solan', 'Kasauli', 'Dalhousie',
    'Spiti', 'Kinnaur', 'Lahaul', 'Kasauli', 'Palampur',
    'Bir', 'McLeod Ganj', 'Kasol', 'Tosh', 'Parvati Valley'
  ],
  'Uttarakhand': [
    'Dehradun', 'Rishikesh', 'Haridwar', 'Mussoorie', 'Nainital',
    'Almora', 'Ranikhet', 'Auli', 'Chopta', 'Valley of Flowers',
    'Kedarnath', 'Badrinath', 'Gangotri', 'Yamunotri', 'Jim Corbett',
    'Lansdowne', 'Chakrata', 'Pithoragarh', 'Bageshwar', 'Rudraprayag'
  ],
  'Goa': [
    'North Goa', 'South Goa', 'Panaji', 'Calangute', 'Baga',
    'Anjuna', 'Vagator', 'Arambol', 'Palolem', 'Colva',
    'Candolim', 'Morjim', 'Ashwem', 'Agonda', 'Benaulim'
  ],
  'Odisha': [
    'Bhubaneswar', 'Puri', 'Cuttack', 'Rourkela', 'Sambalpur',
    'Konark', 'Jagannath Puri', 'Chilika', 'Gopalpur', 'Paradip',
    'Bargarh', 'Balangir', 'Koraput', 'Rayagada', 'Berhampur'
  ],
  'Andhra Pradesh': [
    'Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Tirupati',
    'Kurnool', 'Kakinada', 'Rajahmundry', 'Anantapur', 'Kadapa',
    'Chittoor', 'Ongole', 'Eluru', 'Machilipatnam', 'Srikakulam'
  ],
  'Telangana': [
    'Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Ramagundam',
    'Khammam', 'Mahbubnagar', 'Nalgonda', 'Adilabad', 'Medak',
    'Siddipet', 'Sangareddy', 'Jagitial', 'Mancherial', 'Nirmal'
  ],
  'Punjab': [
    'Amritsar', 'Ludhiana', 'Chandigarh', 'Jalandhar', 'Patiala',
    'Bathinda', 'Pathankot', 'Hoshiarpur', 'Mohali', 'Ferozepur',
    'Kapurthala', 'Moga', 'Abohar', 'Muktsar', 'Faridkot'
  ],
  'Haryana': [
    'Gurgaon', 'Faridabad', 'Panipat', 'Ambala', 'Yamunanagar',
    'Rohtak', 'Hisar', 'Karnal', 'Sonipat', 'Panchkula',
    'Bhiwani', 'Sirsa', 'Jind', 'Rewari', 'Palwal'
  ],
  'Madhya Pradesh': [
    'Bhopal', 'Indore', 'Gwalior', 'Jabalpur', 'Ujjain',
    'Sagar', 'Ratlam', 'Rewa', 'Satna', 'Chhindwara',
    'Khajuraho', 'Orchha', 'Mandu', 'Sanchi', 'Pachmarhi'
  ],
  'Bihar': [
    'Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Darbhanga',
    'Purnia', 'Arrah', 'Bihar Sharif', 'Katihar', 'Chapra',
    'Bodh Gaya', 'Nalanda', 'Rajgir', 'Vaishali', 'Sitamarhi'
  ],
  'Jharkhand': [
    'Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Hazaribagh',
    'Giridih', 'Deoghar', 'Dumka', 'Chaibasa', 'Ramgarh'
  ],
  'Assam': [
    'Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon',
    'Tinsukia', 'Tezpur', 'Barpeta', 'Sivasagar', 'Golaghat',
    'Kaziranga', 'Manas', 'Majuli', 'Haflong', 'Diphu'
  ],
  'Meghalaya': [
    'Shillong', 'Tura', 'Jowai', 'Nongpoh', 'Cherrapunji',
    'Mawlynnong', 'Dawki', 'Mawsynram', 'Williamnagar', 'Baghmara'
  ],
  'Manipur': [
    'Imphal', 'Thoubal', 'Bishnupur', 'Churachandpur', 'Ukhrul',
    'Senapati', 'Tamenglong', 'Chandel', 'Kangpokpi', 'Jiribam'
  ],
  'Nagaland': [
    'Kohima', 'Dimapur', 'Mokokchung', 'Tuensang', 'Wokha',
    'Zunheboto', 'Phek', 'Mon', 'Kiphire', 'Longleng'
  ],
  'Tripura': [
    'Agartala', 'Udaipur', 'Dharmanagar', 'Kailashahar', 'Belonia',
    'Khowai', 'Ambassa', 'Sabroom', 'Sonamura', 'Teliamura'
  ],
  'Mizoram': [
    'Aizawl', 'Lunglei', 'Champhai', 'Serchhip', 'Kolasib',
    'Mamit', 'Saiha', 'Lawngtlai', 'Saitual', 'Hnahthial'
  ],
  'Arunachal Pradesh': [
    'Itanagar', 'Tawang', 'Bomdila', 'Ziro', 'Pasighat',
    'Tezu', 'Along', 'Naharlagun', 'Roing', 'Daporijo'
  ],
  'Sikkim': [
    'Gangtok', 'Namchi', 'Mangan', 'Gyalshing', 'Ravangla',
    'Lachung', 'Lachen', 'Pelling', 'Yuksom', 'Zuluk'
  ],
  'Chhattisgarh': [
    'Raipur', 'Bhilai', 'Bilaspur', 'Durg', 'Korba',
    'Raigarh', 'Jagdalpur', 'Ambikapur', 'Rajnandgaon', 'Dhamtari'
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
  'Nizamabad': { state: 'Telangana', district: 'Nizamabad' },
  'Karimnagar': { state: 'Telangana', district: 'Karimnagar' },
  
  // Punjab
  'Amritsar': { state: 'Punjab', district: 'Amritsar' },
  'Ludhiana': { state: 'Punjab', district: 'Ludhiana' },
  'Chandigarh': { state: 'Punjab', district: 'Chandigarh' },
  'Jalandhar': { state: 'Punjab', district: 'Jalandhar' },
  'Patiala': { state: 'Punjab', district: 'Patiala' },
  
  // Haryana
  'Gurgaon': { state: 'Haryana', district: 'Gurgaon' },
  'Gurugram': { state: 'Haryana', district: 'Gurgaon' },
  'Faridabad': { state: 'Haryana', district: 'Faridabad' },
  'Panipat': { state: 'Haryana', district: 'Panipat' },
  
  // Madhya Pradesh
  'Bhopal': { state: 'Madhya Pradesh', district: 'Bhopal' },
  'Indore': { state: 'Madhya Pradesh', district: 'Indore' },
  'Gwalior': { state: 'Madhya Pradesh', district: 'Gwalior' },
  'Jabalpur': { state: 'Madhya Pradesh', district: 'Jabalpur' },
  'Ujjain': { state: 'Madhya Pradesh', district: 'Ujjain' },
  'Khajuraho': { state: 'Madhya Pradesh', district: 'Chhatarpur' },
  
  // Bihar
  'Patna': { state: 'Bihar', district: 'Patna' },
  'Gaya': { state: 'Bihar', district: 'Gaya' },
  'Bhagalpur': { state: 'Bihar', district: 'Bhagalpur' },
  'Bodh Gaya': { state: 'Bihar', district: 'Gaya' },
  'Nalanda': { state: 'Bihar', district: 'Nalanda' },
  
  // Jharkhand
  'Ranchi': { state: 'Jharkhand', district: 'Ranchi' },
  'Jamshedpur': { state: 'Jharkhand', district: 'East Singhbhum' },
  'Dhanbad': { state: 'Jharkhand', district: 'Dhanbad' },
  
  // Assam
  'Guwahati': { state: 'Assam', district: 'Kamrup Metropolitan' },
  'Dibrugarh': { state: 'Assam', district: 'Dibrugarh' },
  'Jorhat': { state: 'Assam', district: 'Jorhat' },
  'Kaziranga': { state: 'Assam', district: 'Golaghat' },
  'Majuli': { state: 'Assam', district: 'Majuli' },
  
  // Odisha - More cities
  'Cuttack': { state: 'Odisha', district: 'Cuttack' },
  'Rourkela': { state: 'Odisha', district: 'Sundergarh' },
  'Konark': { state: 'Odisha', district: 'Puri' },
  'Chilika': { state: 'Odisha', district: 'Puri' },
  
  // Andhra Pradesh - More cities
  'Vijayawada': { state: 'Andhra Pradesh', district: 'Krishna' },
  'Guntur': { state: 'Andhra Pradesh', district: 'Guntur' },
  'Tirupati': { state: 'Andhra Pradesh', district: 'Chittoor' },
  'Kurnool': { state: 'Andhra Pradesh', district: 'Kurnool' },
  
  // More Kerala destinations
  'Kumarakom': { state: 'Kerala', district: 'Kottayam' },
  'Varkala': { state: 'Kerala', district: 'Thiruvananthapuram' },
  'Periyar': { state: 'Kerala', district: 'Idukki' },
  'Bekal': { state: 'Kerala', district: 'Kasaragod' },
  'Guruvayur': { state: 'Kerala', district: 'Thrissur' },
  'Kannur': { state: 'Kerala', district: 'Kannur' },
  'Thrissur': { state: 'Kerala', district: 'Thrissur' },
  
  // More Tamil Nadu destinations
  'Ooty': { state: 'Tamil Nadu', district: 'Nilgiris' },
  'Kodaikanal': { state: 'Tamil Nadu', district: 'Dindigul' },
  'Rameswaram': { state: 'Tamil Nadu', district: 'Ramanathapuram' },
  'Mahabalipuram': { state: 'Tamil Nadu', district: 'Kanchipuram' },
  'Kanchipuram': { state: 'Tamil Nadu', district: 'Kanchipuram' },
  'Thanjavur': { state: 'Tamil Nadu', district: 'Thanjavur' },
  
  // More Karnataka destinations
  'Hampi': { state: 'Karnataka', district: 'Bellary' },
  'Gokarna': { state: 'Karnataka', district: 'Uttara Kannada' },
  'Coorg': { state: 'Karnataka', district: 'Kodagu' },
  'Chikmagalur': { state: 'Karnataka', district: 'Chikmagalur' },
  'Udupi': { state: 'Karnataka', district: 'Udupi' },
  'Shimoga': { state: 'Karnataka', district: 'Shimoga' },
  
  // More Maharashtra destinations
  'Lonavala': { state: 'Maharashtra', district: 'Pune' },
  'Mahabaleshwar': { state: 'Maharashtra', district: 'Satara' },
  'Alibaug': { state: 'Maharashtra', district: 'Raigad' },
  'Shirdi': { state: 'Maharashtra', district: 'Ahmednagar' },
  'Ajanta': { state: 'Maharashtra', district: 'Aurangabad' },
  'Ellora': { state: 'Maharashtra', district: 'Aurangabad' },
  
  // More Rajasthan destinations
  'Pushkar': { state: 'Rajasthan', district: 'Ajmer' },
  'Mount Abu': { state: 'Rajasthan', district: 'Sirohi' },
  'Chittorgarh': { state: 'Rajasthan', district: 'Chittorgarh' },
  'Bundi': { state: 'Rajasthan', district: 'Bundi' },
  'Jaisalmer': { state: 'Rajasthan', district: 'Jaisalmer' },
  'Bikaner': { state: 'Rajasthan', district: 'Bikaner' },
  'Ajmer': { state: 'Rajasthan', district: 'Ajmer' },
  
  // More Himachal Pradesh destinations
  'Kasauli': { state: 'Himachal Pradesh', district: 'Solan' },
  'Dalhousie': { state: 'Himachal Pradesh', district: 'Chamba' },
  'Spiti': { state: 'Himachal Pradesh', district: 'Lahaul and Spiti' },
  'Kinnaur': { state: 'Himachal Pradesh', district: 'Kinnaur' },
  'Palampur': { state: 'Himachal Pradesh', district: 'Kangra' },
  'Bir': { state: 'Himachal Pradesh', district: 'Kangra' },
  'McLeod Ganj': { state: 'Himachal Pradesh', district: 'Kangra' },
  'Kasol': { state: 'Himachal Pradesh', district: 'Kullu' },
  
  // More Uttarakhand destinations
  'Nainital': { state: 'Uttarakhand', district: 'Nainital' },
  'Almora': { state: 'Uttarakhand', district: 'Almora' },
  'Ranikhet': { state: 'Uttarakhand', district: 'Almora' },
  'Auli': { state: 'Uttarakhand', district: 'Chamoli' },
  'Chopta': { state: 'Uttarakhand', district: 'Rudraprayag' },
  'Valley of Flowers': { state: 'Uttarakhand', district: 'Chamoli' },
  'Kedarnath': { state: 'Uttarakhand', district: 'Rudraprayag' },
  'Badrinath': { state: 'Uttarakhand', district: 'Chamoli' },
  'Gangotri': { state: 'Uttarakhand', district: 'Uttarkashi' },
  'Yamunotri': { state: 'Uttarakhand', district: 'Uttarkashi' },
  'Jim Corbett': { state: 'Uttarakhand', district: 'Nainital' },
  'Lansdowne': { state: 'Uttarakhand', district: 'Pauri Garhwal' },
  
  // More Goa destinations
  'Calangute': { state: 'Goa', district: 'North Goa' },
  'Baga': { state: 'Goa', district: 'North Goa' },
  'Anjuna': { state: 'Goa', district: 'North Goa' },
  'Vagator': { state: 'Goa', district: 'North Goa' },
  'Arambol': { state: 'Goa', district: 'North Goa' },
  'Palolem': { state: 'Goa', district: 'South Goa' },
  'Colva': { state: 'Goa', district: 'South Goa' },
  
  // More West Bengal destinations
  'Darjeeling': { state: 'West Bengal', district: 'Darjeeling' },
  'Kalimpong': { state: 'West Bengal', district: 'Kalimpong' },
  'Kurseong': { state: 'West Bengal', district: 'Darjeeling' },
  'Mirik': { state: 'West Bengal', district: 'Darjeeling' },
  'Sunderbans': { state: 'West Bengal', district: 'South 24 Parganas' },
  'Shantiniketan': { state: 'West Bengal', district: 'Birbhum' },
  
  // More Uttar Pradesh destinations
  'Mathura': { state: 'Uttar Pradesh', district: 'Mathura' },
  'Ayodhya': { state: 'Uttar Pradesh', district: 'Ayodhya' },
  'Sarnath': { state: 'Uttar Pradesh', district: 'Varanasi' },
  'Fatehpur Sikri': { state: 'Uttar Pradesh', district: 'Agra' },
  'Noida': { state: 'Uttar Pradesh', district: 'Gautam Buddha Nagar' },
  'Greater Noida': { state: 'Uttar Pradesh', district: 'Gautam Buddha Nagar' },
  
  // More Gujarat destinations
  'Dwarka': { state: 'Gujarat', district: 'Devbhoomi Dwarka' },
  'Somnath': { state: 'Gujarat', district: 'Gir Somnath' },
  'Kutch': { state: 'Gujarat', district: 'Kutch' },
  'Gir': { state: 'Gujarat', district: 'Gir Somnath' },
  'Saputara': { state: 'Gujarat', district: 'Dang' },
  
  // Northeast destinations
  'Shillong': { state: 'Meghalaya', district: 'East Khasi Hills' },
  'Cherrapunji': { state: 'Meghalaya', district: 'East Khasi Hills' },
  'Mawlynnong': { state: 'Meghalaya', district: 'East Khasi Hills' },
  'Dawki': { state: 'Meghalaya', district: 'West Jaintia Hills' },
  'Gangtok': { state: 'Sikkim', district: 'East Sikkim' },
  'Pelling': { state: 'Sikkim', district: 'West Sikkim' },
  'Lachung': { state: 'Sikkim', district: 'North Sikkim' },
  'Lachen': { state: 'Sikkim', district: 'North Sikkim' },
  'Tawang': { state: 'Arunachal Pradesh', district: 'Tawang' },
  'Ziro': { state: 'Arunachal Pradesh', district: 'Lower Subansiri' },
  'Imphal': { state: 'Manipur', district: 'Imphal East' },
  'Kohima': { state: 'Nagaland', district: 'Kohima' },
  'Aizawl': { state: 'Mizoram', district: 'Aizawl' },
  'Agartala': { state: 'Tripura', district: 'West Tripura' },
  
  // Chhattisgarh
  'Raipur': { state: 'Chhattisgarh', district: 'Raipur' },
  'Bhilai': { state: 'Chhattisgarh', district: 'Durg' },
  'Bilaspur': { state: 'Chhattisgarh', district: 'Bilaspur' },
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
  {
    city: 'Pune',
    state: 'Maharashtra',
    district: 'Pune',
    icon: '🎓',
    description: 'Oxford of the East & IT hub',
    category: 'metropolitan'
  },
  {
    city: 'Hyderabad',
    state: 'Telangana',
    district: 'Hyderabad',
    icon: '💎',
    description: 'City of Pearls & biryani',
    category: 'cultural'
  },
  {
    city: 'Amritsar',
    state: 'Punjab',
    district: 'Amritsar',
    icon: '🕊️',
    description: 'Golden Temple & Sikh heritage',
    category: 'spiritual'
  },
  {
    city: 'Shimla',
    state: 'Himachal Pradesh',
    district: 'Shimla',
    icon: '🏔️',
    description: 'Queen of Hills & colonial charm',
    category: 'hill-station'
  },
  {
    city: 'Ooty',
    state: 'Tamil Nadu',
    district: 'Nilgiris',
    icon: '🌲',
    description: 'Queen of Hill Stations',
    category: 'hill-station'
  },
  {
    city: 'Hampi',
    state: 'Karnataka',
    district: 'Bellary',
    icon: '🏛️',
    description: 'Ancient ruins & UNESCO site',
    category: 'heritage'
  },
  {
    city: 'Pushkar',
    state: 'Rajasthan',
    district: 'Ajmer',
    icon: '🐪',
    description: 'Sacred lake & camel fair',
    category: 'spiritual'
  },
  {
    city: 'Darjeeling',
    state: 'West Bengal',
    district: 'Darjeeling',
    icon: '🍵',
    description: 'Tea gardens & toy train',
    category: 'hill-station'
  },
  {
    city: 'Gokarna',
    state: 'Karnataka',
    district: 'Uttara Kannada',
    icon: '🏖️',
    description: 'Beach paradise & temples',
    category: 'beach'
  },
  {
    city: 'Kodaikanal',
    state: 'Tamil Nadu',
    district: 'Dindigul',
    icon: '🌺',
    description: 'Princess of Hill Stations',
    category: 'hill-station'
  },
  {
    city: 'Coorg',
    state: 'Karnataka',
    district: 'Kodagu',
    icon: '☕',
    description: 'Coffee plantations & misty hills',
    category: 'hill-station'
  },
  {
    city: 'Lonavala',
    state: 'Maharashtra',
    district: 'Pune',
    icon: '🌉',
    description: 'Monsoon paradise & waterfalls',
    category: 'hill-station'
  },
  {
    city: 'Mount Abu',
    state: 'Rajasthan',
    district: 'Sirohi',
    icon: '⛰️',
    description: 'Only hill station in Rajasthan',
    category: 'hill-station'
  },
  {
    city: 'Nainital',
    state: 'Uttarakhand',
    district: 'Nainital',
    icon: '🛶',
    description: 'Lake city & mountain views',
    category: 'hill-station'
  },
  {
    city: 'Shillong',
    state: 'Meghalaya',
    district: 'East Khasi Hills',
    icon: '🌧️',
    description: 'Scotland of the East',
    category: 'hill-station'
  },
  {
    city: 'Gangtok',
    state: 'Sikkim',
    district: 'East Sikkim',
    icon: '🏔️',
    description: 'Gateway to Himalayas',
    category: 'hill-station'
  },
  {
    city: 'Khajuraho',
    state: 'Madhya Pradesh',
    district: 'Chhatarpur',
    icon: '🗿',
    description: 'Temple art & architecture',
    category: 'heritage'
  },
  {
    city: 'Bodh Gaya',
    state: 'Bihar',
    district: 'Gaya',
    icon: '🧘',
    description: 'Buddhist pilgrimage site',
    category: 'spiritual'
  },
  {
    city: 'Kaziranga',
    state: 'Assam',
    district: 'Golaghat',
    icon: '🦏',
    description: 'One-horned rhino sanctuary',
    category: 'wildlife'
  },
  {
    city: 'Rishikesh',
    state: 'Uttarakhand',
    district: 'Dehradun',
    icon: '🧘',
    description: 'Yoga capital & adventure sports',
    category: 'spiritual'
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

