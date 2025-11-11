# Test Users Documentation

This document contains sample test user credentials for all account types in the Tribelink Platform.

## How to Create Test Users

Run the script to create all test users:
```bash
node backend/scripts/createTestUsers.js
```

## Regular Users (Travelers)

These users can book trips and experiences.

| Email | Phone Number | Password | Name |
|-------|--------------|----------|------|
| traveler1@test.com | +1234567890 | password123 | John Traveler |
| traveler2@test.com | +1234567891 | password123 | Sarah Explorer |
| traveler3@test.com | +1234567892 | password123 | Mike Adventurer |

## Service Providers

### Experience Hosts

These providers offer experiences and activities.

| Email | Phone Number | Password | Name |
|-------|--------------|----------|------|
| experience.host1@test.com | +1234567800 | password123 | Alice Experience Host |
| experience.host2@test.com | +1234567801 | password123 | Bob Adventure Guide |

### Tour Guides

These providers offer guided tours.

| Email | Phone Number | Password | Name |
|-------|--------------|----------|------|
| guide1@test.com | +1234567810 | password123 | Emma Tour Guide |
| guide2@test.com | +1234567811 | password123 | David Local Expert |

### Hotel Owners (Accommodation Providers)

These providers manage hotel properties.

| Email | Phone Number | Password | Name |
|-------|--------------|----------|------|
| hotel.owner1@test.com | +1234567820 | password123 | Luxury Hotel Group |
| hotel.owner2@test.com | +1234567821 | password123 | Budget Stay Inn |
| hotel.owner3@test.com | +1234567822 | password123 | Boutique Hotel Collection |

### Driver Partners

These providers offer transportation services.

| Email | Phone Number | Password | Name |
|-------|--------------|----------|------|
| driver1@test.com | +1234567830 | password123 | Premium Transport Services |
| driver2@test.com | +1234567831 | password123 | Comfort Rides |
| driver3@test.com | +1234567832 | password123 | Reliable Chauffeur |

## Login Information

All test users use the same password: **password123**

### For Regular Users:
- Login using email and phone number
- Example: `traveler1@test.com` / `+1234567890` / `password123`

### For Service Providers:
- Login using email and phone number  
- Example: `experience.host1@test.com` / `+1234567800` / `password123`

## Notes

- All phone numbers follow the E.164 international format
- All emails are lowercase
- The script will skip users that already exist in the database
- Use these credentials for testing and development only

