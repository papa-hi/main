# PaPa-Hi Social App for Fathers

## Overview
PaPa-Hi is a social platform designed for fathers in the Netherlands. Its primary purpose is to facilitate connections among dads, streamline the organization of playdates, and help users discover family-friendly locations. The project aims to cultivate a vibrant community for fathers, making social interactions simpler and enriching family experiences through a modern full-stack application with real-time communication, location-based services, and Progressive Web App (PWA) capabilities.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The application features a modern and intuitive user interface built with Radix UI components, styled using Tailwind CSS. It supports multiple languages (5 total) and adheres to GDPR compliance.

### Technical Implementations
- **Frontend**: Developed with React 18 and TypeScript, utilizing Wouter for routing, TanStack Query for state management, Leaflet for maps, and React Hook Form with Zod for form validation. It includes PWA features like service workers, app manifests, and web push notifications.
- **Backend**: Built on Node.js with Express.js and TypeScript. It uses Passport.js for authentication (local and Google OAuth), PostgreSQL for session management, and WebSockets for real-time communication. Multer handles file uploads.
- **Data Storage**: PostgreSQL (Neon serverless) is the primary database, managed with Drizzle ORM.
- **Key Features**:
    - **User Management**: Role-based access, profile management, secure password reset, and Google OAuth.
    - **Location Services**: Integrates OpenStreetMap via Overpass API and Nominatim for geocoding, user location tracking, and distance calculations.
    - **Social Features**: Real-time chat, playdate creation (including recurring events), user discovery, rating systems, and dad matching based on location and age.
    - **Admin Dashboard**: Provides tools for user management, analytics, and action logging.
    - **Notifications**: Supports web push notifications (VAPID) and email notifications (via Resend API) for various events like playdates, matches, mentions, comments, and community posts.
    - **Community Features**: Includes nested comments, @username mentions with autocomplete, and post/comment editing capabilities.
    - **Data Retention**: Implements a two-tier soft delete and archival system for playdates and events to optimize database performance.

### System Design Choices
The application is designed for scalability and real-time interaction, leveraging a robust backend for handling user data, authentication, and communication. Performance optimizations include database indexing, N+1 query problem resolution, and caching mechanisms for external API calls (e.g., Overpass API).

## External Dependencies
- **Email Service**: Resend API
- **Maps & Location**: OpenStreetMap (Overpass API, Nominatim), Leaflet
- **Authentication**: Google OAuth
- **Push Notifications**: Web Push Protocol, VAPID