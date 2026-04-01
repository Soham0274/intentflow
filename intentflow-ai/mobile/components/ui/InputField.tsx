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
          placeholderTextColor={Colors.textMuted || '#5A6280'}
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
    marginBottom: Spacing.sm,
  },
  label: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: '#A0A8C0',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1F2E',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 16,
  },
  iconWrap: {
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  focused: {
    borderColor: 'rgba(108, 99, 255, 0.5)',
    shadowColor: '#6C63FF',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
  },
  errorBorder: {
    borderColor: '#FF4D4D',
  },
  input: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 15,
    color: '#FFFFFF',
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
    color: '#FF4D4D',
    marginTop: 4,
  },
});
