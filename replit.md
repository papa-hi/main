# PaPa-Hi Social App for Fathers

## Overview
PaPa-Hi is a social platform designed for fathers in the Netherlands. Its primary purpose is to facilitate connections among dads, streamline the organization of playdates, and help users discover family-friendly locations. The project aims to cultivate a vibrant community for fathers, making social interactions simpler and enriching family experiences through a modern full-stack application with real-time communication, location-based services, and Progressive Web App (PWA) capabilities.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes (February 2026)
- **Tiered Access Model**: Three-layer privacy system implemented:
    - **Public Layer**: Browse places, events, and sample playdates without login via /api/public/* endpoints
    - **Public Pages**: /places and /community routes now accessible without login (events tab shows public events, posts tab prompts login)
    - **Registered User Layer**: Full features for authenticated users (create playdates, message, join events)
    - **Privacy Controls**: Playdate visibility options (public/registered/friends-only) with enforcement in API
- **Dynamic Sitemap**: /sitemap.xml now auto-generated from database with all playdates, events, and places for SEO
- **About Page**: New /about page showcasing community guidelines, safety features, and privacy options
- **Deep Link Preview Mode**: Playdate, place, and event detail pages are now publicly accessible without login, enabling effective sharing via WhatsApp/social media with compelling sign-up prompts
- **Google Calendar Integration**: "Add to Calendar" button on playdate detail pages and dropdown menus for easy calendar syncing
- **Mobile UI Fixes**: Fixed map z-index issue that was overlapping the bottom navigation menu on mobile devices
- **DOM Structure Fixes**: Resolved nested HTML element warnings (button inside button, anchor inside anchor) in header component using proper `asChild` patterns

## System Architecture

### UI/UX Decisions
The application features a modern and intuitive user interface built with Radix UI components, styled using Tailwind CSS. It supports multiple languages (5 total) and adheres to GDPR compliance. Mobile-first design with large touch targets for one-handed use.

### Technical Implementations
- **Frontend**: Developed with React 18 and TypeScript, utilizing Wouter for routing, TanStack Query for state management, Leaflet for maps, and React Hook Form with Zod for form validation. It includes PWA features like service workers, app manifests, and web push notifications.
- **Backend**: Built on Node.js with Express.js and TypeScript. It uses Passport.js for authentication (local and Google OAuth), PostgreSQL for session management, and WebSockets for real-time communication. Multer handles file uploads.
- **Data Storage**: PostgreSQL (Neon serverless) is the primary database, managed with Drizzle ORM.
- **Key Features**:
    - **User Management**: Role-based access, profile management, secure password reset, and Google OAuth.
    - **Location Services**: Integrates OpenStreetMap via Overpass API and Nominatim for geocoding, user location tracking, and distance calculations.
    - **Social Features**: Real-time chat, playdate creation (including recurring events), user discovery, rating systems, and dad matching based on location and age.
    - **Calendar Availability Matching**: "Dad Days Calendar" feature where users mark weekly availability (morning/afternoon/evening per day). System matches dads with overlapping free times, factoring in distance and children's age compatibility. Includes real-time match recalculation, slot statistics for social proof, and email/push notifications for new matches. Tables: `user_availability`, `availability_matches`. Route: `/dad-days`. Service: `server/availability-matching-service.ts`.
    - **Admin Dashboard**: Provides tools for user management, analytics, and action logging.
    - **Notifications**: Supports web push notifications (VAPID) and email notifications (via Resend API) for various events like playdates, matches, mentions, comments, and community posts.
    - **Community Features**: Includes nested comments, @username mentions with autocomplete, and post/comment editing capabilities.
    - **Data Retention**: Implements a two-tier soft delete and archival system for playdates and events to optimize database performance.
    - **Playdate Templates**: 6 one-click templates (Coffee & Sandbox, Cargo-Bike Ride, Park Adventure, Swimming Pool, Lunch Playdate, Indoor Play) with pre-filled data for quick playdate creation.
    - **Calendar Integration**: Google Calendar URL generation for adding playdates to personal calendars.

### System Design Choices
The application is designed for scalability and real-time interaction, leveraging a robust backend for handling user data, authentication, and communication. Performance optimizations include database indexing, N+1 query problem resolution, and caching mechanisms for external API calls (e.g., Overpass API).

### Security Hardening
- URIError handler for malformed URL attacks
- Disabled directory listing for /uploads
- robots.txt with AI crawler blocking and sitemap reference
- Explicit static file routing before SPA catch-all
- Helmet security headers (X-Content-Type-Options, X-Frame-Options, HSTS, etc.)
- Rate limiting on auth endpoints: login (10/15min), register (5/hour), password reset (5/15min)
- Input sanitization (server/sanitize.ts): strips script tags, event handlers, dangerous HTML, javascript: URIs from user-generated content
- Profile update hardening: strips role, id, and password fields from update requests
- Registration hardening: "admin" username blocked, role always forced to 'user'

## External Dependencies
- **Email Service**: Resend API
- **Maps & Location**: OpenStreetMap (Overpass API, Nominatim), Leaflet
- **Authentication**: Google OAuth
- **Push Notifications**: Web Push Protocol, VAPID
- **Calendar**: Google Calendar URL API for event integration