# PaPa-Hi Social App for Fathers

## Overview

PaPa-Hi is a comprehensive social platform designed specifically for fathers in the Netherlands to connect, organize playdates, and discover family-friendly locations. The application features a modern full-stack architecture with real-time communication capabilities, location-based services, and progressive web app functionality.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Components**: Radix UI primitives with custom styled components
- **Styling**: Tailwind CSS with custom design system
- **Internationalization**: React i18next for multi-language support
- **Maps**: Leaflet for interactive maps and location services
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Authentication**: Passport.js with local strategy and Google OAuth
- **Session Management**: PostgreSQL-backed sessions using connect-pg-simple
- **Real-time Communication**: WebSocket server for live chat functionality
- **File Upload**: Multer for handling image uploads

### Data Storage Solutions
- **Primary Database**: PostgreSQL via Neon serverless
- **ORM**: Drizzle ORM with full TypeScript support
- **Session Store**: PostgreSQL table for user sessions
- **File Storage**: Local filesystem with organized directory structure
- **Image Management**: Structured upload system for profile and place images

## Key Components

### User Management System
- Role-based access control (user/admin)
- Profile management with avatar uploads
- Google OAuth integration alongside traditional authentication
- Password hashing using Node.js crypto with scrypt

### Location Services
- OpenStreetMap integration via Overpass API for playground discovery
- Geocoding service using Nominatim for address resolution
- User location tracking with privacy controls
- Distance calculations for nearby content

### Social Features
- Real-time chat system with WebSocket connections
- Playdate creation and management
- User discovery and connection features
- Rating and review system for places
- Dad matching system based on location proximity and children's age compatibility

### Progressive Web App Features
- Web push notifications with VAPID keys
- Service worker for offline capabilities
- App manifest for mobile installation
- Privacy-compliant notification system
- Location-based playdate notifications for nearby events

### Admin Dashboard
- User management and role assignment
- Analytics tracking (page views, feature usage, user activity)
- Admin action logging with audit trails
- Comprehensive user statistics

## Data Flow

### Authentication Flow
1. User registers/logs in via local or Google OAuth
2. Server creates session and stores in PostgreSQL
3. Client receives authentication state via React Query
4. Protected routes enforce authentication requirements

### Playdate Creation Flow
1. User selects location (optional) from places directory
2. Form submission with validation via React Hook Form + Zod
3. Server geocodes address and stores playdate data
4. Real-time notifications sent to relevant users
5. Email notifications queued for delivery

### Real-time Communication
1. WebSocket connection established on chat page load
2. Messages broadcast to all participants in chat room
3. Message persistence in PostgreSQL database
4. Online/offline status tracking

## External Dependencies

### Email Service
- **Resend API**: Transactional email delivery with domain verification
- **Email Queue System**: Reliable delivery with retry logic
- **Templates**: Animated HTML email templates with inline CSS

### Maps and Location
- **OpenStreetMap**: Free mapping data via Overpass API
- **Nominatim**: Geocoding service for address resolution
- **Leaflet**: Interactive map components

### Authentication
- **Google OAuth**: Third-party authentication integration
- **Firebase Auth**: Additional authentication provider support

### Push Notifications
- **Web Push Protocol**: Standards-compliant push notifications
- **VAPID**: Voluntary Application Server Identification

## Deployment Strategy

### Environment Configuration
- **Development**: Local PostgreSQL with hot reloading
- **Production**: Neon serverless PostgreSQL with optimized builds
- **Build Process**: Vite for frontend, esbuild for backend bundling

### Database Management
- **Migrations**: Drizzle Kit for schema management
- **Seeding**: Automated test data generation
- **Backup**: Environment-specific database URLs

### Monitoring and Analytics
- **User Activity**: Comprehensive tracking system
- **Admin Logs**: Audit trail for administrative actions
- **Performance**: Query optimization and response monitoring

## Recent Changes

### August 3, 2025 - Recurring Daily Playdates Implementation
- **Complete Recurring System**: Successfully implemented daily recurring playdates allowing users to create events that repeat every day until a specified end date
- **Enhanced Database Schema**: Added new fields (isRecurring, recurringType, recurringEndDate, parentPlaydateId) to support recurring functionality
- **Smart Backend Logic**: Automatic creation of multiple playdate entries when user selects daily recurrence with proper date calculations
- **Visual Indicators**: Added "Recurring" badge with blue icon on playdate cards to identify recurring events
- **Form Enhancements**: Updated create playdate form with recurring checkbox, repeat type selector, and end date picker with validation
- **Validation Fixes**: Proper date conversion for all timestamp fields including recurringEndDate
- **Dependency Updates**: Updated @types/node package to latest version for better TypeScript support
- **Production Ready**: Successfully tested with 21 recurring playdates created from August 3-24, 2025

### June 29, 2025 - Dad Matching Interface Cleanup and Navigation Fix
- **Cleaned Navigation Flow**: Removed duplicate preferences interface from matches page to eliminate user confusion
- **Separated Concerns Properly**: 
  - Profile page: Overview with "View All Matches" and "Match Settings" navigation buttons
  - Matches page (`/matches`): Dedicated view for all user matches with "Find Matches" and "Settings" buttons
  - Settings page (`/settings`): Complete dad matching preferences configuration with working sliders
- **Fixed Technical Issues**: Resolved user ID handling in getOtherDad function and removed unused state/imports
- **Improved User Experience**: Clear navigation paths between match viewing, match discovery, and preference configuration
- **Working API Integration**: Confirmed dad matching algorithm runs successfully (returns 0 matches when no compatible users exist)

### September 17, 2025 - Location-Based Playdate Notifications
- **Proximity-Based Notifications**: Automatic push notifications sent to users when new playdates are created within their preferred distance (default 20km)
- **Smart User Filtering**: Optimized database queries that exclude admin users and only notify users with active push subscriptions
- **Distance-Based Matching**: Uses Haversine formula for accurate distance calculations between user locations and new playdate coordinates
- **Respect User Preferences**: Honors each user's maxDistanceKm setting from their dad matching preferences for notification radius
- **Rich Notification Content**: Push notifications include playdate title, location, distance, and action buttons for immediate engagement
- **Seamless Integration**: Works with both single playdates and recurring daily events, ensuring all users get timely notifications
- **Performance Optimized**: Single JOIN query replaces N+1 database calls for efficient user lookup and notification delivery
- **Error Resilient**: Comprehensive error handling ensures playdate creation never fails due to notification issues

### June 29, 2025 - Dad Matching System Implementation
- **Location-Based Matching**: Comprehensive dad matching system using Netherlands city coordinates for distance calculations
- **Age Compatibility Logic**: Children's age matching with ±2 years flexibility for finding compatible playdate partners
- **Smart Match Scoring**: Algorithm combines distance proximity (default 20km) and age overlap for match quality scores
- **Dual Notification System**: Email and push notifications sent to both dads when matches are found
- **Match Management Interface**: Complete frontend for viewing matches, accepting/declining, and configuring preferences
- **Database Integration**: New tables for dad_matches and match_preferences with expiration handling
- **API Endpoints**: Full REST API for match discovery, preference management, and match status updates
- **Automated Matching**: Background service capable of processing all eligible users for optimal match discovery

### June 21, 2025 - Comprehensive Places Database with Water Features
- **Complete Places Import**: Successfully imported 77 family-friendly locations across Netherlands including playgrounds, restaurants, and museums
- **Targeted Water Features**: Exactly 77 imported places tagged with water_features for enhanced discovery
- **Enhanced Place Discovery**: Users can search for "water" to find the specific 77 imported locations
- **Search-Only Water Features**: Water features are searchable but have no visual indicators on place cards
- **Asset Image Integration**: All imported places now use provided asset images (playground2.png, restaurant1-4.png, museum1-4.png)
- **Geocoded Locations**: All places include accurate coordinates and complete addresses for precise location services
- **Profile Reminder Enhancement**: Updated email system to encourage playdate creation after profile completion
- **Sequential Image Distribution**: All playgrounds use the same counter-based rotation system as restaurants and museums for consistent variety

### June 15, 2025 - Advanced User Activity Analytics System
- **Comprehensive Activity Tracking**: Detailed logging of all user interactions including post creation, comments, replies, and content engagement
- **Real-time Analytics Dashboard**: Visual charts showing activity trends, user behavior patterns, and engagement metrics
- **Advanced Statistics**: Activity breakdowns by day, top user actions, most active users, and detailed behavioral insights
- **Admin Analytics Interface**: Interactive dashboard with multiple chart types (line, bar, pie) for comprehensive data visualization
- **User Behavior Monitoring**: Complete tracking of user journeys with IP addresses, user agents, and detailed action context

### June 15, 2025 - Complete Weekly Email Reminder System
- **Automated Profile Completion Checker**: Identifies users missing essential profile fields (profileImage, bio, city, childrenInfo) - phone number is now optional
- **Weekly Email Scheduler**: Automatically sends personalized reminder emails every Monday at 10:00 AM using existing Resend service
- **Admin Management Interface**: New "Profile Reminders" tab in admin dashboard with full monitoring and control capabilities
- **Real-time Statistics**: Shows users currently needing profile completion reminders with detailed missing field breakdown
- **Manual Trigger System**: Admins can manually send reminders and monitor scheduler status with comprehensive logging
- **Production Integration**: Weekly scheduler automatically starts with server in production environment

### June 15, 2025 - Comprehensive Notification System
- **Mention Notifications**: Users receive push notifications when mentioned with @username in posts, comments, or edited content
- **Comment Notifications**: Post authors receive notifications when someone comments on their posts
- **Reply Notifications**: Users receive notifications when someone replies to their comments
- **Smart Filtering**: Prevents self-notifications when users interact with their own content
- **Context-Rich Messages**: Notifications include relevant context like post titles and commenter names

### Community Features Completion
- **Nested Comments**: Up to 3 levels of comment threading with reply functionality
- **@Username Mentions**: Automatic detection, database storage, and blue text highlighting
- **Autocomplete Suggestions**: Dropdown menu with user avatars, usernames, and full names during mention typing
- **Real-time User Search**: Integrated search functionality for mention suggestions
- **Edit/Delete System**: Complete post and comment editing with proper user permissions

### GDPR & Internationalization
- **Multi-language Support**: Full translations across 5 languages (English, Dutch, German, French, Spanish)
- **GDPR Compliance**: Comprehensive privacy implementation with multilingual support
- **Company Details**: Updated to Haarlem, Netherlands with contact email papa@papa-hi.com

## Changelog

- June 14, 2025: Initial setup and GDPR compliance implementation
- June 14, 2025: Fixed critical community publish button bug and implemented multilingual support
- June 15, 2025: Completed advanced community features with notification system

## User Preferences

Preferred communication style: Simple, everyday language.