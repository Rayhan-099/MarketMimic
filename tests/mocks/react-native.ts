import React from 'react';

export const Platform = {
  OS: 'android',
  select: <T>(obj: { ios?: T; android?: T; default?: T }): T => {
    return (obj.android ?? obj.default ?? obj.ios) as T;
  },
};

export const StyleSheet = {
  create: <T extends Record<string, unknown>>(styles: T): T => styles,
  flatten: <T>(style: T): T => style,
};

export const View = React.forwardRef<any, any>(({ children, ...props }, ref) =>
  React.createElement('div', { ref, ...props }, children),
);
View.displayName = 'View';

export const Text = React.forwardRef<any, any>(({ children, ...props }, ref) =>
  React.createElement('span', { ref, ...props }, children),
);
Text.displayName = 'Text';

export const TouchableOpacity = React.forwardRef<any, any>(
  ({ children, onPress, ...props }, ref) =>
    React.createElement(
      'button',
      {
        ref,
        onClick: onPress,
        ...props,
      },
      children,
    ),
);
TouchableOpacity.displayName = 'TouchableOpacity';

export const TextInput = React.forwardRef<any, any>(
  ({ onChangeText, value, ...props }, ref) =>
    React.createElement('input', {
      ref,
      value,
      onChange: (e: any) => onChangeText?.(e.target.value),
      ...props,
    }),
);
TextInput.displayName = 'TextInput';

export const ActivityIndicator = (props: any) =>
  React.createElement('div', { className: 'activity-indicator', ...props });

export const ScrollView = React.forwardRef<any, any>(({ children, ...props }, ref) =>
  React.createElement('div', { ref, style: { overflowY: 'auto' }, ...props }, children),
);
ScrollView.displayName = 'ScrollView';

export const FlatList = React.forwardRef<any, any>(
  ({ data, renderItem, keyExtractor, ListEmptyComponent, ...props }, ref) => {
    if (!data || data.length === 0) {
      return ListEmptyComponent ? React.createElement(ListEmptyComponent) : null;
    }
    return React.createElement(
      'div',
      { ref, ...props },
      data.map((item: any, index: number) => {
        const key = keyExtractor ? keyExtractor(item, index) : index;
        return React.createElement(
          React.Fragment,
          { key },
          renderItem({ item, index }),
        );
      }),
    );
  },
);
FlatList.displayName = 'FlatList';

export const Modal = ({ children, visible, ...props }: any) =>
  visible ? React.createElement('div', { className: 'modal', ...props }, children) : null;

export const Alert = {
  alert: (title: string, message?: string, buttons?: any[]) => {
    // Mock alert for test harness
  },
};

export const useColorScheme = () => 'dark';

export type StyleProp<T> = T | T[] | readonly T[] | undefined | null | false;
export type ViewStyle = Record<string, unknown>;
export type TextStyle = Record<string, unknown>;
export type TextProps = Record<string, unknown>;
export type ViewProps = Record<string, unknown>;
export type TouchableOpacityProps = Record<string, unknown>;

