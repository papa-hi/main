# PaPa-Hi Social App for Fathers

## Overview
PaPa-Hi is a social platform designed for fathers in the Netherlands. Its primary purpose is to facilitate connections among dads, streamline the organization of playdates, and help users discover family-friendly locations. The project aims to cultivate a vibrant community for fathers, making social interactions simpler and enriching family experiences through a modern full-stack application with real-time communication, location-based services, and Progressive Web App (PWA) capabilities.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes (February 2026)
- **Full i18n for Matches**: Added `matches` translation section to all 5 locale files (EN, NL, DE, FR, ES) with 21 keys. Wired `t()` calls in `matches.tsx` (standalone page) and `profile.tsx` (matches tab) — replacing all hardcoded English strings for titles, subtitles, tab labels, empty states, buttons, and match card content.
- **Weather Icon Fix**: Replaced Font Awesome weather icons (which were never loaded) with Lucide React icons (`Sun`, `Moon`, `Cloud`, `CloudSun`, `CloudRain`, `Snowflake`, `CloudLightning`, `CloudFog`, etc.) in `welcome-section.tsx`. Icons update dynamically based on OpenWeatherMap API conditions.
- **Auto-Matching Fully Automated**: Match preferences auto-created on registration (both local + Firebase); `triggerInitialMatching` runs at registration and profile updates (city/childrenInfo changes); nightly cron at 2:30 AM runs `runDadMatchingForAllUsers`.
- **Notifications Fixed & Translated**: `dad-match-notifications.ts` rewritten in English with real Resend API integration; `availability-match-notifications.ts` and cron push notifications converted from Dutch to English with consistent orange PaPa-Hi branding (#FF6B35).
- **Profile Reminder Email Enhanced**: Added `dadDaysAvailability` as a missing field detected via subquery in `getUsersWithIncompleteProfiles`; email now shows blue info box explaining Dad Days + green "Set Up Dad Days" CTA button alongside orange "Complete My Profile" button.
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
The application features a modern and intuitive user interface built with Radix UI components, styled using Tailwind CSS. It supports multiple languages (5 total: English, Dutch, German, French, Spanish) and adheres to GDPR compliance. Mobile-first design with large touch targets for one-handed use. Weather widget on home page uses Lucide React icons for dynamic weather display.

### Technical Implementations
- **Frontend**: Developed with React 18 and TypeScript, utilizing Wouter for routing, TanStack Query for state management, Leaflet for maps, React Hook Form with Zod for form validation, and Lucide React for icons. It includes PWA features like service workers, app manifests, and web push notifications.
- **Backend**: Built on Node.js with Express.js and TypeScript. It uses Passport.js for authentication (local and Google OAuth), PostgreSQL for session management, and WebSockets for real-time communication. Multer handles file uploads.
- **Data Storage**: PostgreSQL (Supabase) is the primary database, managed with Drizzle ORM. Connection uses `SUPABASE_DATABASE_URL` with `family: 4` (IPv4) in pg.Pool config.
- **Internationalization**: react-i18next with 5 locale files in `client/src/i18n/locales/` (en.json, nl.json, de.json, fr.json, es.json). Translation sections: common, home, nav, auth, profile, playdates, places, community, dadDays, matches.
- **Key Features**:
    - **User Management**: Role-based access, profile management, secure password reset, and Google OAuth. Match preferences auto-created on registration (default: 20km, ±2yr, enabled). Dad matching auto-runs on registration and profile updates (city/children changes).
    - **Location Services**: Integrates OpenStreetMap via Overpass API and Nominatim for geocoding, user location tracking, and distance calculations.
    - **Social Features**: Real-time chat, playdate creation (including recurring events), user discovery, rating systems, and dad matching based on location and age.
    - **Calendar Availability Matching**: "Dad Days Calendar" feature where users mark weekly availability (morning/afternoon/evening per day). System matches dads with overlapping free times, factoring in distance and children's age compatibility. Includes real-time match recalculation, slot statistics for social proof, and email/push notifications for new matches. Tables: `user_availability`, `availability_matches`. Route: `/dad-days`. Service: `server/availability-matching-service.ts`.
    - **Availability Notifications** (`server/availability-match-notifications.ts`): English-language email templates (Resend API) and push notifications for: setup confirmation, new match alerts (top 3 per calculation, deduplicated), weekly digest, day-before reminders. Emails use orange PaPa-Hi branding (#FF6B35).
    - **Dad Match Notifications** (`server/dad-match-notifications.ts`): English-language email notifications via Resend API for profile-based dad matches with orange branding.
    - **Cron Jobs** (`server/availability-cron-jobs.ts`): Four scheduled jobs via `node-cron` — nightly availability match recalculation (2:00 AM), nightly dad profile match recalculation (2:30 AM), weekly digest emails (Sunday 6pm), day-before push reminders (daily 8pm). Rate-limited batch processing with error handling. Initialized in `server/index.ts` on server start.
    - **Admin Dashboard**: Provides tools for user management, analytics, and action logging.
    - **Notifications**: Supports web push notifications (VAPID) and email notifications (via Resend API) for various events like playdates, matches, mentions, comments, and community posts.
    - **Community Features**: Includes nested comments, @username mentions with autocomplete, and post/comment editing capabilities.
    - **Data Retention**: Implements a two-tier soft delete and archival system for playdates and events to optimize database performance.
    - **Playdate Templates**: 6 one-click templates (Coffee & Sandbox, Cargo-Bike Ride, Park Adventure, Swimming Pool, Lunch Playdate, Indoor Play) with pre-filled data for quick playdate creation.
    - **Calendar Integration**: Google Calendar URL generation for adding playdates to personal calendars.
    - **Weather Widget**: OpenWeatherMap API integration with dynamic Lucide React icons based on conditions (sun, cloud, rain, snow, etc.). Falls back to Amsterdam defaults if location unavailable.

### System Design Choices
The application is designed for scalability and real-time interaction, leveraging a robust backend for handling user data, authentication, and communication. Performance optimizations include database indexing, N+1 query problem resolution, and caching mechanisms for external API calls (e.g., Overpass API). Drizzle queries use single `.where(and(...))` pattern (not chained `.where()` calls).

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
- **Weather**: OpenWeatherMap API
- **Authentication**: Google OAuth
- **Push Notifications**: Web Push Protocol, VAPID
- **Calendar**: Google Calendar URL API for event integration
- **Database**: Supabase (PostgreSQL)