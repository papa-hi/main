# PaPa-Hi Social App for Fathers

## Overview
PaPa-Hi is a social platform for fathers in the Netherlands, enabling connections, playdate organization, and discovery of family-friendly locations. It features a modern full-stack architecture with real-time communication, location-based services, and progressive web app functionality. The project aims to create a vibrant community for dads, simplifying social interactions and enriching family experiences.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack Query
- **UI Components**: Radix UI with custom styled components
- **Styling**: Tailwind CSS
- **Internationalization**: React i18next
- **Maps**: Leaflet
- **Forms**: React Hook Form with Zod validation
- **PWA Features**: Service worker, app manifest, web push notifications

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **Authentication**: Passport.js (local, Google OAuth)
- **Session Management**: PostgreSQL-backed sessions
- **Real-time Communication**: WebSocket server
- **File Upload**: Multer

### Data Storage
- **Primary Database**: PostgreSQL (Neon serverless)
- **ORM**: Drizzle ORM
- **Session Store**: PostgreSQL
- **File Storage**: Local filesystem

### Key Features
- **User Management**: Role-based access, profile management, Google OAuth, secure password reset.
- **Location Services**: OpenStreetMap via Overpass API, Nominatim geocoding, user location tracking, distance calculations.
- **Social Features**: Real-time chat, playdate creation (including recurring events), user discovery, rating system, dad matching (location and age-based).
- **Admin Dashboard**: User management, analytics tracking, admin action logging.
- **Notifications**: Web push notifications (VAPID), email notifications (Resend API) for playdates, matches, mentions, comments, community posts, and profile completion reminders.
- **Community Features**: Nested comments, @username mentions with autocomplete, post/comment editing.
- **GDPR & Internationalization**: Multi-language support (5 languages), GDPR compliance.

## External Dependencies
- **Email Service**: Resend API
- **Maps & Location**: OpenStreetMap (Overpass API), Nominatim, Leaflet
- **Authentication**: Google OAuth, Firebase Auth
- **Push Notifications**: Web Push Protocol, VAPID

## Recent Changes

### October 18, 2025 - Community Post Push Notifications
- **Real-time Notifications**: Users now receive push notifications when new community posts are created
- **Smart Filtering**: Automatically excludes the post author and admin users from notifications
- **Rich Content**: Notifications include author name, post title, and category information
- **Error Resilience**: Notification failures don't block post creation, ensuring smooth user experience
- **Scalable Design**: Uses Promise.allSettled for parallel delivery to multiple users

### October 18, 2025 - Secure Password Reset System
- **Token-Based Security**: Secure password reset using cryptographically random tokens with 1-hour expiration
- **Email Integration**: Automated password reset emails via Resend API with user-friendly templates
- **Complete User Flow**: Three-page workflow including forgot password, email confirmation, and reset password
- **Frontend Pages**: Dedicated forgot-password and reset-password pages with elegant UI matching app design
- **Backend Endpoints**: Three API endpoints for requesting, verifying, and completing password resets
- **Database Schema**: New password_reset_tokens table tracking reset requests with expiration and usage status
- **Security Features**: Token validation, expiration checking, one-time use enforcement, and password hashing
- **User Experience**: Clear error messages, success states, and automatic redirection after successful reset