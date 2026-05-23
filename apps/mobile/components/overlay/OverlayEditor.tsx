import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path } from 'react-native-svg';
import type { Overlay, ArrowDirection } from '@guidenav/types';
import { OverlayCanvas, type EditorMode } from './OverlayCanvas';
import { OverlayToolbar } from './OverlayToolbar';
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

interface OverlayEditorProps {
  imageUrl: string;
  overlays: Overlay[];
  readonly?: boolean;
  userId?: string;
  onUpdateOverlays: (overlays: Overlay[]) => void;
}

export function OverlayEditor({
  imageUrl,
  overlays,
  readonly = false,
  userId = 'dev-user-placeholder',
  onUpdateOverlays,
}: OverlayEditorProps) {
  const [mode, setMode] = useState<EditorMode>('view');
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [editingLabelOverlayId, setEditingLabelOverlayId] = useState<string | null>(null);
  const [showArrowTypePicker, setShowArrowTypePicker] = useState(false);
  const [pendingArrowDirection, setPendingArrowDirection] = useState<ArrowDirection>('up-down');

  const [hasSeenArrowTutorial, setHasSeenArrowTutorial] = useState(true);
  const [hasSeenMarkerTutorial, setHasSeenMarkerTutorial] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialType, setTutorialType] = useState<OverlayTutorialType>('arrow');

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
      return overlay?.label ? 'Edit Label' : 'Add Label';
    }
    return 'Add Label';
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

  const handleAddArrowClick = useCallback(() => {
    if (readonly) return;
    if (mode === 'add-arrow') {
      setMode('view');
      setShowArrowTypePicker(false);
      return;
    }
    setShowArrowTypePicker(true);
    setSelectedOverlayId(null);
  }, [readonly, mode]);

  const handleArrowTypeSelect = useCallback((direction: ArrowDirection) => {
    setPendingArrowDirection(direction);
    setShowArrowTypePicker(false);
    setMode('add-arrow');
  }, []);

  const handleArrowTypePickerCancel = useCallback(() => {
    setShowArrowTypePicker(false);
  }, []);

  const handleAddMarkerClick = useCallback(() => {
    if (readonly) return;
    setMode((prev) => (prev === 'add-marker' ? 'view' : 'add-marker'));
    setSelectedOverlayId(null);
  }, [readonly]);

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
        const filteredOverlays = overlays.filter((o) => o.type !== 'arrow');
        onUpdateOverlays([...filteredOverlays, newOverlay]);
        setSelectedOverlayId(newOverlay.id);
        setMode('select');

        if (!hasSeenArrowTutorial) {
          setTutorialType('arrow');
          setShowTutorial(true);
        }
      }
    },
    [mode, pendingArrowDirection, overlays, onUpdateOverlays, hasSeenArrowTutorial],
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
        const filteredOverlays = overlays.filter((o) => o.type !== 'marker');
        onUpdateOverlays([...filteredOverlays, newOverlay]);
        setSelectedOverlayId(newOverlay.id);
        setMode('select');

        if (!hasSeenMarkerTutorial) {
          setTutorialType('marker');
          setShowTutorial(true);
        }
      }
    },
    [mode, overlays, onUpdateOverlays, hasSeenMarkerTutorial],
  );

  const handleUpdateOverlay = useCallback(
    (id: string, updates: Partial<Overlay>) => {
      const updatedOverlays = overlays.map((o) =>
        o.id === id ? { ...o, ...updates } : o,
      );
      onUpdateOverlays(updatedOverlays);
    },
    [overlays, onUpdateOverlays],
  );

  const handleChangeDirection = useCallback(
    (direction: ArrowDirection) => {
      if (!selectedOverlayId) return;
      const overlay = overlays.find((o) => o.id === selectedOverlayId);
      if (overlay && overlay.type === 'arrow') {
        handleUpdateOverlay(selectedOverlayId, { arrowDirection: direction });
      }
    },
    [selectedOverlayId, overlays, handleUpdateOverlay],
  );

  const handleEditLabel = useCallback(() => {
    if (!selectedOverlayId) return;
    setEditingLabelOverlayId(selectedOverlayId);
    setShowLabelModal(true);
  }, [selectedOverlayId]);

  const handleDelete = useCallback(() => {
    if (!selectedOverlayId) return;
    const updatedOverlays = overlays.filter((o) => o.id !== selectedOverlayId);
    onUpdateOverlays(updatedOverlays);
    setSelectedOverlayId(null);
    setMode('view');
  }, [selectedOverlayId, overlays, onUpdateOverlays]);

  const handleDone = useCallback(() => {
    setSelectedOverlayId(null);
    setMode('view');
  }, []);

  const handleLabelSave = useCallback(
    (label: string) => {
      if (editingLabelOverlayId) {
        const updatedOverlays = overlays.map((o) =>
          o.id === editingLabelOverlayId ? { ...o, label } : o,
        );
        onUpdateOverlays(updatedOverlays);
        setEditingLabelOverlayId(null);
      }
      setShowLabelModal(false);
    },
    [editingLabelOverlayId, overlays, onUpdateOverlays],
  );

  const handleLabelCancel = useCallback(() => {
    setEditingLabelOverlayId(null);
    setShowLabelModal(false);
  }, []);

  const handleTutorialComplete = useCallback(() => {
    if (tutorialType === 'arrow') {
      markArrowTutorialSeen();
    } else {
      markMarkerTutorialSeen();
    }
    setShowTutorial(false);
  }, [tutorialType, markArrowTutorialSeen, markMarkerTutorialSeen]);

  const handleTutorialSkip = useCallback(() => {
    if (tutorialType === 'arrow') {
      markArrowTutorialSeen();
    } else {
      markMarkerTutorialSeen();
    }
    setShowTutorial(false);
  }, [tutorialType, markArrowTutorialSeen, markMarkerTutorialSeen]);

  return (
    <View style={styles.editor}>
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

      {!readonly && (
        <View style={styles.controls}>
          <View style={styles.addButtons}>
            <Text style={styles.label}>Overlay:</Text>

            <View style={styles.arrowBtnWrapper}>
              <Pressable
                style={[
                  styles.addBtn,
                  (mode === 'add-arrow' || showArrowTypePicker) &&
                    styles.addBtnActive,
                ]}
                onPress={handleAddArrowClick}
              >
                <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M7 17L17 7M17 7H7M17 7V17"
                    stroke={
                      mode === 'add-arrow' || showArrowTypePicker
                        ? 'white'
                        : '#4a5565'
                    }
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
                <Text
                  style={[
                    styles.addBtnText,
                    (mode === 'add-arrow' || showArrowTypePicker) &&
                      styles.addBtnTextActive,
                  ]}
                >
                  {hasArrow ? 'Replace Arrow' : 'Add Arrow'}
                </Text>
              </Pressable>

              {showArrowTypePicker && (
                <View style={styles.arrowPicker}>
                  <View style={styles.arrowPickerHeader}>
                    <Text style={styles.arrowPickerTitle}>
                      Choose arrow type
                    </Text>
                    <Pressable
                      style={styles.arrowPickerClose}
                      onPress={handleArrowTypePickerCancel}
                    >
                      <Svg
                        width={16}
                        height={16}
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <Path
                          d="M18 6L6 18M6 6L18 18"
                          stroke="#99a1af"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
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

            <Pressable
              style={[
                styles.addBtn,
                mode === 'add-marker' && styles.addBtnActive,
              ]}
              onPress={handleAddMarkerClick}
            >
              <View
                style={[
                  styles.markerDot,
                  mode === 'add-marker' && styles.markerDotActive,
                ]}
              />
              <Text
                style={[
                  styles.addBtnText,
                  mode === 'add-marker' && styles.addBtnTextActive,
                ]}
              >
                {hasMarker ? 'Replace Marker' : 'Add Marker'}
              </Text>
            </Pressable>
          </View>

          {selectedOverlay && (
            <View style={styles.toolbarContainer}>
              <OverlayToolbar
                overlayType={selectedOverlay.type}
                arrowDirection={selectedOverlay.arrowDirection}
                hasLabel={!!selectedOverlay.label}
                visible={true}
                onChangeDirection={handleChangeDirection}
                onEditLabel={handleEditLabel}
                onDelete={handleDelete}
                onDone={handleDone}
              />
            </View>
          )}
        </View>
      )}

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
  );
}

const styles = StyleSheet.create({
  editor: {
    gap: 12,
  },
  controls: {
    gap: 12,
  },
  addButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  label: {
    fontSize: 12,
    color: '#99a1af',
  },
  arrowBtnWrapper: {
    position: 'relative',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 13,
    paddingVertical: 8,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
  },
  addBtnActive: {
    backgroundColor: '#2c3e50',
    borderColor: '#2c3e50',
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4a5565',
  },
  addBtnTextActive: {
    color: 'white',
  },
  markerDot: {
    width: 10,
    height: 10,
    backgroundColor: '#ff6467',
    borderRadius: 5,
  },
  markerDotActive: {
    backgroundColor: 'white',
  },
  toolbarContainer: {
    alignItems: 'center',
  },
  arrowPicker: {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: 8,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    width: 240,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    zIndex: 100,
  },
  arrowPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  arrowPickerTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#101828',
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
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    width: '48%',
  },
  arrowPickerLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#101828',
  },
});
