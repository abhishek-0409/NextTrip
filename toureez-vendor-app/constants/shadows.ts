

import type { ViewStyle } from 'react-native';

export const Shadows: Record<string, ViewStyle> = {

  card: {
    shadowColor: 'rgba(26,26,46,0.12)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },

  sm: {
    shadowColor: 'rgba(26,26,46,0.08)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },

  md: {
    shadowColor: 'rgba(26,26,46,0.12)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 5,
  },

  lg: {
    shadowColor: 'rgba(26,26,46,0.18)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 10,
  },

  primary: {
    shadowColor: 'rgba(232,99,26,0.30)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 6,
  },

  tab: {
    shadowColor: 'rgba(26,26,46,0.10)',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 8,
  },
};
