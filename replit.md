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
- **Notifications**: Web push notifications (VAPID), email notifications (Resend API) for playdates, matches, mentions, comments, and profile completion reminders.
- **Community Features**: Nested comments, @username mentions with autocomplete, post/comment editing.
- **GDPR & Internationalization**: Multi-language support (5 languages), GDPR compliance.

## External Dependencies
- **Email Service**: Resend API
- **Maps & Location**: OpenStreetMap (Overpass API), Nominatim, Leaflet
- **Authentication**: Google OAuth, Firebase Auth
- **Push Notifications**: Web Push Protocol, VAPID