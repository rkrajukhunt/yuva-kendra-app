/**
 * Color system based on CSS variables design tokens
 * HSL values converted to hex for React Native compatibility
 * 
 * Original CSS Variables:
 * --background: 0 0% 100% (white)
 * --foreground: 222.2 84% 4.9% (very dark blue)
 * --primary: 222.2 47.4% 11.2% (dark blue)
 * --primary-foreground: 210 40% 98% (very light blue)
 * --secondary: 210 40% 96.1% (light blue-gray)
 * --muted: 210 40% 96.1% (light blue-gray)
 * --muted-foreground: 215.4 16.3% 46.9% (medium gray)
 * --destructive: 0 84.2% 60.2% (red)
 * --border: 214.3 31.8% 91.4% (light gray)
 * --radius: 0.5rem (8px)
 */

export const Colors = {
  // Background colors
  background: '#ffffff', // --background: 0 0% 100%
  foreground: '#0a0e27', // --foreground: 222.2 84% 4.9%
  
  // Card colors
  card: '#ffffff', // --card: 0 0% 100%
  cardForeground: '#0a0e27', // --card-foreground: 222.2 84% 4.9%
  
  // Popover colors
  popover: '#ffffff', // --popover: 0 0% 100%
  popoverForeground: '#0a0e27', // --popover-foreground: 222.2 84% 4.9%
  
  // Primary colors
  primary: '#0f172a', // --primary: 222.2 47.4% 11.2%
  primaryForeground: '#f8fafc', // --primary-foreground: 210 40% 98%
  primaryDark: '#020617', // Darker variant for hover states
  
  // Secondary colors
  secondary: '#f1f5f9', // --secondary: 210 40% 96.1%
  secondaryForeground: '#0f172a', // --secondary-foreground: 222.2 47.4% 11.2%
  
  // Muted colors
  muted: '#f1f5f9', // --muted: 210 40% 96.1%
  mutedForeground: '#64748b', // --muted-foreground: 215.4 16.3% 46.9%
  
  // Accent colors
  accent: '#f1f5f9', // --accent: 210 40% 96.1%
  accentForeground: '#0f172a', // --accent-foreground: 222.2 47.4% 11.2%
  
  // Destructive colors
  destructive: '#ef4444', // --destructive: 0 84.2% 60.2%
  destructiveForeground: '#f8fafc', // --destructive-foreground: 210 40% 98%
  
  // Border and input colors
  border: '#e2e8f0', // --border: 214.3 31.8% 91.4%
  input: '#e2e8f0', // --input: 214.3 31.8% 91.4%
  ring: '#0a0e27', // --ring: 222.2 84% 4.9%
  
  // Legacy aliases for backward compatibility
  text: '#0a0e27', // Same as foreground
  textSecondary: '#64748b', // Same as muted-foreground
  surface: '#f1f5f9', // Same as secondary/muted
  error: '#ef4444', // Same as destructive
  success: '#10b981', // Additional color for success states
  warning: '#f59e0b', // Additional color for warning states
  info: '#3b82f6', // Additional color for info states
};

// Border radius constant (0.5rem = 8px)
export const borderRadius = 8;

