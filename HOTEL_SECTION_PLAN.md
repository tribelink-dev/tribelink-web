# Hotel Section Planning Document

## Current State Analysis

### ✅ What's Already Implemented
- Hotel model with basic fields (name, location, price, rating, roomsAvailable)
- Hotels integrated into trip scheduling
- Hotel selection in trip schedule page
- Hotels displayed on map
- Hotel pricing included in trip cost

### ❌ What's Missing
- Admin/Host interface to manage hotels
- Hotel search and filtering
- Hotel details pages
- Hotel images and amenities
- Hotel availability management
- Hotel reviews/ratings system
- Hotel booking confirmation

---

## Recommended Hotel Section Architecture

### 1. **Hotel Management (Admin/Host Interface)**

#### Features:
- Add new hotels
- Edit existing hotels
- Delete hotels
- Upload hotel images
- Manage hotel availability
- View hotel bookings

#### Routes Structure:
```
/host/hotels           - List all hotels (for hosts/admins)
/host/hotels/add       - Add new hotel
/host/hotels/edit/[id] - Edit hotel
/host/hotels/[id]      - View hotel details and bookings
```

#### Database Enhancements Needed:
```javascript
{
  name: String,
  description: String,           // NEW
  images: [String],              // NEW - Array of image URLs
  amenities: [String],           // NEW - ['WiFi', 'Pool', 'Breakfast', etc.]
  location: {
    country: String,
    state: String,
    district: String,
    address: String,             // NEW - Full address
    coordinates: { lat, lng }
  },
  roomsAvailable: Number,
  totalRooms: Number,            // NEW
  pricePerNight: Number,
  rating: Number,
  ratingCount: Number,           // NEW
  reviews: [{                    // NEW
    user: ObjectId,
    rating: Number,
    comment: String,
    date: Date
  }],
  availability: [{              // NEW - Track room availability by date
    date: Date,
    roomsAvailable: Number
  }],
  contact: {                     // NEW
    phone: String,
    email: String
  },
  policies: {                    // NEW
    checkIn: String,             // "14:00"
    checkOut: String,            // "11:00"
    cancellationPolicy: String
  }
}
```

---

### 2. **Hotel Discovery (User Interface)**

#### Features:
- Browse hotels by location
- Filter by price, rating, amenities
- Search hotels
- View hotel details with images
- See hotel on map
- Read reviews

#### Routes Structure:
```
/hotels                - Browse all hotels
/hotels/search         - Search hotels by location/date
/hotels/[id]           - Hotel details page
```

---

### 3. **Hotel Booking Flow**

#### Current Flow:
1. User creates trip → Scheduler suggests hotels
2. User selects hotels in schedule page
3. Hotels saved with trip

#### Enhanced Flow:
1. User creates trip → Scheduler suggests hotels
2. User can browse/search hotels before selection
3. View hotel details with images, amenities, reviews
4. Select hotel for each day
5. Check room availability for dates
6. Confirm booking
7. Receive booking confirmation

---

## Implementation Plan

### Phase 1: Enhanced Hotel Model ✅
- [x] Add description field
- [x] Add images array
- [x] Add amenities array
- [x] Add contact information
- [x] Add policies (check-in/out times)
- [x] Add availability tracking

### Phase 2: Hotel Management Backend
- [ ] Create hotel routes (`/api/hotels`)
  - `GET /api/hotels` - List hotels with filters
  - `GET /api/hotels/:id` - Get hotel details
  - `POST /api/hotels` - Add hotel (admin/host)
  - `PUT /api/hotels/:id` - Update hotel
  - `DELETE /api/hotels/:id` - Delete hotel
  - `GET /api/hotels/search` - Search hotels
  - `GET /api/hotels/availability/:id` - Check availability

### Phase 3: Hotel Management Frontend (Host/Admin)
- [ ] Create `/host/hotels` page
- [ ] Create `/host/hotels/add` page
- [ ] Create `/host/hotels/edit/[id]` page
- [ ] Add hotel image upload
- [ ] Add amenities selection

### Phase 4: Hotel Discovery Frontend (Users)
- [ ] Create `/hotels` browse page
- [ ] Create `/hotels/[id]` details page
- [ ] Add hotel search/filter functionality
- [ ] Add hotel image gallery
- [ ] Display amenities and reviews

### Phase 5: Enhanced Booking Flow
- [ ] Improve hotel selection UI in schedule page
- [ ] Add hotel preview modal
- [ ] Show hotel images in selection dropdown
- [ ] Add availability check before booking
- [ ] Send booking confirmation

---

## Detailed Feature Specifications

### Hotel Management Page (`/host/hotels`)

**Features:**
- List all hotels with search/filter
- Quick actions: Edit, Delete, View Bookings
- Statistics: Total bookings, Revenue, Occupancy rate
- Add new hotel button

**UI Components:**
- Hotel card with image, name, location, price, rating
- Search bar
- Filter by location, price range, rating
- Pagination

### Add/Edit Hotel Page

**Form Fields:**
1. **Basic Info:**
   - Hotel name *
   - Description *
   - Location (Country, State, District) *
   - Full address
   - Coordinates (lat/lng) - Auto-fill from address or manual

2. **Media:**
   - Upload multiple images (at least 1 main image)
   - Image preview and reorder

3. **Pricing & Capacity:**
   - Price per night *
   - Total rooms *
   - Rooms available *

4. **Amenities:**
   - Checkboxes: WiFi, Pool, Gym, Breakfast, Parking, etc.

5. **Contact:**
   - Phone number
   - Email address

6. **Policies:**
   - Check-in time (default: 14:00)
   - Check-out time (default: 11:00)
   - Cancellation policy

### Hotel Details Page (`/hotels/[id]`)

**Sections:**
1. **Hero Section:**
   - Image gallery/carousel
   - Hotel name, location, rating
   - Price per night

2. **Overview:**
   - Description
   - Amenities list
   - Location map

3. **Booking:**
   - Check availability
   - Select dates
   - Book now button

4. **Reviews:**
   - Average rating
   - Review cards with user name, rating, comment, date

5. **Contact & Policies:**
   - Contact information
   - Check-in/out times
   - Cancellation policy

### Hotel Search Page (`/hotels`)

**Features:**
- Search by location (country, state, district)
- Filter by:
  - Price range (slider)
  - Rating (stars)
  - Amenities (checkboxes)
  - Availability dates
- Sort by: Price (low to high), Rating, Name
- Map view toggle
- Grid/List view toggle

**Display:**
- Hotel cards with:
  - Main image
  - Name and location
  - Price per night
  - Rating (stars + number)
  - Amenities badges
  - Quick view button

---

## API Endpoints Needed

### Hotel CRUD Operations
```
GET    /api/hotels                    - List hotels (with filters)
GET    /api/hotels/:id                - Get hotel details
POST   /api/hotels                    - Create hotel (admin/host)
PUT    /api/hotels/:id                - Update hotel
DELETE /api/hotels/:id                - Delete hotel
```

### Hotel Search & Availability
```
GET    /api/hotels/search             - Search hotels
GET    /api/hotels/:id/availability    - Check availability for dates
GET    /api/hotels/:id/reviews         - Get hotel reviews
POST   /api/hotels/:id/reviews         - Add review (authenticated users)
```

### Hotel Images
```
POST   /api/hotels/:id/images          - Upload hotel images
DELETE /api/hotels/:id/images/:imageId - Delete image
```

---

## Database Schema Enhancements

### Enhanced Hotel Model
```javascript
{
  name: { type: String, required: true },
  description: { type: String },
  images: [{ url: String, isMain: Boolean }],
  amenities: [{ type: String }], // ['WiFi', 'Pool', 'Gym', 'Breakfast', 'Parking', 'Air Conditioning', 'Room Service']
  location: {
    country: { type: String, required: true },
    state: { type: String, required: true },
    district: { type: String, required: true },
    address: { type: String },
    coordinates: { lat: Number, lng: Number }
  },
  roomsAvailable: { type: Number, required: true, min: 0 },
  totalRooms: { type: Number, required: true },
  pricePerNight: { type: Number, required: true, min: 0 },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  ratingCount: { type: Number, default: 0 },
  reviews: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    date: { type: Date, default: Date.now }
  }],
  availability: [{
    date: Date,
    roomsAvailable: Number
  }],
  contact: {
    phone: String,
    email: String
  },
  policies: {
    checkIn: { type: String, default: '14:00' },
    checkOut: { type: String, default: '11:00' },
    cancellationPolicy: String
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Host' }, // Optional: track who added hotel
  timestamps: true
}
```

---

## Implementation Priority

### 🔴 High Priority (Core Features)
1. Enhanced hotel model with images and amenities
2. Hotel CRUD routes for admin/host
3. Hotel management UI for hosts
4. Improved hotel selection in schedule page

### 🟡 Medium Priority (User Experience)
1. Hotel search and discovery page
2. Hotel details page with images
3. Hotel reviews system
4. Availability checking

### 🟢 Low Priority (Nice to Have)
1. Hotel comparison feature
2. Hotel recommendations based on preferences
3. Hotel wishlist/favorites
4. Hotel booking calendar view

---

## Next Steps

1. **Enhance Hotel Model** - Add missing fields (description, images, amenities)
2. **Create Hotel Routes** - Backend API endpoints
3. **Build Hotel Management UI** - Host interface to add/edit hotels
4. **Improve Hotel Selection** - Better UI in schedule page with images
5. **Add Hotel Discovery** - Browse/search hotels page

Would you like me to start implementing any of these features?

