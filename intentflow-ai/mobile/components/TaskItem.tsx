import { StyleSheet, TouchableOpacity } from 'react-native';
import { Text, View } from './Themed';
import { useColorScheme } from './useColorScheme';

export interface Task {
  id: string;
  title: string;
  createdAt: Date;
  completed?: boolean;
}

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  const theme = useColorScheme();
  const isDark = theme === 'dark';
  const formattedTime = new Date(task.createdAt).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#2a2a2a' : '#f8f9fa' }]}>
      <TouchableOpacity
        style={styles.checkboxArea}
        onPress={() => onToggle(task.id)}
      >
        <View
          style={[
            styles.checkbox,
            task.completed && styles.checkboxChecked,
            {
              borderColor: isDark ? '#555' : '#ddd',
              backgroundColor: task.completed ? '#2f95dc' : 'transparent',
            },
          ]}
        >
          {task.completed && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text
          style={[
            styles.taskTitle,
            task.completed && styles.taskTitleCompleted,
          ]}
        >
          {task.title}
        </Text>
        <Text style={styles.timestamp}>{formattedTime}</Text>
      </View>

      <TouchableOpacity
        onPress={() => onDelete(task.id)}
        style={styles.deleteButton}
      >
        <Text style={styles.deleteIcon}>×</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    gap: 12,
  },
  checkboxArea: {
    padding: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    borderColor: '#2f95dc',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  timestamp: {
    fontSize: 12,
    opacity: 0.5,
  },
  deleteButton: {
    padding: 8,
  },
  deleteIcon: {
    fontSize: 28,
    opacity: 0.4,
    color: '#ff4444',
  },
});
