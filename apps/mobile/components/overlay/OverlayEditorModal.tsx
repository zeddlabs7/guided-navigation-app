import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
  StatusBar,
  Platform,
  Animated,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path } from 'react-native-svg';
import type { Overlay, ArrowDirection } from '@guidenav/types';
import { OverlayCanvas, type EditorMode } from './OverlayCanvas';
import { LabelInputModal } from './LabelInputModal';
import { OverlayTutorial, type OverlayTutorialType } from './OverlayTutorial';

const ARROW_DIRECTIONS: { value: ArrowDirection; label: string }[] = [
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
  { value: 'up-down', label: 'Up/Down' },
  { value: 'forward-backward', label: 'Forward' },
];

function ArrowDirectionIcon({ direction, size = 18 }: { direction: ArrowDirection; size?: number }) {
  const color = '#555555';
  switch (direction) {
    case 'left':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M20 18C20 18 16 14 12 14C8 14 4 18 4 18" stroke={color} strokeWidth={2} strokeLinecap="round" />
          <Path d="M4 18L4 12" stroke={color} strokeWidth={2} strokeLinecap="round" />
          <Path d="M4 18L10 18" stroke={color} strokeWidth={2} strokeLinecap="round" />
        </Svg>
      );
    case 'right':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M4 18C4 18 8 14 12 14C16 14 20 18 20 18" stroke={color} strokeWidth={2} strokeLinecap="round" />
          <Path d="M20 18L20 12" stroke={color} strokeWidth={2} strokeLinecap="round" />
          <Path d="M20 18L14 18" stroke={color} strokeWidth={2} strokeLinecap="round" />
        </Svg>
      );
    case 'up-down':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M12 20V4M12 4L6 10M12 4L18 10" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'forward-backward':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M12 20V6M12 6L6 12M12 6L18 12" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M6 20H18" stroke={color} strokeWidth={2} strokeLinecap="round" />
        </Svg>
      );
    default:
      return null;
  }
}

function generateId(): string {
  return `overlay-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function PulsingButton({
  pulse,
  style,
  onPress,
  children,
}: {
  pulse: boolean;
  style?: StyleProp<ViewStyle>;
  onPress: () => void;
  children: React.ReactNode;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!pulse) {
      scaleAnim.setValue(1);
      return;
    }
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.06, duration: 700, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulse, scaleAnim]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable style={style} onPress={onPress}>
        {children}
      </Pressable>
    </Animated.View>
  );
}

interface OverlayEditorModalProps {
  visible: boolean;
  imageUrl: string;
  overlays: Overlay[];
  userId?: string;
  onSave: (overlays: Overlay[]) => void;
  onCancel: () => void;
}

export function OverlayEditorModal({
  visible,
  imageUrl,
  overlays: initialOverlays,
  userId = 'dev-user-placeholder',
  onSave,
  onCancel,
}: OverlayEditorModalProps) {
  const insets = useSafeAreaInsets();
  const [overlays, setOverlays] = useState<Overlay[]>(initialOverlays);
  const [mode, setMode] = useState<EditorMode>('view');
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
  const [showArrowTypePicker, setShowArrowTypePicker] = useState(false);
  const [pendingArrowDirection, setPendingArrowDirection] = useState<ArrowDirection>('up-down');
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [editingLabelOverlayId, setEditingLabelOverlayId] = useState<string | null>(null);
  const [showPulse, setShowPulse] = useState(false);

  const [hasSeenArrowTutorial, setHasSeenArrowTutorial] = useState(true);
  const [hasSeenMarkerTutorial, setHasSeenMarkerTutorial] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialType, setTutorialType] = useState<OverlayTutorialType>('arrow');

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setOverlays(initialOverlays);
      setMode('view');
      setSelectedOverlayId(null);
      setShowArrowTypePicker(false);
      setShowLabelModal(false);
      if (initialOverlays.length === 0) {
        setShowPulse(true);
        const timer = setTimeout(() => setShowPulse(false), 4000);
        return () => clearTimeout(timer);
      }
    }
  }, [visible, initialOverlays]);

  useEffect(() => {
    (async () => {
      const arrowKey = `overlay-tutorial-seen-arrow:${userId}`;
      const markerKey = `overlay-tutorial-seen-marker:${userId}`;
      const [arrowSeen, markerSeen] = await Promise.all([
        AsyncStorage.getItem(arrowKey),
        AsyncStorage.getItem(markerKey),
      ]);
      setHasSeenArrowTutorial(arrowSeen === 'true');
      setHasSeenMarkerTutorial(markerSeen === 'true');
    })();
  }, [userId]);

  const hasArrow = useMemo(() => overlays.some((o) => o.type === 'arrow'), [overlays]);
  const hasMarker = useMemo(() => overlays.some((o) => o.type === 'marker'), [overlays]);

  const selectedOverlay = useMemo(() => {
    if (!selectedOverlayId) return null;
    return overlays.find((o) => o.id === selectedOverlayId) ?? null;
  }, [overlays, selectedOverlayId]);

  const labelModalTitle = useMemo(() => {
    if (editingLabelOverlayId) {
      const overlay = overlays.find((o) => o.id === editingLabelOverlayId);
      return overlay?.label ? 'Edit Note' : 'Add Note on the Marker';
    }
    return 'Add Note on the Marker';
  }, [editingLabelOverlayId, overlays]);

  const labelModalInitialValue = useMemo(() => {
    if (editingLabelOverlayId) {
      const overlay = overlays.find((o) => o.id === editingLabelOverlayId);
      return overlay?.label ?? '';
    }
    return '';
  }, [editingLabelOverlayId, overlays]);

  const markArrowTutorialSeen = useCallback(async () => {
    const key = `overlay-tutorial-seen-arrow:${userId}`;
    await AsyncStorage.setItem(key, 'true');
    setHasSeenArrowTutorial(true);
  }, [userId]);

  const markMarkerTutorialSeen = useCallback(async () => {
    const key = `overlay-tutorial-seen-marker:${userId}`;
    await AsyncStorage.setItem(key, 'true');
    setHasSeenMarkerTutorial(true);
  }, [userId]);

  const dismissPulse = useCallback(() => setShowPulse(false), []);

  const handleAddArrowClick = useCallback(() => {
    dismissPulse();
    if (mode === 'add-arrow') {
      setMode('view');
      setShowArrowTypePicker(false);
      return;
    }
    setShowArrowTypePicker(true);
    setSelectedOverlayId(null);
  }, [mode, dismissPulse]);

  const handleArrowTypeSelect = useCallback((direction: ArrowDirection) => {
    setPendingArrowDirection(direction);
    setShowArrowTypePicker(false);
    setMode('add-arrow');
  }, []);

  const handleArrowTypePickerCancel = useCallback(() => {
    setShowArrowTypePicker(false);
  }, []);

  const handleAddMarkerClick = useCallback(() => {
    dismissPulse();
    setMode((prev) => (prev === 'add-marker' ? 'view' : 'add-marker'));
    setSelectedOverlayId(null);
  }, [dismissPulse]);

  const handleSelectOverlay = useCallback(
    (id: string | null) => {
      setSelectedOverlayId(id);
      if (id) {
        setMode('select');
      } else if (mode === 'select') {
        setMode('view');
      }
    },
    [mode],
  );

  const handleAddOverlay = useCallback(
    (x: number, y: number) => {
      if (mode === 'add-arrow') {
        const newOverlay: Overlay = {
          id: generateId(),
          type: 'arrow',
          x,
          y,
          scale: 2,
          rotation: 0,
          label: null,
          arrowDirection: pendingArrowDirection,
        };
        const filtered = overlays.filter((o) => o.type !== 'arrow');
        setOverlays([...filtered, newOverlay]);
        setSelectedOverlayId(newOverlay.id);
        setMode('select');

        if (!hasSeenArrowTutorial) {
          setTutorialType('arrow');
          setShowTutorial(true);
        }
      }
    },
    [mode, pendingArrowDirection, overlays, hasSeenArrowTutorial],
  );

  const handleCanvasTap = useCallback(
    (x: number, y: number) => {
      if (mode === 'add-marker') {
        const newOverlay: Overlay = {
          id: generateId(),
          type: 'marker',
          x,
          y,
          scale: 1,
          rotation: 0,
          label: null,
        };
        const filtered = overlays.filter((o) => o.type !== 'marker');
        setOverlays([...filtered, newOverlay]);
        setSelectedOverlayId(newOverlay.id);
        setMode('select');

        if (!hasSeenMarkerTutorial) {
          setTutorialType('marker');
          setShowTutorial(true);
        }
      }
    },
    [mode, overlays, hasSeenMarkerTutorial],
  );

  const handleUpdateOverlay = useCallback(
    (id: string, updates: Partial<Overlay>) => {
      setOverlays((prev) => prev.map((o) => (o.id === id ? { ...o, ...updates } : o)));
    },
    [],
  );

  const handleChangeDirection = useCallback(
    (direction: ArrowDirection) => {
      if (!selectedOverlayId) return;
      handleUpdateOverlay(selectedOverlayId, { arrowDirection: direction });
    },
    [selectedOverlayId, handleUpdateOverlay],
  );

  const handleEditLabel = useCallback(() => {
    if (!selectedOverlayId) return;
    setEditingLabelOverlayId(selectedOverlayId);
    setShowLabelModal(true);
  }, [selectedOverlayId]);

  const handleDelete = useCallback(() => {
    if (!selectedOverlayId) return;
    setOverlays((prev) => prev.filter((o) => o.id !== selectedOverlayId));
    setSelectedOverlayId(null);
    setMode('view');
  }, [selectedOverlayId]);

  const handleLabelSave = useCallback(
    (label: string) => {
      if (editingLabelOverlayId) {
        setOverlays((prev) =>
          prev.map((o) => (o.id === editingLabelOverlayId ? { ...o, label } : o)),
        );
        setEditingLabelOverlayId(null);
      }
      setShowLabelModal(false);
    },
    [editingLabelOverlayId],
  );

  const handleLabelCancel = useCallback(() => {
    setEditingLabelOverlayId(null);
    setShowLabelModal(false);
  }, []);

  const handleDone = useCallback(() => {
    onSave(overlays);
  }, [overlays, onSave]);

  const handleCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);

  const handleTutorialComplete = useCallback(() => {
    if (tutorialType === 'arrow') markArrowTutorialSeen();
    else markMarkerTutorialSeen();
    setShowTutorial(false);
  }, [tutorialType, markArrowTutorialSeen, markMarkerTutorialSeen]);

  const handleTutorialSkip = useCallback(() => {
    if (tutorialType === 'arrow') markArrowTutorialSeen();
    else markMarkerTutorialSeen();
    setShowTutorial(false);
  }, [tutorialType, markArrowTutorialSeen, markMarkerTutorialSeen]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleCancel}
      statusBarTranslucent={Platform.OS === 'android'}
    >
      <GestureHandlerRootView style={styles.gestureRoot}>
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <StatusBar barStyle="light-content" />

        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.headerBtn} onPress={handleCancel}>
            <Text style={styles.headerBtnTextCancel}>Cancel</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Edit Overlays</Text>
          <Pressable style={styles.headerBtn} onPress={handleDone}>
            <Text style={styles.headerBtnTextDone}>Done</Text>
          </Pressable>
        </View>

        {/* Canvas area */}
        <View style={styles.canvasArea}>
          <OverlayCanvas
            imageUrl={imageUrl}
            overlays={overlays}
            selectedId={selectedOverlayId}
            mode={mode}
            onSelectOverlay={handleSelectOverlay}
            onAddOverlay={handleAddOverlay}
            onUpdateOverlay={handleUpdateOverlay}
            onCanvasTap={handleCanvasTap}
          />
        </View>

        {/* Context bar (when overlay is selected) */}
        {selectedOverlay && (
          <View style={styles.contextBar}>
            {selectedOverlay.type === 'arrow' && (
              <View style={styles.directionRow}>
                {ARROW_DIRECTIONS.map((dir) => (
                  <Pressable
                    key={dir.value}
                    style={[
                      styles.directionChip,
                      selectedOverlay.arrowDirection === dir.value && styles.directionChipActive,
                    ]}
                    onPress={() => handleChangeDirection(dir.value)}
                  >
                    <ArrowDirectionIcon direction={dir.value} size={16} />
                    <Text
                      style={[
                        styles.directionChipText,
                        selectedOverlay.arrowDirection === dir.value && styles.directionChipTextActive,
                      ]}
                    >
                      {dir.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {selectedOverlay.type === 'marker' && (
              <Pressable style={styles.labelBtn} onPress={handleEditLabel}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13"
                    stroke="#fff"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z"
                    stroke="#fff"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
                <Text style={styles.labelBtnText}>
                  {selectedOverlay.label ? 'Edit Note' : 'Add Note'}
                </Text>
              </Pressable>
            )}

            <Pressable style={styles.deleteBtn} onPress={handleDelete}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M3 6H5H21"
                  stroke="#ef4444"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6"
                  stroke="#ef4444"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </Pressable>
          </View>
        )}

        {/* Bottom toolbar */}
        <View style={styles.bottomBar}>
          {selectedOverlay?.type === 'arrow' && (
            <Text style={styles.gestureHint}>Drag arrow to move · Use handles below to resize & rotate</Text>
          )}
          {selectedOverlay?.type === 'marker' && (
            <Text style={styles.gestureHint}>Drag to move</Text>
          )}

          <View style={styles.addButtonsRow}>
            <View style={styles.arrowBtnWrapper}>
              <PulsingButton
                pulse={showPulse}
                style={[
                  styles.addBtn,
                  (mode === 'add-arrow' || showArrowTypePicker) && styles.addBtnActive,
                ]}
                onPress={handleAddArrowClick}
              >
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M7 17L17 7M17 7H7M17 7V17"
                    stroke={(mode === 'add-arrow' || showArrowTypePicker) ? 'white' : '#e5e7eb'}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
                <Text
                  style={[
                    styles.addBtnText,
                    (mode === 'add-arrow' || showArrowTypePicker) && styles.addBtnTextActive,
                  ]}
                >
                  {hasArrow ? 'Replace Arrow' : 'Add Arrow'}
                </Text>
              </PulsingButton>

              {showArrowTypePicker && (
                <View style={styles.arrowPicker}>
                  <View style={styles.arrowPickerHeader}>
                    <Text style={styles.arrowPickerTitle}>Choose arrow type</Text>
                    <Pressable style={styles.arrowPickerClose} onPress={handleArrowTypePickerCancel}>
                      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                        <Path d="M18 6L6 18M6 6L18 18" stroke="#99a1af" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </Svg>
                    </Pressable>
                  </View>
                  <View style={styles.arrowPickerGrid}>
                    {ARROW_DIRECTIONS.map((dir) => (
                      <Pressable
                        key={dir.value}
                        style={styles.arrowPickerOption}
                        onPress={() => handleArrowTypeSelect(dir.value)}
                      >
                        <ArrowDirectionIcon direction={dir.value} size={18} />
                        <Text style={styles.arrowPickerLabel} numberOfLines={1}>{dir.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
            </View>

            <PulsingButton
              pulse={showPulse}
              style={[styles.addBtn, mode === 'add-marker' && styles.addBtnActive]}
              onPress={handleAddMarkerClick}
            >
              <View style={[styles.markerDot, mode === 'add-marker' && styles.markerDotActive]} />
              <Text style={[styles.addBtnText, mode === 'add-marker' && styles.addBtnTextActive]}>
                {hasMarker ? 'Replace Marker' : 'Add Marker'}
              </Text>
            </PulsingButton>
          </View>
        </View>

        <LabelInputModal
          visible={showLabelModal}
          initialValue={labelModalInitialValue}
          title={labelModalTitle}
          onSave={handleLabelSave}
          onCancel={handleLabelCancel}
        />

        <OverlayTutorial
          visible={showTutorial}
          type={tutorialType}
          onComplete={handleTutorialComplete}
          onSkip={handleTutorialSkip}
        />
      </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerBtn: {
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  headerBtnTextCancel: {
    fontSize: 16,
    color: '#9ca3af',
    fontWeight: '500',
  },
  headerBtnTextDone: {
    fontSize: 16,
    color: '#60a5fa',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
  },
  canvasArea: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  contextBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  directionRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  directionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: '#1f2937',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  directionChipActive: {
    backgroundColor: '#fef3c7',
    borderColor: '#fcd34d',
  },
  directionChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9ca3af',
  },
  directionChipTextActive: {
    color: '#92400e',
  },
  labelBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#1f2937',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  labelBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  deleteBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#374151',
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
  },
  gestureHint: {
    textAlign: 'center',
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  addButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  arrowBtnWrapper: {
    position: 'relative',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 10,
  },
  addBtnActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#e5e7eb',
  },
  addBtnTextActive: {
    color: '#ffffff',
  },
  markerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ef4444',
    borderWidth: 2,
    borderColor: '#fca5a5',
  },
  markerDotActive: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
  },
  arrowPicker: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    marginBottom: 8,
    width: 200,
    padding: 10,
    backgroundColor: '#1f2937',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
    zIndex: 20,
  },
  arrowPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  arrowPickerTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#e5e7eb',
  },
  arrowPickerClose: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
  arrowPickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  arrowPickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#374151',
    borderRadius: 8,
    width: '48%',
  },
  arrowPickerLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#e5e7eb',
  },
});
