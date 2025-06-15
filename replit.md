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

## Changelog

- June 14, 2025: Initial setup
- June 14, 2025: Completed comprehensive GDPR compliance implementation with multilingual support across 5 languages (English, Dutch, German, French, Spanish)
- June 14, 2025: Updated company information to Haarlem, Netherlands with contact email papa@papa-hi.com throughout all privacy features and translations
- June 14, 2025: Fixed critical community publish button bug by correcting apiRequest parameter order in all mutations
- June 14, 2025: Implemented comprehensive multilingual support for community features with full English and Dutch translations
- June 14, 2025: Resolved category translation mapping issue - categories now display properly translated text instead of objects throughout community interface
- June 14, 2025: Implemented complete edit/delete functionality for posts and comments with proper user permissions and multilingual support
- June 15, 2025: Completed nested comments system with up to 3 levels of threading and reply functionality
- June 15, 2025: Implemented @username mention system with automatic detection, database storage, and blue text highlighting
- June 15, 2025: Added @username autocomplete suggestions with dropdown menu showing user avatars, usernames, and full names
- June 15, 2025: Created community_mentions table and integrated real-time user search for mention functionality
- June 15, 2025: Implemented complete mention notification system - users receive push notifications when mentioned in posts, comments, or edited content
- June 15, 2025: Added comprehensive post and comment notification system including mention notifications, comment notifications, and reply notifications

## User Preferences

Preferred communication style: Simple, everyday language.