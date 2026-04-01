import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";

export interface IntentTask {
  id: string;
  entity: string;
  action: string;
  trigger: string;
  status: "pending" | "confirmed" | "cancelled";
  createdAt: string;
}

interface IntentCardProps {
  task: IntentTask;
  onPress?: () => void;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export function IntentCard({ task, onPress, onConfirm, onCancel }: IntentCardProps) {
  const colors = useColors();
  
  const getStatusColor = () => {
    switch (task.status) {
      case "confirmed": return colors.intentSuccess;
      case "cancelled": return colors.intentError;
      default: return colors.intentWarning;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { 
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderLeftColor: getStatusColor(),
          borderLeftWidth: 3,
        }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={[styles.entity, { color: colors.foreground }]}>
          {task.entity}
        </Text>
        <View style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor() + "20" }
        ]}>
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {task.status}
          </Text>
        </View>
      </View>
      
      <Text style={[styles.action, { color: colors.foreground }]}>
        {task.action}
      </Text>
      
      <View style={styles.footer}>
        <View style={styles.trigger}>
          <Feather name="clock" size={14} color={colors.mutedForeground} />
          <Text style={[styles.triggerText, { color: colors.mutedForeground }]}>
            {task.trigger}
          </Text>
        </View>
        
        {task.status === "pending" && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.intentSuccess + "20" }]}
              onPress={onConfirm}
            >
              <Feather name="check" size={16} color={colors.intentSuccess} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.intentError + "20" }]}
              onPress={onCancel}
            >
              <Feather name="x" size={16} color={colors.intentError} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  entity: {
    fontSize: 16,
    fontWeight: "600",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "uppercase",
  },
  action: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  triggerText: {
    fontSize: 12,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
