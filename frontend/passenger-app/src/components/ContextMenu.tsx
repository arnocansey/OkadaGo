import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { palette } from "./ui";

export interface ContextMenuAction {
  title: string;
  onPress: () => void;
  isDangerous?: boolean;
}

export interface ContextMenuProps {
  visible: boolean;
  onClose: () => void;
  actions: ContextMenuAction[];
  title?: string;
}

export function ContextMenu({ visible, onClose, actions, title }: ContextMenuProps) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.menuCard}>
          {title ? (
            <View style={styles.header}>
              <Text style={styles.headerText} numberOfLines={1}>{title}</Text>
            </View>
          ) : null}
          <View style={styles.actionsList}>
            {actions.map((action, index) => (
              <Pressable
                key={index}
                style={({ pressed }) => [
                  styles.actionButton,
                  pressed && styles.actionButtonPressed,
                  index < actions.length - 1 && styles.borderBottom,
                ]}
                onPress={() => {
                  onClose();
                  action.onPress();
                }}
              >
                <Text
                  style={[
                    styles.actionText,
                    action.isDangerous && styles.actionTextDangerous,
                  ]}
                >
                  {action.title}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  menuCard: {
    backgroundColor: palette.panel,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.stroke,
    width: "100%",
    maxWidth: 280,
    overflow: "hidden",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: palette.stroke,
  },
  headerText: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  actionsList: {
    backgroundColor: palette.panel,
  },
  actionButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  actionButtonPressed: {
    backgroundColor: palette.panelRaised,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: palette.stroke,
  },
  actionText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  actionTextDangerous: {
    color: palette.red,
  },
});
