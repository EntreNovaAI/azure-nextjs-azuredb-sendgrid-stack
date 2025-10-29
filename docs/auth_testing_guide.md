# Authentication Testing Guide

This guide explains how to test the authentication system and user access levels in the Azure Next Stack application.

## Features Implemented

### 🔐 Authentication System

- **Google OAuth Integration**: Users can sign in using their Google accounts
- **Session Management**: NextAuth.js handles secure session management
- **Protected Routes**: Products page requires authentication to access

### 📊 User Access Level Management

- **Automatic Creation**: User records are created automatically with default access levels
- **Access Levels**: New users get 'free' access level by default (free, basic, premium)
- **Database Integration**: Uses Prisma ORM with PostgreSQL for data persistence
- **Simplified Schema**: Access levels stored directly on User model

### 🛡️ Protected Content

- **Dashboard Page**: Only accessible to authenticated users
- **Access Control**: Non-authenticated users see login prompts
- **User Experience**: Smooth redirect flow after authentication
- **Modular Components**: Reusable ProductCard, UserInfo, and PageState components

## Setup Instructions

### 1. Database Migration

Run the database migration to update the User table with access levels:

```bash
# Generate Prisma client and run migrations
pnpm run migrate

# Or manually:
npx prisma generate
npx prisma migrate deploy
```

### 2. Environment Variables

Ensure these environment variables are set:

```env
# Google OAuth (required for authentication)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# NextAuth Secret (required for session encryption)
NEXTAUTH_SECRET=your_nextauth_secret

# Database URL (required for Prisma)
DATABASE_URL=your_postgresql_connection_string
```

### 3. Google OAuth App Setup

1. Go to Google Cloud Console: https://console.cloud.google.com/
2. Create a new project or select an existing one
3. Enable the Google People API
4. Create OAuth 2.0 credentials with:
   - **Authorized JavaScript origins**: `http://[devtunnel.url]`
   - **Authorized redirect URIs**: `http://[devtunnel.url]/api/auth/callback/google`
5. Copy the Client ID and Client Secret to your environment variables

## Testing the Authentication Flow

### Test Scenario 1: First-Time User Registration

1. **Start the application**: `pnpm dev`
2. **Navigate to home page**: `http://localhost:3000`
3. **Click "Sign In with Google"** in the navigation
4. **Complete Google OAuth flow**
5. **Verify**: User should be redirected back and see welcome message
6. **Check database**: A new User record should be created with default `accessLevel: "free"`

### Test Scenario 2: Protected Content Access

1. **While authenticated**, click on "Dashboard" in navigation
2. **Verify**: Dashboard page loads successfully with modular components
3. **Check user info**: Page should display user's access level and join date
4. **Verify database**: User record should exist with 'free' access level
5. **Check components**: ProductCard components should render from data/products.ts

### Test Scenario 3: Unauthenticated Access

1. **Sign out** using the "Sign Out" button
2. **Try to access dashboard page directly**: `http://localhost:3000/dashboard`
3. **Verify**: Page shows "Authentication Required" message using AuthRequiredState component
4. **Navigation check**: Dashboard link should not appear in navigation when signed out

### Test Scenario 4: User Record Persistence

1. **Sign in** for the first time
2. **Visit dashboard page** to see user details
3. **Sign out and sign in again**
4. **Visit dashboard page** again
5. **Verify**: Same user record is retrieved (check the "Member Since" date)

### Test Scenario 5: Component Modularity

1. **Check ProductCard rendering**: All 3 subscription tiers should display from products data
2. **Check UserInfo component**: Should show access level and join date
3. **Check LoadingState**: Should appear while fetching user data
4. **Check AccessNotice**: Should display current access level at bottom of page

## Database Verification

### Check User Records

You can verify user records are created by checking your database:

```sql
-- View all users with access levels
SELECT 
  id,
  name,
  email,
  accessLevel,
  createdAt,
  updatedAt
FROM "User"
ORDER BY createdAt DESC;
```

### Expected Database Schema

After migration, you should have these tables:
- `User` (NextAuth user data with accessLevel field)
- `Account` (OAuth account links)
- `Session` (User sessions)
- `VerificationToken` (Email verification tokens)

## API Endpoints

### User API (`/api/user`)

- **GET**: Retrieve current user's details including access level
- **Authentication**: Uses NextAuth session for security
- **Purpose**: Provides user data to authenticated pages

### NextAuth API (`/api/auth/[...nextauth]`)

- **Handles**: Google OAuth flow
- **Features**: Session management, user creation with default access levels

## Component Architecture

### Reusable Components Created

- **ProductCard** (`components/product-card.tsx`) - Subscription tier display
- **UserInfo** (`components/user-info.tsx`) - User account details
- **PageStates** (`components/page-states.tsx`) - Loading, auth required, access notices
- **Products Data** (`data/products.ts`) - Centralized subscription tier data

## Troubleshooting

### Common Issues

1. **Google OAuth not working**
   - Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables
   - Verify callback URL in Google Cloud Console OAuth settings
   - Ensure NEXTAUTH_SECRET is set
   - Check if Google Identity API is enabled

2. **Database connection errors**
   - Verify DATABASE_URL is correct
   - Check if PostgreSQL is running
   - Run database migrations with `pnpm run migrate`

3. **User records not created**
   - Check browser console for API errors
   - Verify Prisma schema includes accessLevel field on User model
   - Check database table structure matches schema

4. **Session issues**
   - Clear browser cookies
   - Restart the development server
   - Check NEXTAUTH_SECRET configuration

5. **Component not rendering**
   - Check import paths for new components
   - Verify products data is properly structured
   - Check browser console for TypeScript errors

## Success Criteria

✅ **Authentication Works**: Users can sign in with Google OAuth  
✅ **Protected Routes**: Dashboard page requires authentication  
✅ **User Creation**: Database creates user records with access levels automatically  
✅ **Access Levels**: New users get 'free' access level by default  
✅ **Session Management**: Users stay logged in across page refreshes  
✅ **Navigation**: Auth-aware navigation shows appropriate links  
✅ **Modular Components**: Reusable ProductCard, UserInfo, and PageState components  
✅ **DRY Code**: No repeated JSX, centralized product data  

## Next Steps

After successful testing, you can:

1. **Implement subscription upgrades**: Stripe integration for paid tiers
2. **Add role-based content**: Different features for different access levels
3. **Enhance user profiles**: Additional user data fields and preferences
4. **Add admin interface**: Manage user access levels and subscriptions
5. **Create more reusable components**: Extend the modular architecture
6. **Add unit tests**: Test individual components and API endpoints
