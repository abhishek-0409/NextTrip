

import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';

interface ScreenWrapperProps {
  children: React.ReactNode;

  scrollable?: boolean;

  onRefresh?: () => void;

  refreshing?: boolean;

  style?: ViewStyle;

  contentStyle?: ViewStyle;

  keyboardAvoiding?: boolean;

  backgroundColor?: string;

  disableBottomInset?: boolean;
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  children,
  scrollable = false,
  onRefresh,
  refreshing = false,
  style,
  contentStyle,
  keyboardAvoiding = false,
  backgroundColor = Colors.background,
  disableBottomInset = false,
}) => {
  const insets = useSafeAreaInsets();

  const paddingBottom = disableBottomInset ? 0 : insets.bottom;

  const content = scrollable ? (
    <ScrollView
      style={[styles.scroll, { backgroundColor }]}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: paddingBottom + 24 },
        contentStyle,
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh != null ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  ) : (
    <View
      style={[
        styles.static,
        { backgroundColor, paddingBottom },
        contentStyle,
      ]}
    >
      {children}
    </View>
  );

  const inner = keyboardAvoiding ? (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}
    >
      {content}
    </KeyboardAvoidingView>
  ) : (
    content
  );

  return (
    <View
      style={[
        styles.outer,
        { backgroundColor, paddingTop: insets.top },
        style,
      ]}
    >
      {inner}
    </View>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  outer: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  static: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
});
