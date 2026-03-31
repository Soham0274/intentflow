import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  KeyboardTypeOptions,
} from 'react-native';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';

interface InputFieldProps {
  icon?: React.ReactNode;
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  error?: string;
  style?: ViewStyle;
  multiline?: boolean;
  minHeight?: number;
}

export default function InputField({
  icon,
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  error,
  style,
  multiline = false,
  minHeight,
}: InputFieldProps) {
  const [secureVisible, setSecureVisible] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.wrapper, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          focused && styles.focused,
          !!error && styles.errorBorder,
          minHeight ? { minHeight } : {},
        ]}
      >
        {icon && <View style={styles.iconWrap}>{icon}</View>}
        <TextInput
          style={[styles.input, multiline && { textAlignVertical: 'top', paddingTop: 12 }]}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !secureVisible}
          keyboardType={keyboardType}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          multiline={multiline}
        />
        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setSecureVisible(!secureVisible)}
            style={styles.eyeButton}
          >
            <Text style={styles.eyeText}>{secureVisible ? '👁' : '👁‍🗨'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: Spacing.xs,
  },
  label: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: '#333333', // darker border for auth inputs
    borderRadius: Radius.md,
    height: 52,
    paddingHorizontal: 16,
  },
  iconWrap: {
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  focused: {
    borderColor: Colors.brandBlue,
  },
  errorBorder: {
    borderColor: Colors.danger,
  },
  input: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  eyeButton: {
    padding: 4,
  },
  eyeText: {
    fontSize: 18,
  },
  errorText: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.danger,
    marginTop: 4,
  },
});
