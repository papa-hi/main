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

### Progressive Web App Features
- Web push notifications with VAPID keys
- Service worker for offline capabilities
- App manifest for mobile installation
- Privacy-compliant notification system

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

### June 21, 2025 - Comprehensive Places Database with Water Features
- **Complete Places Import**: Successfully imported 77 family-friendly locations across Netherlands including playgrounds, restaurants, and museums
- **Targeted Water Features**: Exactly 77 imported places tagged with water_features for enhanced discovery
- **Enhanced Place Discovery**: Users can search for "water" to find the specific 77 imported locations
- **Search-Only Water Features**: Water features are searchable but have no visual indicators on place cards
- **Asset Image Integration**: All imported places now use only the provided asset images (playground1-4.png, restaurant1-4.png, museum1-4.png) with proper rotation for variety
- **Geocoded Locations**: All places include accurate coordinates and complete addresses for precise location services
- **Profile Reminder Enhancement**: Updated email system to encourage playdate creation after profile completion

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