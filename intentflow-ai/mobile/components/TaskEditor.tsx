import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import * as api from '@/services/api';

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  due_date?: string | null;
  category?: string;
  entity?: string;
  trigger?: string;
}

interface TaskEditorProps {
  visible: boolean;
  task: Task | null;
  onClose: () => void;
  onSave: (task: Task) => void;
  onDelete?: (taskId: string) => void;
}

const CATEGORIES = ['work', 'personal', 'health', 'routine', 'urgent'];
const PRIORITIES = ['low', 'medium', 'high'];

export function TaskEditor({ visible, task, onClose, onSave, onDelete }: TaskEditorProps) {
  const colors = useColors();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [category, setCategory] = useState('work');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<'pending' | 'confirmed' | 'completed' | 'cancelled'>('pending');

  // Reset form when task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setPriority(task.priority || 'medium');
      setCategory(task.category || 'work');
      setDueDate(task.due_date || '');
      setStatus(task.status || 'pending');
    } else {
      // New task defaults
      setTitle('');
      setDescription('');
      setPriority('medium');
      setCategory('work');
      setDueDate('');
      setStatus('pending');
    }
  }, [task, visible]);

  const handleSave = async () => {
    if (!title.trim()) return;
    
    setIsLoading(true);
    try {
      const taskData = {
        title: title.trim(),
        description: description.trim() || null,
        priority,
        category,
        due_date: dueDate || null,
        status,
      };

      if (task?.id) {
        // Update existing task
        const response = await api.updateTask(task.id, taskData);
        onSave(response.data || response);
      } else {
        // Create new task
        const response = await api.createTask(taskData);
        onSave(response.data || response);
      }
      onClose();
    } catch (error: any) {
      console.error('Failed to save task:', error);
      alert(error.message || 'Failed to save task');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!task?.id || !onDelete) return;
    
    setIsDeleting(true);
    try {
      await api.deleteTask(task.id);
      onDelete(task.id);
      onClose();
    } catch (error: any) {
      console.error('Failed to delete task:', error);
      alert(error.message || 'Failed to delete task');
    } finally {
      setIsDeleting(false);
    }
  };

  const isEditing = !!task?.id;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: colors.background + 'CC' }]}>
        <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]}>
              {isEditing ? 'Edit Task' : 'New Task'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Title Input */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Title *</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.input, 
                  borderColor: colors.border,
                  color: colors.foreground 
                }]}
                placeholder="What needs to be done?"
                placeholderTextColor={colors.mutedForeground}
                value={title}
                onChangeText={setTitle}
                multiline
              />
            </View>

            {/* Description Input */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea, { 
                  backgroundColor: colors.input, 
                  borderColor: colors.border,
                  color: colors.foreground 
                }]}
                placeholder="Add details..."
                placeholderTextColor={colors.mutedForeground}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Priority Selection */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Priority</Text>
              <View style={styles.optionsRow}>
                {PRIORITIES.map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.optionBtn,
                      { 
                        backgroundColor: priority === p ? colors.primary : colors.input,
                        borderColor: priority === p ? colors.primary : colors.border,
                      }
                    ]}
                    onPress={() => setPriority(p as any)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        { color: priority === p ? colors.primaryForeground : colors.foreground }
                      ]}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Category Selection */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Category</Text>
              <View style={styles.optionsRow}>
                {CATEGORIES.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.optionBtn,
                      { 
                        backgroundColor: category === c ? colors.primary : colors.input,
                        borderColor: category === c ? colors.primary : colors.border,
                      }
                    ]}
                    onPress={() => setCategory(c)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        { color: category === c ? colors.primaryForeground : colors.foreground }
                      ]}
                    >
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Due Date Input */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Due Date (YYYY-MM-DD)</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.input, 
                  borderColor: colors.border,
                  color: colors.foreground 
                }]}
                placeholder="2024-12-31"
                placeholderTextColor={colors.mutedForeground}
                value={dueDate}
                onChangeText={setDueDate}
                keyboardType="numbers-and-punctuation"
              />
            </View>

            {/* Status Selection (for editing) */}
            {isEditing && (
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.mutedForeground }]}>Status</Text>
                <View style={styles.optionsRow}>
                  {['pending', 'confirmed', 'completed', 'cancelled'].map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={[
                        styles.optionBtn,
                        { 
                          backgroundColor: status === s ? colors.primary : colors.input,
                          borderColor: status === s ? colors.primary : colors.border,
                        }
                      ]}
                      onPress={() => setStatus(s as any)}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          { color: status === s ? colors.primaryForeground : colors.foreground }
                        ]}
                      >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                onPress={handleSave}
                disabled={isLoading || !title.trim()}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.primaryForeground} />
                ) : (
                  <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>
                    {isEditing ? 'Update Task' : 'Create Task'}
                  </Text>
                )}
              </TouchableOpacity>

              {isEditing && onDelete && (
                <TouchableOpacity
                  style={[styles.deleteBtn, { borderColor: colors.destructive }]}
                  onPress={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <ActivityIndicator color={colors.destructive} />
                  ) : (
                    <>
                      <Feather name="trash-2" size={18} color={colors.destructive} />
                      <Text style={[styles.deleteBtnText, { color: colors.destructive }]}>
                        Delete Task
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.border }]}
                onPress={onClose}
                disabled={isLoading || isDeleting}
              >
                <Text style={[styles.cancelBtnText, { color: colors.mutedForeground }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  optionText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  actions: {
    gap: 12,
    marginTop: 8,
  },
  saveBtn: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  deleteBtn: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  deleteBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  cancelBtn: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
});
