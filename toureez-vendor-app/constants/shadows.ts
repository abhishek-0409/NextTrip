
import type { ViewStyle } from 'react-native';

export const Shadows: Record<string, ViewStyle> = {
  card: {
    shadowColor: '#1F2328',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 4,
  },
  sm: {
    shadowColor: '#1F2328',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  md: {
    shadowColor: '#1F2328',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 14,
    elevation: 6,
  },
  lg: {
    shadowColor: '#1F2328',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 22,
    elevation: 10,
  },
  primary: {
    shadowColor: '#25584B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 7,
  },
  tab: {
    shadowColor: '#1F2328',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 6,
  },
};
