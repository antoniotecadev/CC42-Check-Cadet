import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface WebMenuModalProps {
    isHome: boolean;
    options: { label: string; value: number }[];
    isStaff: boolean;
    visible: boolean;
    onClose: () => void;
    onSelect: (option: number) => void;
}

export default function WebMenuModal({
    isHome,
    options,
    isStaff,
    visible,
    onClose,
    onSelect,
}: WebMenuModalProps) {
    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    {isHome
                        ? options.map((opt) => (
                              <TouchableOpacity
                                  disabled={opt.value === 0 && !isStaff}
                                  key={opt.value}
                                  style={styles.option}
                                  onPress={() => {
                                      onClose();
                                      if (opt.value !== 5) onSelect(opt.value);
                                  }}
                              >
                                  <Text
                                      style={[
                                          styles.text,
                                          opt.value === 4 && {
                                              color: "#E53935",
                                          },
                                          opt.value === 0 &&
                                              !isStaff && { color: "#ddd" },
                                          opt.value === 5 && {
                                              fontWeight: "600",
                                              color: "#555",
                                          },
                                      ]}
                                  >
                                      {opt.label}
                                  </Text>
                              </TouchableOpacity>
                          ))
                        : isStaff &&
                          options.map((opt) => (
                              <TouchableOpacity
                                  key={opt.value}
                                  style={styles.option}
                                  onPress={() => {
                                      onClose();
                                      if (opt.value !== 3) onSelect(opt.value);
                                  }}
                              >
                                  <Text
                                      style={[
                                          styles.text,
                                          opt.value === 2 && {
                                              color: "#E53935",
                                          },
                                          opt.value === 3 && {
                                              fontWeight: "600",
                                              color: "#555",
                                          },
                                      ]}
                                  >
                                      {opt.label}
                                  </Text>
                              </TouchableOpacity>
                          ))}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(30,30,30,0.3)",
        justifyContent: "center",
        alignItems: "center",
    },
    modal: {
        backgroundColor: "#fff",
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 32,
        minWidth: 260,
        elevation: 8,
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 12,
    },
    option: {
        paddingVertical: 12,
        alignItems: "center",
    },
    text: {
        fontSize: 17,
        color: "#222",
    },
});
