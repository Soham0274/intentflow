import { StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useState } from 'react';
import { Text, View } from './Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from './useColorScheme';

export interface TaskInputCardProps {
  onAddTask: (task: string) => void;
}

export default function TaskInputCard({ onAddTask }: TaskInputCardProps) {
  const [taskInput, setTaskInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const theme = useColorScheme();
  const isDark = theme === 'dark';

  const handleAddTask = () => {
    if (taskInput.trim()) {
      onAddTask(taskInput);
      setTaskInput('');
    } else {
      Alert.alert('Empty Task', 'Please enter a task description');
    }
  };

  const handleVoiceInput = async () => {
    // Placeholder for voice input functionality
    // Will integrate expo-speech later
    setIsListening(!isListening);
    Alert.alert('Voice Input', 'Voice input feature coming soon!');
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa' }]}>
      <Text style={styles.header}>What do you need to do?</Text>
      <Text style={styles.subheader}>Speak or type to create a task</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.textInput,
            {
              color: isDark ? '#fff' : '#000',
              borderColor: isDark ? '#333' : '#e0e0e0',
              backgroundColor: isDark ? '#2a2a2a' : '#fff',
            },
          ]}
          placeholder="Type your task here..."
          placeholderTextColor={isDark ? '#666' : '#999'}
          value={taskInput}
          onChangeText={setTaskInput}
          multiline
          maxLength={200}
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.voiceButton, isListening && styles.voiceButtonActive]}
          onPress={handleVoiceInput}
        >
          <Text style={styles.buttonText}>🎤</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.addButton, !taskInput.trim() && styles.addButtonDisabled]}
          onPress={handleAddTask}
          disabled={!taskInput.trim()}
        >
          <Text style={styles.addButtonText}>Add Task</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.characterCount}>
        <Text style={styles.characterCountText}>{taskInput.length}/200</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subheader: {
    fontSize: 14,
    opacity: 0.6,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 12,
  },
  textInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    fontFamily: 'System',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  voiceButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e8f4fd',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.light.tint,
  },
  voiceButtonActive: {
    backgroundColor: Colors.light.tint,
  },
  buttonText: {
    fontSize: 28,
  },
  addButton: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.tint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  characterCount: {
    alignItems: 'flex-end',
  },
  characterCountText: {
    fontSize: 12,
    opacity: 0.5,
  },
});
