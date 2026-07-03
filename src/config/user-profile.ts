import { UserProfile } from '../types/index.js';

export const defaultUserProfile: UserProfile = {
  name: 'Nischal',
  goals: {
    gainWeight: true,
    buildMuscle: true,
    targetCalories: {
      min: 900,
      max: 1200,
    },
    targetProtein: 60,
    maxBudget: 18.00,
  },
  schedule: {
    officeDays: ['monday', 'wednesday', 'friday'],
    homeDays: ['tuesday', 'thursday'],
  },
  preferences: {
    preferred: [
      'chicken',
      'beef',
      'rice',
      'potatoes',
      'greek food',
      'mediterranean',
      'mexican',
      'high protein',
      'double protein',
      'extra rice',
    ],
    avoid: [
      'tiny salads',
      'low protein meals',
      'salad only',
      'small portions',
    ],
  },
};

export function getUserProfile(): UserProfile {
  return defaultUserProfile;
}

export function isOfficeDay(date: Date = new Date()): boolean {
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
  const dayName = dayNames[date.getDay()];
  return defaultUserProfile.schedule.officeDays.includes(dayName as typeof defaultUserProfile.schedule.officeDays[number]);
}
