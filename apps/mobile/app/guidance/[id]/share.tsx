import { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Modal,
  TextInput,
  Share,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import DateTimePicker from '@react-native-community/datetimepicker';
import Svg, { Path, Circle } from 'react-native-svg';
import type { AvailabilityMode, GuidanceSet } from '@guidenav/types';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';
import { getBottomInset } from '@/components/ui/ScreenFooter';
import { openWhatsAppShare } from '@/lib/share-whatsapp';
import { getGuidanceSet, updateGuidanceSet } from '@/services/guidance';
import {
  createShareLink,
  getShareLinkForGuidance,
  revokeShareLink,
  buildShareUrl,
} from '@/services/share-links';
import {
  LINK_VALIDITY_OPTIONS,
  DEFAULT_VALIDITY_OPTION,
  type LinkValidityOption,
} from '@/constants/linkValidity';

const AVAILABILITY_OPTIONS: {
  value: AvailabilityMode;
  label: string;
  description: string;
  icon: 'check' | 'clock' | 'x';
}[] = [
  {
    value: 'ANYTIME_TODAY',
    label: 'Available Anytime',
    description: 'I can receive deliveries at any time today',
    icon: 'check',
  },
  {
    value: 'TIME_WINDOW',
    label: 'Specific Time Window',
    description: 'I can only receive deliveries during specific hours',
    icon: 'clock',
  },
  {
    value: 'NOT_AVAILABLE_TODAY',
    label: 'Not Available Today',
    description: 'I cannot receive deliveries today',
    icon: 'x',
  },
];

function AvailabilityIcon({ icon, selected }: { icon: 'check' | 'clock' | 'x'; selected: boolean }) {
  const color = selected ? '#ffffff' : '#99a1af';
  if (icon === 'check') {
    return (
      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M22 4L12 14.01l-3-3" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }
  if (icon === 'clock') {
    return (
      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={2} />
        <Path d="M12 6v6l4 2" stroke={color} strokeWidth={2} strokeLinecap="round" />
      </Svg>
    );
  }
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={2} />
      <Path d="M15 9l-6 6M9 9l6 6" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export default function ShareScreen() {
  const router = useRouter();
  const { id: guidanceSetId } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const modalBottomPadding = Math.max(getBottomInset(insets), Spacing.lg);

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [guidanceSet, setGuidanceSet] = useState<GuidanceSet | null>(null);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [shareLinkId, setShareLinkId] = useState<string | null>(null);
  const [linkStatus, setLinkStatus] = useState<'ACTIVE' | 'EXPIRED' | 'REVOKED' | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [selectedAvailability, setSelectedAvailability] = useState<AvailabilityMode>('ANYTIME_TODAY');
  const defaultStart = new Date(); defaultStart.setHours(9, 0, 0, 0);
  const defaultEnd = new Date(); defaultEnd.setHours(17, 0, 0, 0);
  const [startTime, setStartTime] = useState<Date>(defaultStart);
  const [endTime, setEndTime] = useState<Date>(defaultEnd);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const isIOS = Platform.OS === 'ios';
  const [selectedValidity, setSelectedValidity] = useState<LinkValidityOption>(DEFAULT_VALIDITY_OPTION);

  const courierAppUrl = shareToken ? buildShareUrl(shareToken) : null;

  const loadData = useCallback(async () => {
    if (!guidanceSetId) return;
    setLoading(true);
    try {
      const gs = await getGuidanceSet(guidanceSetId);
      if (gs) {
        setGuidanceSet(gs);
        setSelectedAvailability(gs.availabilityMode || 'ANYTIME_TODAY');

        if (gs.status === 'PUBLISHED') {
          const existingLink = await getShareLinkForGuidance(guidanceSetId);
          if (existingLink && existingLink.status === 'ACTIVE') {
            setShareLinkId(existingLink.id);
            setLinkStatus('ACTIVE');
          }
        }
      }
    } catch (err) {
      console.error('Failed to load guidance set:', err);
    } finally {
      setLoading(false);
    }
  }, [guidanceSetId]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  useEffect(() => {
    return () => {
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
    };
  }, []);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleGoToDashboard = useCallback(() => {
    router.replace('/(tabs)/dashboard' as any);
  }, [router]);

  const formatTime = (date: Date) => {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  const openAvailabilityModal = useCallback(() => {
    setSelectedAvailability(guidanceSet?.availabilityMode || 'ANYTIME_TODAY');
    setSelectedValidity(DEFAULT_VALIDITY_OPTION);
    setShowStartPicker(false);
    setShowEndPicker(false);
    setShowModal(true);
  }, [guidanceSet]);

  const handleConfirmAndGenerate = useCallback(async () => {
    if (!guidanceSetId) return;
    setGenerating(true);
    setShowModal(false);

    try {
      const updateData: Record<string, any> = {
        availabilityMode: selectedAvailability,
      };

      if (selectedAvailability === 'TIME_WINDOW') {
        const today = new Date();
        const startDate = new Date(today);
        startDate.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
        const endDate = new Date(today);
        endDate.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);

        updateData.availabilityStartTs = startDate.toISOString();
        updateData.availabilityEndTs = endDate.toISOString();
      }

      await updateGuidanceSet(guidanceSetId, updateData);

      if (shareLinkId) {
        await revokeShareLink(shareLinkId);
      }

      const result = await createShareLink({
        guidanceSetId,
        expiryDurationMinutes: selectedValidity.minutes,
      });

      setShareToken(result.token);
      setShareLinkId(result.shareLinkId);
      setLinkStatus('ACTIVE');
    } catch (err) {
      console.error('Failed to generate share link:', err);
      Alert.alert('Error', 'Failed to generate share link. Please try again.');
    } finally {
      setGenerating(false);
    }
  }, [guidanceSetId, selectedAvailability, startTime, endTime, shareLinkId, selectedValidity]);

  const handleCopyLink = useCallback(async () => {
    if (!courierAppUrl) return;
    await Clipboard.setStringAsync(courierAppUrl);
    setCopied(true);
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopied(false), 2000);
  }, [courierAppUrl]);

  const handleWhatsAppShare = useCallback(async () => {
    if (!courierAppUrl) return;
    await openWhatsAppShare(`Here are directions to my address: ${courierAppUrl}`);
  }, [courierAppUrl]);

  const handleNativeShare = useCallback(async () => {
    if (!courierAppUrl) return;
    try {
      await Share.share({
        message: `Here are directions to my address: ${courierAppUrl}`,
        url: courierAppUrl,
      });
    } catch {
      // user cancelled
    }
  }, [courierAppUrl]);

  const handleRevoke = useCallback(async () => {
    if (!shareLinkId) return;
    Alert.alert('Revoke Link', 'This will permanently disable this share link. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Revoke',
        style: 'destructive',
        onPress: async () => {
          setRevoking(true);
          try {
            await revokeShareLink(shareLinkId);
            setShareToken(null);
            setShareLinkId(null);
            setLinkStatus(null);
          } catch (err) {
            console.error('Failed to revoke share link:', err);
            Alert.alert('Error', 'Failed to revoke link. Please try again.');
          } finally {
            setRevoking(false);
          }
        },
      },
    ]);
  }, [shareLinkId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.text} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerNav}>
          <Pressable style={styles.headerBtn} onPress={handleBack}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path d="M19 12H5M5 12L12 19M5 12L12 5" stroke={Colors.textSecondary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </Pressable>
          <Pressable style={styles.headerBtn} onPress={handleGoToDashboard}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke={Colors.textMuted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              <Path d="M9 22V12H15V22" stroke={Colors.textMuted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </Pressable>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Title section */}
        <View style={styles.titleSection}>
          <Text style={styles.pageTitle}>Share Link</Text>
          <Text style={styles.pageSubtitle}>
            Share this link with couriers to guide them to your address.
          </Text>
        </View>

        {/* Address banner */}
        {guidanceSet?.title ? (
          <View style={styles.addressBanner}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke={Colors.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              <Path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke={Colors.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
            <Text style={styles.addressBannerText}>{guidanceSet.title}</Text>
          </View>
        ) : null}

        {/* Main card */}
        <View style={styles.card}>
          {!courierAppUrl ? (
            /* No active link state */
            <View style={styles.noLink}>
              <View style={styles.noLinkIcon}>
                <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
                  <Path d="M10 13C10.4295 13.5741 10.9774 14.0492 11.6066 14.3929C12.2357 14.7367 12.9315 14.9411 13.6467 14.9923C14.3618 15.0435 15.0796 14.9404 15.7513 14.6898C16.4231 14.4392 17.0331 14.0471 17.54 13.54L20.54 10.54C21.4508 9.59699 21.9548 8.33397 21.9434 7.02299C21.932 5.71201 21.4061 4.45794 20.4791 3.5309C19.5521 2.60386 18.298 2.07802 16.987 2.06663C15.676 2.05523 14.413 2.55921 13.47 3.47L11.75 5.18" stroke="#99a1af" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  <Path d="M14 11C13.5705 10.4259 13.0226 9.95083 12.3934 9.60707C11.7643 9.26331 11.0685 9.05889 10.3533 9.00768C9.63821 8.95646 8.92041 9.05964 8.24866 9.31023C7.5769 9.56082 6.96689 9.95294 6.46 10.46L3.46 13.46C2.54921 14.403 2.04524 15.666 2.05663 16.977C2.06802 18.288 2.59387 19.5421 3.52091 20.4691C4.44795 21.3961 5.70201 21.922 7.01299 21.9334C8.32398 21.9448 9.58699 21.4408 10.53 20.53L12.24 18.82" stroke="#99a1af" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </View>
              <Text style={styles.noLinkTitle}>
                {shareLinkId ? 'Link generated but token not available' : 'No active share link'}
              </Text>
              <Text style={styles.noLinkText}>
                {shareLinkId
                  ? 'Generate a new link to get a shareable URL'
                  : 'Generate a link to share your address with couriers'}
              </Text>
              <Pressable
                style={[styles.generateBtn, generating && styles.btnDisabled]}
                onPress={openAvailabilityModal}
                disabled={generating}
              >
                {generating ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.generateBtnText}>
                    {shareLinkId ? 'Regenerate Share Link' : 'Generate Share Link'}
                  </Text>
                )}
              </Pressable>
            </View>
          ) : (
            /* Active link state */
            <View style={styles.activeLink}>
              {/* Status badge */}
              <View style={styles.activeLinkBadgeRow}>
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>ACTIVE</Text>
                </View>
              </View>

              {/* URL display + copy */}
              <View style={styles.urlRow}>
                <TextInput
                  style={styles.urlInput}
                  value={courierAppUrl}
                  editable={false}
                  selectTextOnFocus
                />
                <Pressable
                  style={[styles.copyBtn, copied && styles.copyBtnCopied]}
                  onPress={handleCopyLink}
                >
                  <Text style={styles.copyBtnText}>{copied ? 'Copied!' : 'Copy'}</Text>
                </Pressable>
              </View>

              <Text style={styles.linkHint}>This link opens the courier delivery guide app.</Text>

              {/* Share actions (mobile-specific) */}
              <View style={styles.shareActions}>
                <Pressable style={styles.whatsappBtn} onPress={handleWhatsAppShare}>
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                    <Path d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                  <Text style={styles.whatsappBtnText}>Share via WhatsApp</Text>
                </Pressable>
                <Pressable style={styles.nativeShareBtn} onPress={handleNativeShare}>
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                    <Path d="M4 12V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V12" stroke={Colors.textSecondary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    <Path d="M16 6L12 2L8 6" stroke={Colors.textSecondary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    <Path d="M12 2V15" stroke={Colors.textSecondary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                  <Text style={styles.nativeShareBtnText}>Share...</Text>
                </Pressable>
              </View>

              {/* Regenerate / Revoke */}
              <View style={styles.linkActions}>
                <Pressable
                  style={[styles.regenerateBtn, generating && styles.btnDisabled]}
                  onPress={openAvailabilityModal}
                  disabled={generating}
                >
                  {generating ? (
                    <ActivityIndicator size="small" color="#4a5565" />
                  ) : (
                    <Text style={styles.regenerateBtnText}>Regenerate</Text>
                  )}
                </Pressable>
                <Pressable
                  style={[styles.revokeBtn, revoking && styles.btnDisabled]}
                  onPress={handleRevoke}
                  disabled={revoking}
                >
                  {revoking ? (
                    <ActivityIndicator size="small" color="#dc2626" />
                  ) : (
                    <Text style={styles.revokeBtnText}>Revoke</Text>
                  )}
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Android-only: time picker dialogs rendered outside modal */}
      {!isIOS && showStartPicker && (
        <DateTimePicker
          value={startTime}
          mode="time"
          is24Hour
          display="default"
          onChange={(_e, date) => {
            setShowStartPicker(false);
            if (date) setStartTime(date);
          }}
        />
      )}
      {!isIOS && showEndPicker && (
        <DateTimePicker
          value={endTime}
          mode="time"
          is24Hour
          display="default"
          onChange={(_e, date) => {
            setShowEndPicker(false);
            if (date) setEndTime(date);
          }}
        />
      )}

      {/* Availability + Validity Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalDismissArea} onPress={() => setShowModal(false)} />
          <View style={[styles.modalContent, { paddingBottom: modalBottomPadding }]}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Set Availability</Text>
              <Text style={styles.modalSubtitle}>Let couriers know when you can receive deliveries</Text>
            </View>

            <ScrollView
              style={styles.modalScroll}
              showsVerticalScrollIndicator={false}
              bounces
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
            >
              {/* Availability options */}
              <View style={styles.availabilityOptions}>
                {AVAILABILITY_OPTIONS.map((option) => {
                  const isSelected = selectedAvailability === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      style={[
                        styles.availabilityOption,
                        isSelected && styles.availabilityOptionSelected,
                      ]}
                      onPress={() => setSelectedAvailability(option.value)}
                    >
                      <View
                        style={[
                          styles.availabilityIconCircle,
                          isSelected && styles.availabilityIconCircleSelected,
                        ]}
                      >
                        <AvailabilityIcon icon={option.icon} selected={isSelected} />
                      </View>
                      <View style={styles.availabilityText}>
                        <Text style={styles.availabilityLabel}>{option.label}</Text>
                        <Text style={styles.availabilityDescription}>{option.description}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {/* Time window inputs */}
              {selectedAvailability === 'TIME_WINDOW' && (
                <View style={styles.timeWindow}>
                  <View style={styles.timeRow}>
                    <Text style={styles.timeLabel}>From</Text>
                    {isIOS ? (
                      <DateTimePicker
                        value={startTime}
                        mode="time"
                        is24Hour
                        display="compact"
                        onChange={(_e, date) => { if (date) setStartTime(date); }}
                      />
                    ) : (
                      <Pressable style={styles.timeButton} onPress={() => setShowStartPicker(true)}>
                        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                          <Circle cx={12} cy={12} r={10} stroke="#99a1af" strokeWidth={2} />
                          <Path d="M12 6v6l4 2" stroke="#99a1af" strokeWidth={2} strokeLinecap="round" />
                        </Svg>
                        <Text style={styles.timeButtonText}>{formatTime(startTime)}</Text>
                      </Pressable>
                    )}
                  </View>
                  <View style={styles.timeRowDivider} />
                  <View style={styles.timeRow}>
                    <Text style={styles.timeLabel}>To</Text>
                    {isIOS ? (
                      <DateTimePicker
                        value={endTime}
                        mode="time"
                        is24Hour
                        display="compact"
                        onChange={(_e, date) => { if (date) setEndTime(date); }}
                      />
                    ) : (
                      <Pressable style={styles.timeButton} onPress={() => setShowEndPicker(true)}>
                        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                          <Circle cx={12} cy={12} r={10} stroke="#99a1af" strokeWidth={2} />
                          <Path d="M12 6v6l4 2" stroke="#99a1af" strokeWidth={2} strokeLinecap="round" />
                        </Svg>
                        <Text style={styles.timeButtonText}>{formatTime(endTime)}</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              )}

              {/* Link validity picker (mobile-specific) */}
              <View style={styles.validitySection}>
                <Text style={styles.validitySectionTitle}>Link Validity</Text>
                <Text style={styles.validitySectionSubtitle}>
                  How long should this link remain active?
                </Text>
                <View style={styles.validityOptions}>
                  {LINK_VALIDITY_OPTIONS.map((option) => {
                    const isSelected = selectedValidity.minutes === option.minutes;
                    return (
                      <Pressable
                        key={option.minutes}
                        style={[
                          styles.validityOption,
                          isSelected && styles.validityOptionSelected,
                          option.premium && styles.validityOptionPremium,
                        ]}
                        onPress={() => {
                          if (!option.premium) setSelectedValidity(option);
                        }}
                        disabled={option.premium}
                      >
                        <View style={styles.validityOptionRow}>
                          <View
                            style={[
                              styles.validityRadio,
                              isSelected && styles.validityRadioSelected,
                            ]}
                          >
                            {isSelected && <View style={styles.validityRadioInner} />}
                          </View>
                          <Text
                            style={[
                              styles.validityOptionLabel,
                              option.premium && styles.validityOptionLabelDisabled,
                            ]}
                          >
                            {option.label}
                          </Text>
                          {option.premium && (
                            <View style={styles.comingSoonBadge}>
                              <Text style={styles.comingSoonText}>Coming Soon</Text>
                            </View>
                          )}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            {/* Modal actions */}
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancelBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalConfirmBtn, generating && styles.btnDisabled]}
                onPress={handleConfirmAndGenerate}
                disabled={generating}
              >
                {generating ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.modalConfirmText}>
                    {shareLinkId ? 'Update & Regenerate' : 'Generate Link'}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  headerNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scrollView: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },

  titleSection: {
    marginBottom: Spacing.xl,
  },
  pageTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  pageSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    lineHeight: 20,
  },

  addressBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  addressBannerText: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.text,
    flex: 1,
  },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  noLink: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  noLinkIcon: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  noLinkTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  noLinkText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  generateBtn: {
    width: '100%',
    paddingVertical: 13,
    backgroundColor: Colors.text,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateBtnText: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: '#ffffff',
  },

  activeLink: {
    gap: Spacing.lg,
  },
  activeLinkBadgeRow: {
    alignItems: 'center',
  },
  activeBadge: {
    backgroundColor: '#dcfce7',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.full,
  },
  activeBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: '#16a34a',
    letterSpacing: 0.5,
  },

  urlRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  urlInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  copyBtn: {
    paddingVertical: 10,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.text,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyBtnCopied: {
    backgroundColor: Colors.success,
  },
  copyBtnText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: '#ffffff',
  },
  linkHint: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
  },

  shareActions: {
    gap: Spacing.sm,
  },
  whatsappBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: '#25D366',
    borderRadius: BorderRadius.full,
  },
  whatsappBtnText: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: '#ffffff',
  },
  nativeShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.full,
  },
  nativeShareBtnText: {
    fontSize: FontSize.base,
    fontWeight: '500',
    color: Colors.textSecondary,
  },

  linkActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    justifyContent: 'center',
  },
  regenerateBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  regenerateBtnText: {
    fontSize: FontSize.base,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  revokeBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  revokeBtnText: {
    fontSize: FontSize.base,
    fontWeight: '500',
    color: Colors.danger,
  },

  btnDisabled: {
    opacity: 0.5,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalDismissArea: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    maxHeight: '85%',
    paddingHorizontal: Spacing.xl,
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  modalTitle: {
    fontSize: FontSize.xl,
    fontWeight: '600',
    color: Colors.text,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  modalScroll: {
    flexGrow: 0,
  },

  availabilityOptions: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  availabilityOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.xl,
  },
  availabilityOptionSelected: {
    borderColor: Colors.text,
    backgroundColor: Colors.background,
  },
  availabilityIconCircle: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  availabilityIconCircleSelected: {
    backgroundColor: Colors.text,
    borderColor: Colors.text,
  },
  availabilityText: {
    flex: 1,
    gap: 2,
  },
  availabilityLabel: {
    fontSize: FontSize.base,
    fontWeight: '500',
    color: Colors.text,
  },
  availabilityDescription: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },

  timeWindow: {
    paddingVertical: 4,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
  timeRowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
  },
  timeLabel: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: Spacing.md,
    paddingHorizontal: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
  },
  timeButtonText: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    letterSpacing: 0.5,
  },

  validitySection: {
    marginBottom: Spacing.xl,
  },
  validitySectionTitle: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  validitySectionSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },
  validityOptions: {
    gap: Spacing.sm,
  },
  validityOption: {
    paddingVertical: Spacing.md,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
  },
  validityOptionSelected: {
    borderColor: Colors.text,
    backgroundColor: Colors.background,
  },
  validityOptionPremium: {
    opacity: 0.5,
  },
  validityOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  validityRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  validityRadioSelected: {
    borderColor: Colors.text,
  },
  validityRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.text,
  },
  validityOptionLabel: {
    flex: 1,
    fontSize: FontSize.base,
    color: Colors.text,
  },
  validityOptionLabelDisabled: {
    color: Colors.textMuted,
  },
  comingSoonBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    backgroundColor: '#fef3c7',
    borderRadius: BorderRadius.sm,
  },
  comingSoonText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: '#d97706',
  },

  modalActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingTop: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 13,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: FontSize.base,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  modalConfirmBtn: {
    flex: 2,
    paddingVertical: 13,
    backgroundColor: Colors.text,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: '#ffffff',
  },
});
