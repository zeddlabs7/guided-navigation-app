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
import { useTranslation } from 'react-i18next';
import type { AvailabilityMode, GuidanceSet } from '@guidenav/types';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';
import { getBottomInset } from '@/components/ui/ScreenFooter';
import { openWhatsAppShare, openWhatsAppShareToNumber } from '@/lib/share-whatsapp';
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
  labelKey: string;
  descriptionKey: string;
  icon: 'check' | 'clock' | 'x';
}[] = [
  {
    value: 'ANYTIME_TODAY',
    labelKey: 'share.availToday',
    descriptionKey: 'share.availTodayDesc',
    icon: 'check',
  },
  {
    value: 'TIME_WINDOW',
    labelKey: 'share.availSpecificTimes',
    descriptionKey: 'share.availSpecificTimesDesc',
    icon: 'clock',
  },
  {
    value: 'NOT_AVAILABLE_TODAY',
    labelKey: 'share.availNotAvailable',
    descriptionKey: 'share.availNotAvailableDesc',
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

function formatTimeShort(date: Date) {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

function formatExpiryDate(expiresAt: string): string {
  const expiry = new Date(expiresAt);
  const now = new Date();
  const diffMs = expiry.getTime() - now.getTime();

  if (diffMs <= 0) return 'Expired';

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffHours < 1) return `in ${diffMins}m`;
  if (diffHours < 24) return `in ${diffHours}h`;

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (expiry.toDateString() === tomorrow.toDateString()) {
    return `tomorrow at ${formatTimeShort(expiry)}`;
  }

  return `${expiry.toLocaleDateString('en', { month: 'short', day: 'numeric' })} at ${formatTimeShort(expiry)}`;
}

export default function ShareScreen() {
  const { t } = useTranslation();
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
  const [courierAppUrl, setCourierAppUrl] = useState<string | null>(null);
  const [shareLinkId, setShareLinkId] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

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
  const [showValidityPicker, setShowValidityPicker] = useState(false);

  const [showWhatsAppNumberModal, setShowWhatsAppNumberModal] = useState(false);
  const [whatsAppNumber, setWhatsAppNumber] = useState('+966');

  const [showLinkSettingsMenu, setShowLinkSettingsMenu] = useState(false);
  const linkSettingsRef = useRef<View>(null);
  const [linkSettingsPosition, setLinkSettingsPosition] = useState({ top: 0, right: 0 });

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
            setCourierAppUrl(buildShareUrl(existingLink.id));
            setExpiresAt(existingLink.expiresAt);
          } else {
            setShowModal(true);
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

  const openAvailabilityModal = useCallback(() => {
    setSelectedAvailability(guidanceSet?.availabilityMode || 'ANYTIME_TODAY');
    setSelectedValidity(DEFAULT_VALIDITY_OPTION);
    setShowValidityPicker(false);
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

      setShareLinkId(result.shareLinkId);
      setCourierAppUrl(result.url);

      const expiry = new Date(Date.now() + selectedValidity.minutes * 60 * 1000);
      setExpiresAt(expiry.toISOString());

      setGuidanceSet((prev) =>
        prev ? { ...prev, availabilityMode: selectedAvailability } : prev,
      );
    } catch (err) {
      console.error('Failed to generate share link:', err);
      Alert.alert(t('common.error'), t('share.errorGenerate'));
    } finally {
      setGenerating(false);
    }
  }, [guidanceSetId, selectedAvailability, startTime, endTime, shareLinkId, selectedValidity, t]);

  const handleCopyLink = useCallback(async () => {
    if (!courierAppUrl) return;
    await Clipboard.setStringAsync(courierAppUrl);
    setCopied(true);
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopied(false), 2000);
  }, [courierAppUrl]);

  const handleWhatsAppShare = useCallback(async () => {
    if (!courierAppUrl) return;
    await openWhatsAppShare(t('share.shareMessage', { url: courierAppUrl }));
  }, [courierAppUrl, t]);

  const handleWhatsAppShareToNumber = useCallback(async () => {
    if (!courierAppUrl) return;
    const digits = whatsAppNumber.replace(/[^\d]/g, '');
    if (digits.length < 8) {
      Alert.alert(t('share.whatsAppInvalidNumber'), t('share.whatsAppInvalidMessage'));
      return;
    }
    await openWhatsAppShareToNumber(whatsAppNumber, t('share.shareMessage', { url: courierAppUrl }));
    setShowWhatsAppNumberModal(false);
  }, [courierAppUrl, whatsAppNumber, t]);

  const handleNativeShare = useCallback(async () => {
    if (!courierAppUrl) return;
    try {
      await Share.share({
        message: t('share.shareMessage', { url: courierAppUrl }),
        url: courierAppUrl,
      });
    } catch {
      // user cancelled
    }
  }, [courierAppUrl, t]);

  const handleRevoke = useCallback(async () => {
    if (!shareLinkId) return;
    Alert.alert(t('share.revokeTitle'), t('share.revokeMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('share.revokeConfirm'),
        style: 'destructive',
        onPress: async () => {
          setRevoking(true);
          try {
            await revokeShareLink(shareLinkId);
            setShareLinkId(null);
            setCourierAppUrl(null);
            setExpiresAt(null);
            setShowModal(true);
          } catch (err) {
            console.error('Failed to revoke share link:', err);
            Alert.alert(t('common.error'), t('share.errorRevoke'));
          } finally {
            setRevoking(false);
          }
        },
      },
    ]);
  }, [shareLinkId, t]);

  const openLinkSettingsMenu = () => {
    linkSettingsRef.current?.measureInWindow((x, y, width, height) => {
      setLinkSettingsPosition({ top: y + height + 4, right: Spacing.xl });
      setShowLinkSettingsMenu(true);
    });
  };

  const getAvailabilitySummary = (): string => {
    if (!guidanceSet) return '';
    const mode = guidanceSet.availabilityMode;
    if (mode === 'TIME_WINDOW') {
      const from = formatTimeShort(startTime);
      const to = formatTimeShort(endTime);
      return t('share.availabilityTimeSummary', { from, to });
    }
    if (mode === 'NOT_AVAILABLE_TODAY') return t('share.availabilityNotAvailable');
    return t('share.availabilitySummary');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.text} />
        </View>
      </SafeAreaView>
    );
  }

  if (generating || revoking) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.text} />
          <Text style={styles.preparingText}>
            {revoking ? t('share.revoking') : t('share.preparing')}
          </Text>
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
          <Text style={styles.pageTitle}>{t('share.title')}</Text>
          <Text style={styles.pageSubtitle}>{t('share.subtitle')}</Text>
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

        {courierAppUrl ? (
          /* ---- Active link: share-focused UI ---- */
          <View style={styles.card}>
            {/* Link ready indicator */}
            <View style={styles.linkReadyRow}>
              <View style={styles.linkReadyDot} />
              <Text style={styles.linkReadyText}>{t('share.linkReady')}</Text>
              <View style={styles.linkReadySpacer} />
              <View ref={linkSettingsRef} collapsable={false}>
                <Pressable
                  style={styles.linkSettingsBtn}
                  onPress={openLinkSettingsMenu}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.linkSettingsIcon}>⋮</Text>
                </Pressable>
              </View>
            </View>

            {/* Availability + expiry summary */}
            <View style={styles.summaryRow}>
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                <Circle cx={12} cy={12} r={10} stroke={Colors.textMuted} strokeWidth={2} />
                <Path d="M12 6v6l4 2" stroke={Colors.textMuted} strokeWidth={2} strokeLinecap="round" />
              </Svg>
              <Text style={styles.summaryText}>{getAvailabilitySummary()}</Text>
              {expiresAt && (
                <>
                  <Text style={styles.summaryDot}>·</Text>
                  <Text style={styles.summaryText}>
                    {t('share.expiresAt', { time: formatExpiryDate(expiresAt) })}
                  </Text>
                </>
              )}
            </View>

            <Text style={styles.linkHint}>{t('share.linkHint')}</Text>

            {/* Share actions */}
            <View style={styles.shareActions}>
              <Pressable style={styles.whatsappBtn} onPress={handleWhatsAppShare}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
                <View style={styles.whatsappBtnContent}>
                  <Text style={styles.whatsappBtnText}>{t('share.openWhatsApp')}</Text>
                  <Text style={styles.whatsappBtnSubtext}>{t('share.whatsappSubtitle')}</Text>
                </View>
              </Pressable>

              <Pressable
                style={styles.whatsappNumberBtn}
                onPress={() => setShowWhatsAppNumberModal(true)}
              >
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z" stroke="#25D366" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
                <View style={styles.whatsappBtnContent}>
                  <Text style={styles.whatsappNumberBtnText}>{t('share.enterCourierNumber')}</Text>
                  <Text style={styles.whatsappNumberSubtext}>{t('share.numberSubtitle')}</Text>
                </View>
              </Pressable>

              <Pressable style={styles.nativeShareBtn} onPress={handleNativeShare}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path d="M4 12V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V12" stroke={Colors.textSecondary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  <Path d="M16 6L12 2L8 6" stroke={Colors.textSecondary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  <Path d="M12 2V15" stroke={Colors.textSecondary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
                <Text style={styles.nativeShareBtnText}>{t('share.moreOptions')}</Text>
              </Pressable>
            </View>

            {/* Copy link (secondary) */}
            <Pressable style={styles.copyLinkBtn} onPress={handleCopyLink}>
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                <Path d="M20 9H11C9.89543 9 9 9.89543 9 11V20C9 21.1046 9.89543 22 11 22H20C21.1046 22 22 21.1046 22 20V11C22 9.89543 21.1046 9 20 9Z" stroke={Colors.textMuted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                <Path d="M5 15H4C3.46957 15 2.96086 14.7893 2.58579 14.4142C2.21071 14.0391 2 13.5304 2 13V4C2 3.46957 2.21071 2.96086 2.58579 2.58579C2.96086 2.21071 3.46957 2 4 2H13C13.5304 2 14.0391 2.21071 14.4142 2.58579C14.7893 2.96086 15 3.46957 15 4V5" stroke={Colors.textMuted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
              <Text style={styles.copyLinkText}>
                {copied ? t('share.copied') : t('share.copyLink')}
              </Text>
            </Pressable>
          </View>
        ) : null}
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
        onRequestClose={() => {
          setShowModal(false);
          if (!courierAppUrl) router.back();
        }}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalDismissArea}
            onPress={() => {
              setShowModal(false);
              if (!courierAppUrl) router.back();
            }}
          />
          <View style={[styles.modalContent, { paddingBottom: modalBottomPadding }]}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('share.setAvailability')}</Text>
              <Text style={styles.modalSubtitle}>{t('share.availabilitySubtitle')}</Text>
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
                        <Text style={styles.availabilityLabel}>{t(option.labelKey)}</Text>
                        <Text style={styles.availabilityDescription}>{t(option.descriptionKey)}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {/* Time window inputs */}
              {selectedAvailability === 'TIME_WINDOW' && (
                <View style={styles.timeWindow}>
                  <View style={styles.timeRow}>
                    <Text style={styles.timeLabel}>{t('share.from')}</Text>
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
                        <Text style={styles.timeButtonText}>{formatTimeShort(startTime)}</Text>
                      </Pressable>
                    )}
                  </View>
                  <View style={styles.timeRowDivider} />
                  <View style={styles.timeRow}>
                    <Text style={styles.timeLabel}>{t('share.to')}</Text>
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
                        <Text style={styles.timeButtonText}>{formatTimeShort(endTime)}</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              )}

              {/* Link expiry — collapsed by default */}
              <View style={styles.expirySection}>
                <View style={styles.expiryDefaultRow}>
                  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                    <Circle cx={12} cy={12} r={10} stroke={Colors.textMuted} strokeWidth={2} />
                    <Path d="M12 6v6l4 2" stroke={Colors.textMuted} strokeWidth={2} strokeLinecap="round" />
                  </Svg>
                  <Text style={styles.expiryDefaultText}>{t('share.linkExpiry')}</Text>
                  <Pressable onPress={() => setShowValidityPicker(!showValidityPicker)}>
                    <Text style={styles.expiryChangeLink}>{t('share.linkExpiryChange')}</Text>
                  </Pressable>
                </View>

                {showValidityPicker && (
                  <View style={styles.validityOptions}>
                    {LINK_VALIDITY_OPTIONS.map((option) => {
                      const isSelected = selectedValidity.minutes === option.minutes;
                      return (
                        <Pressable
                          key={option.minutes}
                          style={[
                            styles.validityOption,
                            isSelected && styles.validityOptionSelected,
                          ]}
                          onPress={() => setSelectedValidity(option)}
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
                            <Text style={styles.validityOptionLabel}>
                              {t(option.labelKey)}
                            </Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>
            </ScrollView>

            {/* Modal actions */}
            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => {
                  setShowModal(false);
                  if (!courierAppUrl) router.back();
                }}
              >
                <Text style={styles.modalCancelText}>
                  {courierAppUrl ? t('common.cancel') : t('common.back')}
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.modalConfirmBtn,
                  generating && styles.btnDisabled,
                ]}
                onPress={handleConfirmAndGenerate}
                disabled={generating}
              >
                {generating ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.modalConfirmText}>{t('share.continue')}</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* WhatsApp Number Modal */}
      <Modal
        visible={showWhatsAppNumberModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowWhatsAppNumberModal(false)}
      >
        <View style={styles.waNumModalOverlay}>
          <View style={styles.waNumModalContent}>
            <Text style={styles.waNumModalTitle}>{t('share.whatsAppModalTitle')}</Text>
            <Text style={styles.waNumModalSubtitle}>
              {t('share.whatsAppModalSubtitle')}
            </Text>
            <TextInput
              style={styles.waNumInput}
              value={whatsAppNumber}
              onChangeText={setWhatsAppNumber}
              placeholder="+966XXXXXXXXX"
              placeholderTextColor={Colors.textMuted}
              keyboardType="phone-pad"
              autoFocus
            />
            <View style={styles.waNumModalActions}>
              <Pressable
                style={styles.waNumCancelBtn}
                onPress={() => setShowWhatsAppNumberModal(false)}
              >
                <Text style={styles.waNumCancelText}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable
                style={styles.waNumSendBtn}
                onPress={handleWhatsAppShareToNumber}
              >
                <Text style={styles.waNumSendText}>{t('share.send')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Link settings dropdown menu */}
      <Modal
        visible={showLinkSettingsMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLinkSettingsMenu(false)}
      >
        <Pressable style={styles.menuOverlay} onPress={() => setShowLinkSettingsMenu(false)}>
          <View style={[styles.menuDropdown, { top: linkSettingsPosition.top, right: linkSettingsPosition.right }]}>
            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setShowLinkSettingsMenu(false);
                openAvailabilityModal();
              }}
            >
              <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
                <Path d="M17 1l4 4-4 4" stroke={Colors.textSecondary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                <Path d="M3 11V9a4 4 0 014-4h14" stroke={Colors.textSecondary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                <Path d="M7 23l-4-4 4-4" stroke={Colors.textSecondary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                <Path d="M21 13v2a4 4 0 01-4 4H3" stroke={Colors.textSecondary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
              <Text style={styles.menuItemText}>{t('share.regenerateLink')}</Text>
            </Pressable>
            <View style={styles.menuDivider} />
            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setShowLinkSettingsMenu(false);
                handleRevoke();
              }}
              disabled={revoking}
            >
              <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
                <Path d="M3 6H5H21" stroke={Colors.danger} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                <Path d="M8 6V4C8 3.47 8.21 2.96 8.59 2.59C8.96 2.21 9.47 2 10 2H14C14.53 2 15.04 2.21 15.41 2.59C15.79 2.96 16 3.47 16 4V6M19 6V20C19 20.53 18.79 21.04 18.41 21.41C18.04 21.79 17.53 22 17 22H7C6.47 22 5.96 21.79 5.59 21.41C5.21 21.04 5 20.53 5 20V6H19Z" stroke={Colors.danger} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
              <Text style={styles.menuItemTextDanger}>{t('share.revokeLink')}</Text>
            </Pressable>
          </View>
        </Pressable>
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
    gap: Spacing.md,
  },
  preparingText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
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
    gap: Spacing.lg,
  },

  linkReadyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  linkReadyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  linkReadyText: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.text,
  },
  linkReadySpacer: {
    flex: 1,
  },
  linkSettingsBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkSettingsIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textMuted,
    lineHeight: 22,
  },

  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  summaryText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  summaryDot: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },

  linkHint: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },

  shareActions: {
    gap: Spacing.sm,
  },
  whatsappBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    backgroundColor: '#25D366',
    borderRadius: BorderRadius.xl,
  },
  whatsappBtnContent: {
    flex: 1,
    gap: 1,
  },
  whatsappBtnText: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: '#ffffff',
  },
  whatsappBtnSubtext: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.8)',
  },
  whatsappNumberBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: '#25D366',
    borderRadius: BorderRadius.xl,
  },
  whatsappNumberBtnText: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: '#25D366',
  },
  whatsappNumberSubtext: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
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
    borderRadius: BorderRadius.xl,
  },
  nativeShareBtnText: {
    fontSize: FontSize.base,
    fontWeight: '500',
    color: Colors.textSecondary,
  },

  copyLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.sm,
  },
  copyLinkText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: '500',
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

  expirySection: {
    marginBottom: Spacing.xl,
  },
  expiryDefaultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
  },
  expiryDefaultText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  expiryChangeLink: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },

  validityOptions: {
    gap: Spacing.sm,
    marginTop: Spacing.md,
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

  waNumModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  waNumModalContent: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  waNumModalTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  waNumModalSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  waNumInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    fontSize: FontSize.lg,
    color: Colors.text,
  },
  waNumModalActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  waNumCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  waNumCancelText: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  waNumSendBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: BorderRadius.full,
    backgroundColor: '#25D366',
    alignItems: 'center',
  },
  waNumSendText: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: '#ffffff',
  },

  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  menuDropdown: {
    position: 'absolute',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 4,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  menuItemText: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.text,
  },
  menuItemTextDanger: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.danger,
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
  },
});
