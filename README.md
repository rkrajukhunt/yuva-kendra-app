# Yuva Kendra Reporting System - React Native App

A comprehensive mobile application for managing weekly attendance reports for Yuva Kendra centers. Built with Expo and React Native.

## Features

- **Role-Based Access Control**: Admin and Member roles with appropriate permissions
- **Weekly Attendance Reporting**: Create, view, and edit weekly reports
- **Dashboard**: Statistics and attendance trend visualization
- **City & Kendra Management**: Admin-only management of cities and Kendras
- **User Management**: Admin can create and manage users
- **Report Filtering & Search**: Filter reports by city, Kendra, type, and date ranges
- **Export Functionality**: Export reports to PDF/Excel (CSV)
- **Mobile-Optimized UI**: Responsive design with pull-to-refresh

## Tech Stack

- **Framework**: Expo SDK 54
- **Language**: TypeScript
- **Navigation**: Expo Router (file-based routing)
- **UI Library**: React Native Paper
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Backend**: Supabase
- **Charts**: react-native-chart-kit
- **Forms**: React Hook Form with Zod validation

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (for Mac) or Android Studio (for Android development)

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   Create a `.env` file in the root directory:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Start the Development Server**
   ```bash
   npm start
   ```

4. **Run on iOS/Android**
   ```bash
   npm run ios
   # or
   npm run android
   ```

## Project Structure

```
yuva-kendra-app/
├── app/                    # Expo Router app directory
│   ├── (auth)/            # Authentication routes
│   ├── (tabs)/            # Tab navigation screens
│   ├── admin/             # Admin-only routes
│   └── reports/           # Report detail routes
├── components/            # Reusable components
├── services/              # Business logic & API calls
├── utils/                 # Utility functions
├── types/                 # TypeScript type definitions
└── constants/            # App constants
```

## Key Features Implementation

### Authentication
- Supabase authentication with secure storage
- Session management with auto-refresh
- Role-based route protection

### Reports
- Create weekly attendance reports
- View and edit reports (creator/admin only)
- Search and filter functionality
- Export to PDF/Excel

### Dashboard
- Statistics cards (Total Reports, Avg Attendance, etc.)
- Attendance trend charts (last 5 weeks)
- Role-based data filtering

### Admin Management
- User management (create, edit, delete)
- City management (CRUD operations)
- Kendra management (CRUD operations)

## Database Schema

The app connects to the same Supabase backend as the web application. Required tables:
- `profiles` - User profiles
- `cities` - City information
- `kendras` - Kendra information
- `weekly_reports` - Weekly attendance reports

## Building for Production

1. **Configure EAS Build** (if using Expo Application Services)
   ```bash
   eas build:configure
   ```

2. **Build for iOS/Android**
   ```bash
   eas build --platform ios
   eas build --platform android
   ```

## Environment Variables

Required environment variables:
- `EXPO_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key

## Troubleshooting

### Common Issues

1. **Metro bundler cache issues**
   ```bash
   npm start -- --reset-cache
   ```

2. **Native module issues**
   ```bash
   cd ios && pod install && cd ..
   ```

3. **TypeScript errors**
   ```bash
   npm run type-check
   ```

## License

Private - EmperorBrainsLLP

