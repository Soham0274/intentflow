import React, { useState, useEffect, useCallback } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect, router } from "expo-router";

import { useColors } from "@/hooks/useColors";
import { GradientBackground } from "@/components/GradientBackground";
import { fetchCalendarEvents, fetchTasks } from "@/services/api";

// Month names
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// Day names
const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

// Task status colors
const STATUS_COLORS = {
  completed: "#10B981", // Green
  in_progress: "#F59E0B", // Orange/Yellow
  pending: "#3B82F6", // Blue
  to_do: "#3B82F6", // Blue
};

// Helper to format time from due_date or time string
const formatTaskTime = (task: Task | CalendarEvent) => {
  let timeStr = "";
  if ('start' in task && task.start) timeStr = task.start;
  else if (task.due_date) timeStr = task.due_date;

  if (timeStr) {
    let timePart = "";
    if (timeStr.includes("T")) timePart = timeStr.split("T")[1];
    else if (timeStr.includes(" ")) timePart = timeStr.split(" ")[1];
    
    if (timePart) {
      const parts = timePart.split(":");
      let hour = parseInt(parts[0], 10);
      let minStr = parts[1];
      let period = hour >= 12 ? "PM" : "AM";
      hour = hour % 12 || 12;
      return { time: `${hour}:${minStr}`, period };
    }
  }
  
  if ('dueTime' in task && task.dueTime) {
    const [hours] = task.dueTime.split(":");
    let hour = parseInt(hours, 10);
    let period = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    const min = task.dueTime.split(":")[1] || "00";
    return { time: `${hour}:${min}`, period };
  }
  
  return { time: "9:00", period: "AM" };
};

type Task = {
  id: string;
  title: string;
  action?: string;
  status: "completed" | "in_progress" | "pending" | "to_do";
  due_date?: string;
  dueTime?: string;
  category?: string;
  entity?: string;
  priority?: "high" | "medium" | "low";
  startTime?: string;
  endTime?: string;
  description?: string;
};

type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  description?: string;
  status?: string;
};

export default function CalendarScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const topPad = Platform.OS === "web" ? 67 : insets.top + 16;
  const bottomPad = Platform.OS === "web" ? 100 : insets.bottom + 80;

  // Load calendar data
  const loadCalendarData = async () => {
    setIsLoading(true);
    try {
      // Fetch tasks and calendar events
      const [tasksRes, eventsRes] = await Promise.all([
        fetchTasks({ limit: 100 }),
        fetchCalendarEvents().catch(() => ({ data: [] })), // Graceful fallback
      ]);

      const tasksData = tasksRes.data?.data || tasksRes.data || [];
      const eventsData = eventsRes.data?.data || eventsRes.data || [];

      setTasks(tasksData);
      setEvents(eventsData);
    } catch (err) {
      console.error("[Calendar] Error loading data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadCalendarData();
    }, [currentDate.getMonth()])
  );

  // Get days in month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get first day of month (0 = Sunday)
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  // Check if a day has tasks/events
  const getDayStatus = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    
    const dayTasks = tasks.filter((task) => {
      if (!task.due_date) return false;
      return task.due_date.startsWith(dateStr);
    });

    const dayEvents = events.filter((event) => {
      return event.start?.startsWith(dateStr);
    });

    if (dayTasks.some((t) => t.status === "completed")) return "completed";
    if (dayTasks.some((t) => t.status === "in_progress")) return "in_progress";
    if (dayTasks.length > 0 || dayEvents.length > 0) return "to_do";
    return null;
  };

  // Get tasks for selected date
  const getSelectedDateTasks = () => {
    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
    
    const dayTasks = tasks.filter((task) => {
      if (!task.due_date) return false;
      return task.due_date.startsWith(dateStr);
    });

    const dayEvents = events.filter((event) => {
      return event.start?.startsWith(dateStr);
    }).map((e) => ({
      id: e.id,
      title: e.title,
      status: "pending" as const,
      due_date: e.start,
      dueTime: e.start ? new Date(e.start).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : undefined,
      category: "Calendar",
      description: e.description,
    }));

    // Sort by actual time using formatTaskTime helper
    return [...dayTasks, ...dayEvents].sort((a, b) => {
      const timeA = formatTaskTime(a).time;
      const timeB = formatTaskTime(b).time;
      return timeA.localeCompare(timeB);
    });
  };

  // Navigate months
  const goToPrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Generate calendar grid
  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const days = [];
    
    // Empty cells for days before the first day of month
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = 
        selectedDate.getDate() === day && 
        selectedDate.getMonth() === month && 
        selectedDate.getFullYear() === year;
      
      const status = getDayStatus(day);
      const isToday = 
        new Date().getDate() === day && 
        new Date().getMonth() === month && 
        new Date().getFullYear() === year;

      days.push(
        <TouchableOpacity
          key={day}
          style={[styles.dayCell]}
          onPress={() => setSelectedDate(new Date(year, month, day))}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.dayNumberContainer,
              isSelected && { backgroundColor: colors.primary },
              isToday && !isSelected && { borderWidth: 1, borderColor: colors.primary },
            ]}
          >
            <Text
              style={[
                styles.dayNumber,
                { color: isSelected ? "#fff" : colors.foreground },
              ]}
            >
              {day}
            </Text>
          </View>
          {status && (
            <View
              style={[
                styles.statusDot,
                { backgroundColor: STATUS_COLORS[status] },
              ]}
            />
          )}
        </TouchableOpacity>
      );
    }

    return days;
  };

  const selectedTasks = getSelectedDateTasks();
  const formattedDate = selectedDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <GradientBackground>
      <ScrollView
        style={[styles.container, { paddingTop: topPad, paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>
            Schedule
          </Text>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push("/alerts")}
            >
              <Feather name="filter" size={18} color={colors.foreground} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.avatarBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push("/(tabs)/profile")}
            >
              <Feather name="user" size={18} color={colors.foreground} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Calendar Card */}
        <Animated.View
          entering={FadeInDown.delay(200)}
          style={[styles.calendarCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          {/* Month Header */}
          <View style={styles.monthHeader}>
            <Text style={[styles.monthTitle, { color: colors.foreground }]}>
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </Text>
            <View style={styles.monthNav}>
              <TouchableOpacity onPress={goToPrevMonth} style={styles.navBtn}>
                <Feather name="chevron-left" size={20} color={colors.foreground} />
              </TouchableOpacity>
              <TouchableOpacity onPress={goToNextMonth} style={styles.navBtn}>
                <Feather name="chevron-right" size={20} color={colors.foreground} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Day Headers */}
          <View style={styles.dayHeaderRow}>
            {DAYS.map((day) => (
              <Text
                key={day}
                style={[styles.dayHeaderText, { color: colors.mutedForeground }]}
              >
                {day}
              </Text>
            ))}
          </View>

          {/* Calendar Grid */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : (
            <View style={styles.calendarGrid}>{renderCalendar()}</View>
          )}

          {/* Legend */}
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: STATUS_COLORS.completed }]} />
              <Text style={[styles.legendText, { color: colors.mutedForeground }]}>
                COMPLETED
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: STATUS_COLORS.in_progress }]} />
              <Text style={[styles.legendText, { color: colors.mutedForeground }]}>
                IN PROGRESS
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: STATUS_COLORS.to_do }]} />
              <Text style={[styles.legendText, { color: colors.mutedForeground }]}>
                TO DO
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Selected Date Tasks */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.tasksSection}>
          <View style={styles.tasksHeader}>
            <Text style={[styles.tasksDate, { color: colors.foreground }]}>
              {formattedDate.toUpperCase()}
            </Text>
            <Text style={[styles.tasksCount, { color: colors.primary }]}
>
              {selectedTasks.length} Task{selectedTasks.length !== 1 ? "s" : ""}
            </Text>
          </View>

          {selectedTasks.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="calendar" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                No tasks scheduled for this day
              </Text>
            </View>
          ) : (
            selectedTasks.map((task, index) => (
              <Animated.View
                key={task.id}
                entering={FadeInDown.delay(400 + index * 50)}
                style={[styles.taskCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                {/* Time indicator */}
                <View style={styles.taskTimeColumn}>
                  <Text style={[styles.taskTime, { color: colors.mutedForeground }]}>
                    {(() => { const t = formatTaskTime(task); return t.time; })()}
                  </Text>
                  <Text style={[styles.taskTime, { color: colors.mutedForeground }]}>
                    {(() => { const t = formatTaskTime(task); return t.period; })()}
                  </Text>
                </View>

                {/* Task content */}
                <View style={[styles.taskContent, { borderLeftColor: getTaskBorderColor(task.status) }]}>
                  <View style={styles.taskHeader}>
                    <View
                      style={[
                        styles.categoryBadge,
                        { backgroundColor: getCategoryColor(task.category) + "30" },
                      ]}
                    >
                      <Text
                        style={[
                          styles.categoryText,
                          { color: getCategoryColor(task.category) },
                        ]}
                      >
                        {(task.category || "WORK").toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.taskMeta}>
                      <Feather name="clock" size={12} color={colors.mutedForeground} />
                      <Text style={[styles.durationText, { color: colors.mutedForeground }]}>
                        1.5h
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={[
                      styles.taskTitle,
                      { color: colors.foreground },
                      task.status === "completed" && styles.completedTask,
                    ]}
                  >
                    {task.title || "Untitled Task"}
                  </Text>

                  {task.description && (
                    <Text
                      style={[styles.taskDescription, { color: colors.mutedForeground }]}
                      numberOfLines={2}
                    >
                      {task.description}
                    </Text>
                  )}
                </View>
              </Animated.View>
            ))
          )}
        </Animated.View>
      </ScrollView>
    </GradientBackground>
  );
}

// Helper functions
const getTaskBorderColor = (status?: string) => {
  switch (status) {
    case "completed":
      return STATUS_COLORS.completed;
    case "in_progress":
      return STATUS_COLORS.in_progress;
    default:
      return STATUS_COLORS.to_do;
  }
};

const getCategoryColor = (category?: string) => {
  const colors: Record<string, string> = {
    WORK: "#A855F7", // Purple
    MEETING: "#3B82F6", // Blue
    PERSONAL: "#10B981", // Green
    URGENT: "#EF4444", // Red
    CALENDAR: "#F59E0B", // Orange
  };
  return colors[category?.toUpperCase() || "WORK"] || "#A855F7";
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 32,
    fontFamily: "Syne_700Bold",
    letterSpacing: -0.8,
  },
  headerRight: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  calendarCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
  },
  monthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  monthTitle: {
    fontSize: 20,
    fontFamily: "Syne_700Bold",
    letterSpacing: -0.5,
  },
  monthNav: {
    flexDirection: "row",
    gap: 8,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  dayHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
  },
  dayHeaderText: {
    fontSize: 11,
    fontFamily: "DMSans_500Medium",
    width: 36,
    textAlign: "center",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  dayCell: {
    width: "14.28%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 2,
  },
  dayNumberContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  dayNumber: {
    fontSize: 14,
    fontFamily: "DMSans_500Medium",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 4,
  },
  loadingContainer: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    fontFamily: "DMSans_500Medium",
    letterSpacing: 0.5,
  },
  tasksSection: {
    marginBottom: 20,
  },
  tasksHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  tasksDate: {
    fontSize: 14,
    fontFamily: "Syne_700Bold",
    letterSpacing: 0.5,
  },
  tasksCount: {
    fontSize: 14,
    fontFamily: "DMSans_500Medium",
  },
  emptyCard: {
    borderRadius: 18,
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    textAlign: "center",
  },
  taskCard: {
    flexDirection: "row",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },
  taskTimeColumn: {
    width: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  taskTime: {
    fontSize: 12,
    fontFamily: "DMSans_500Medium",
  },
  taskContent: {
    flex: 1,
    borderLeftWidth: 3,
    paddingLeft: 16,
    marginLeft: 12,
  },
  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 10,
    fontFamily: "DMSans_700Bold",
    letterSpacing: 0.5,
  },
  taskMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  durationText: {
    fontSize: 11,
    fontFamily: "DMSans_400Regular",
  },
  taskTitle: {
    fontSize: 15,
    fontFamily: "Syne_600SemiBold",
    lineHeight: 22,
    marginBottom: 4,
  },
  completedTask: {
    textDecorationLine: "line-through",
    opacity: 0.6,
  },
  taskDescription: {
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
    lineHeight: 18,
  },
});
