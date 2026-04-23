import React, { useState, useEffect } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams } from "expo-router";

import { useColors } from "@/hooks/useColors";
import { GradientBackground } from "@/components/GradientBackground";
import { fetchRecentIntents, updateTask } from "@/services/api";
import { useRouter } from "expo-router";

type TaskFilter = "all" | "pending" | "active" | "completed";

export default function IntentsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const router = useRouter();
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<TaskFilter>("all");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const loadTasks = async (forceRefresh = false) => {
    setIsLoading(true);
    try {
      const res = await fetchRecentIntents(50);
      const newTasks = res.data?.data || res.data || [];
      setTasks(newTasks);
      
      if (forceRefresh) {
        console.log('[Intents] Force refreshed, loaded', newTasks.length, 'tasks');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      const shouldRefresh = params.refresh === 'true';
      loadTasks(shouldRefresh);
    }, [params.refresh])
  );

  const handleToggleComplete = async (task: any) => {
    const newStatus = task.status === "completed" ? "active" : "completed";
    const taskId = task.id || task._id;
    
    if (!taskId) {
      console.error('[Intents] Task has no ID:', task);
      return;
    }
    
    try {
      console.log('[Intents] Updating task', taskId, 'to status:', newStatus);
      await updateTask(taskId, { status: newStatus });
      setTasks(tasks.map(t => (t.id === taskId || t._id === taskId) ? { ...t, status: newStatus } : t));
    } catch (err: any) {
      console.error('[Intents] Failed to update task:', err);
      console.error('[Intents] Error response:', err.response?.data);
    }
  };

  const handleEditTask = (task: any) => {
    const taskId = task.id || task._id;
    if (taskId) {
      router.push(`/task/${taskId}`);
    }
  };

  const formatTaskTime = (task: any) => {
    if (task.due_time) return task.due_time;
    if (task.due_date) {
      const date = new Date(task.due_date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    if (task.trigger) return task.trigger;
    return "No date set";
  };

  const filteredTasks = tasks.filter((t) => {
    const title = t.title || t.action || "";
    const category = t.category || t.entity || "";
    const matchesSearch =
      title.toLowerCase().includes(search.toLowerCase()) ||
      category.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = activeFilter === "all" || t.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const FilterChip = ({ label, value }: { label: string; value: TaskFilter }) => (
    <TouchableOpacity
      onPress={() => setActiveFilter(value)}
      style={[
        styles.chip,
        {
          backgroundColor: activeFilter === value ? colors.primary : colors.card,
          borderColor: activeFilter === value ? colors.primary : colors.border,
        },
      ]}
    >
      <Text
        style={[
          styles.chipText,
          { color: activeFilter === value ? "#fff" : colors.mutedForeground },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <GradientBackground>
      <View style={{ paddingTop: topPad + 10, paddingHorizontal: 20 }}>
        <View style={styles.titleRow}>
          <View>
            <Text style={[styles.pageTitle, { color: colors.foreground }]}>
              Intent History
            </Text>
            <Text style={[styles.pageSub, { color: colors.mutedForeground }]}>
              Everything the AI has handled
            </Text>
          </View>
          <TouchableOpacity 
             style={[styles.refreshBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
             onPress={() => loadTasks(true)}
          >
            <Feather name="refresh-cw" size={16} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search intents..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x" size={14} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.filters}
          contentContainerStyle={styles.filtersContent}
        >
          <FilterChip label="All" value="all" />
          <FilterChip label="Pending" value="pending" />
          <FilterChip label="Active" value="active" />
          <FilterChip label="Completed" value="completed" />
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: bottomPad + 120 },
        ]}
      >
        <View style={[styles.section, { paddingHorizontal: 20 }]}>
          {isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : filteredTasks.length > 0 ? (
            <View style={[styles.intentsList, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {filteredTasks.map((task, i) => (
                <Animated.View
                  key={task.id}
                  entering={FadeInDown.delay(Math.min(i, 8) * 50).springify()}
                  style={[
                    styles.intentRow,
                    i > 0 && { borderTopWidth: 1, borderTopColor: colors.border },
                  ]}
                >
                  <TouchableOpacity 
                    onPress={() => handleToggleComplete(task)}
                    style={[
                      styles.intentIcon, 
                      { 
                        backgroundColor: task.status === 'completed' ? colors.intentSuccess + "18" : colors.primary + "18" 
                      }
                    ]}
                  >
                    <Feather 
                      name={task.status === 'completed' ? "check-circle" : "circle"} 
                      size={18} 
                      color={task.status === 'completed' ? colors.intentSuccess : colors.mutedForeground} 
                    />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.intentInfo} onPress={() => handleEditTask(task)}>
                    <Text style={[styles.intentAction, { color: colors.foreground, textDecorationLine: task.status === 'completed' ? 'line-through' : 'none' }]} numberOfLines={1}>
                      {task.title || task.action}
                    </Text>
                    <Text style={[styles.intentTrigger, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {task.category || task.entity || "General"} · {formatTaskTime(task)}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleEditTask(task)}
                    style={[
                      styles.intentStatus,
                      {
                        backgroundColor: task.status === 'completed' ? colors.intentSuccess + "18" :
                                         task.status === 'pending' ? colors.destructive + "18" :
                                         colors.primary + "10"
                      }
                    ]}
                  >
                    <Text
                      style={[
                        styles.intentStatusText,
                        {
                          color: task.status === 'completed' ? colors.intentSuccess :
                                 task.status === 'pending' ? colors.destructive :
                                 colors.primary
                        }
                      ]}
                    >
                      {task.status || "active"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleEditTask(task)} style={styles.editBtn}>
                    <Feather name="edit-2" size={14} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          ) : (
            <Animated.View entering={FadeIn} style={styles.empty}>
              <View style={[styles.emptyIconBox, { backgroundColor: colors.border }]}>
                <Feather name="slash" size={24} color={colors.mutedForeground} />
              </View>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                No intents matching your criteria
              </Text>
            </Animated.View>
          )}
        </View>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 28,
    fontFamily: "Syne_700Bold",
    letterSpacing: -0.8,
  },
  pageSub: {
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
    marginTop: 2,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 10,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    padding: 0,
  },
  filters: {
    marginBottom: 8,
  },
  filtersContent: {
    gap: 8,
    paddingBottom: 4,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
  },
  chipText: {
    fontSize: 12,
    fontFamily: "DMSans_500Medium",
  },
  scroll: {
    paddingTop: 12,
    gap: 24,
  },
  section: {},
  intentsList: {
    borderRadius: 18,
    overflow: "hidden",
  },
  intentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  intentIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  intentInfo: {
    flex: 1,
  },
  intentAction: {
    fontSize: 15,
    fontFamily: "DMSans_500Medium",
  },
  intentTrigger: {
    fontSize: 12,
    fontFamily: "DMSans_400Regular",
    marginTop: 2,
  },
  intentStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  intentStatusText: {
    fontSize: 10,
    fontFamily: "Syne_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  editBtn: {
    padding: 8,
    marginLeft: 4,
  },
  center: {
    paddingVertical: 60,
    alignItems: "center",
  },
  empty: {
    alignItems: "center",
    paddingVertical: 80,
    gap: 16,
  },
  emptyIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    textAlign: "center",
  },
});
