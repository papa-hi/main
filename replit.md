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

### November 23, 2025 - Places Loading Performance Optimization
- **Overpass API Caching**: Implemented 12-hour in-memory cache for nearby playgrounds from OpenStreetMap
  - Cache keyed by rounded lat/lon (~1km precision) and radius for maximum cache hit rate
  - First request: 3-6 seconds (uncached Overpass API call)
  - Subsequent requests: Instant (cache hit)
  - LRU cache cleanup keeps last 100 entries to prevent memory bloat
  - Dramatically improves places tab load time for repeat visitors
- **Database Performance**: Added indexes on places table for faster queries
  - `places_type_idx` on type column (restaurant/playground/museum filtering)
  - `places_rating_idx` on rating column (sorting by rating)
  - Significantly speeds up place listing and filtering operations
- **Impact**: Places tab now loads instantly after first visit (within 12-hour cache window)

### November 23, 2025 - Data Retention & Archive System
- **Soft Delete Architecture**: Implemented 2-tier data retention strategy for database optimization
  - After 90 days: Playdates and family events are automatically archived (soft delete)
  - After 12 months: Archived items are permanently deleted (hard delete)
  - Preserves user history and analytics while maintaining database performance
- **Database Schema Updates**: Added `archivedAt` timestamp column to `playdates` and `family_events` tables
  - Created indexes on `archivedAt` columns for efficient archival queries
  - Applied schema changes via direct SQL to avoid migration conflicts
- **Storage Layer Updates**: Modified all query methods to exclude archived items from main results
  - Updated `getUpcomingPlaydates()`, `getPastPlaydates()`, `getUserPlaydates()`, and `getEvents()` 
  - Archived items only visible to admins via dedicated endpoints
- **Automated Cleanup Service**: Created cleanup service with two operations
  - Archives items older than 90 days (sets `archivedAt` timestamp)
  - Hard deletes archived items older than 12 months (with cascade to related tables)
  - Integrated with existing weekly scheduler (runs Mondays at 10 AM)
- **Admin Management Tools**: Three new admin endpoints for data retention oversight
  - `POST /api/admin/cleanup`: Manually trigger cleanup process
  - `GET /api/admin/archived/playdates`: View archived playdates
  - `GET /api/admin/archived/events`: View archived family events
  - All endpoints protected with admin-only authentication
- **Cascading Deletion Logic**: Ensures referential integrity when deleting old playdates
  - Deletes playdate participants before deleting playdates
  - Prevents orphaned records in junction tables

### November 23, 2025 - TypeScript Build & Service Worker Fixes
- **TypeScript Compilation Errors Fixed**: Resolved 8 TypeScript errors preventing production builds
  - Fixed null handling for `user.city` in playdate notification logic (line 137)
  - Restructured Drizzle query builder in community posts endpoint to avoid type inference issues (lines 2725-2757)
  - Build now completes successfully, allowing new code to deploy to production
- **Service Worker Cache Bypass**: Configured service worker to never cache API requests
  - All `/api/*` requests now bypass service worker cache and go directly to network
  - Updated cache version to `v2` to force client updates
  - Added aggressive auto-update mechanism that forces reload when new service worker detected
  - Prevents caching of API responses that was causing 404 errors on production
- **Public Geocoding Endpoint**: Added `/api/geocode` endpoint for frontend geocoding requests
  - Accepts address query parameter and returns coordinates
  - Uses the enhanced 4-level fallback geocoding system
  - Fixes map display issues when adding new places
- **Geocoding Timeout & Retry Logic**: Enhanced reliability for production environment
  - Increased timeout from 10s to 30s to handle slower network conditions
  - Added automatic retry with exponential backoff (1s, 2s, 4s delays)
  - Handles timeout errors gracefully with up to 3 attempts per address
  - Prevents geocoding failures due to temporary network issues on production
- **Client-Side Geocoding Fallback**: Added browser-based geocoding to avoid backend connectivity issues
  - All place forms (restaurant, playground, museum) now geocode addresses in the browser before submitting
  - Bypasses production backend Nominatim connectivity issues
  - Uses direct Nominatim API calls from client (works around CORS since OpenStreetMap allows it)
  - Shows user feedback during geocoding process with toast notifications
  - Gracefully handles failures by still allowing place creation (with warning)

### November 23, 2025 - Production Fixes
- **Geocoding Production Fix**: Fixed and enhanced Nominatim geocoding service for production environment
  - Updated User-Agent header to be environment-aware (development vs production with papa-hi.com domain)
  - Added rate limiting to respect Nominatim's 1 request per second usage policy
  - Enhanced error logging for better production debugging
  - Implemented 4-level fallback system for Netherlands addresses:
    1. Full address search
    2. Without house number suffix (e.g., "2A" → "2")
    3. Broad street search (street name + city only)
    4. Postal code fallback (general area)
  - Significantly improved success rate for Dutch addresses that have variations or are incomplete in OpenStreetMap
  - Prevents API blocking/rate-limiting that was causing map display issues when adding new places
- **Admin Dashboard Fix**: Fixed paginated API response handling in admin users hook
  - Updated useAdmin hook to properly extract arrays from paginated responses ({users: [...]} format)
  - Resolved "TypeError: i?.filter is not a function" error on admin users page
  - All admin endpoints (users, activity, logs) now work correctly with pagination
- **Code Cleanup**: Removed duplicate `/api/images` route definition

### November 22, 2025 - Performance Optimizations
- **Database Indexes**: Added indexes on frequently queried columns (community_posts.created_at, playdates.start_time, family_events.start_date, category columns) to significantly improve query performance
- **N+1 Query Fixes**: 
  - Dad matching service: Eliminated 100+ database queries by batching existing match checks into single query with Set-based lookups
  - Community posts: Eliminated 200+ queries by using SQL subqueries for comment/reaction counts (100 posts × 2 queries each → 1 query total)
- **Admin Pagination**: Implemented pagination for admin endpoints (/api/admin/users, /api/admin/activity, /api/admin/logs) with input validation, default limit of 50, max 200, returning metadata (total, offset, hasMore)
- **Input Validation**: Added comprehensive validation for pagination parameters with defensive checks at both route and storage layers to prevent negative values and abuse
- **Performance Impact**: Reduced database queries by ~300+ per page load in community section, improved response times for admin dashboard

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