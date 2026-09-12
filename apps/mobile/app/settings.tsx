import { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Redirect } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getUser, updateUser } from '@/services/users';
import type { AvailabilityMode, CourierContactPreference } from '@guidenav/types';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';
import { HomeButton } from '@/components/ui/HomeButton';

const LANGUAGE_OPTIONS: { value: 'en' | 'ar'; labelKey: string }[] = [
  { value: 'en', labelKey: 'settings.english' },
  { value: 'ar', labelKey: 'settings.arabic' },
];

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

const CONTACT_PREFERENCE_OPTIONS: {
  value: CourierContactPreference;
  labelKey: string;
  descriptionKey: string;
  icon: 'phone' | 'no-bell';
}[] = [
  {
    value: 'CALL_ON_ARRIVAL',
    labelKey: 'settings.callOnArrival',
    descriptionKey: 'settings.callOnArrivalDesc',
    icon: 'phone',
  },
  {
    value: 'NO_CALL_LEAVE_PHOTO',
    labelKey: 'settings.noCallLeavePhoto',
    descriptionKey: 'settings.noCallLeavePhotoDesc',
    icon: 'no-bell',
  },
];

function ContactIcon({ icon, selected }: { icon: 'phone' | 'no-bell'; selected: boolean }) {
  const color = selected ? '#ffffff' : '#99a1af';
  if (icon === 'phone') {
    return (
      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Path
          d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"
          stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
        />
      </Svg>
    );
  }
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M13.73 21a2 2 0 01-3.46 0M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 3l18 18" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

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

function SkeletonBlock({ width, height }: { width: number | string; height: number }) {
  return <View style={[styles.skeleton, { width: width as any, height }]} />;
}

function parseHHmm(hhmm: string | null | undefined): Date {
  const d = new Date();
  if (hhmm && /^\d{2}:\d{2}$/.test(hhmm)) {
    const [h, m] = hhmm.split(':').map(Number);
    d.setHours(h, m, 0, 0);
  } else {
    d.setHours(9, 0, 0, 0);
  }
  return d;
}

function formatTimeShort(date: Date) {
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

export default function SettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const { firebaseUser, signOut, isAuthenticated, isLoading } = useAuth();
  const isIOS = Platform.OS === 'ios';

  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  const [loadingAvailability, setLoadingAvailability] = useState(true);
  const [selectedAvailability, setSelectedAvailability] = useState<AvailabilityMode>('ANYTIME_TODAY');
  const [startTime, setStartTime] = useState<Date>(() => { const d = new Date(); d.setHours(9, 0, 0, 0); return d; });
  const [endTime, setEndTime] = useState<Date>(() => { const d = new Date(); d.setHours(17, 0, 0, 0); return d; });
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const savedMode = useRef<AvailabilityMode>('ANYTIME_TODAY');
  const savedStart = useRef<Date>(new Date());
  const savedEnd = useRef<Date>(new Date());

  // Contact preference state (Edit/Save flow)
  const [selectedContact, setSelectedContact] = useState<CourierContactPreference>('CALL_ON_ARRIVAL');
  const [editingContact, setEditingContact] = useState(false);
  const [savingContact, setSavingContact] = useState(false);
  const savedContact = useRef<CourierContactPreference>('CALL_ON_ARRIVAL');

  const scrollViewRef = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      if (!firebaseUser) return;
      setLoadingAvailability(true);
      getUser(firebaseUser.uid).then((user) => {
        if (!user) {
          setLoadingAvailability(false);
          return;
        }
        const mode = user.defaultAvailabilityMode || 'ANYTIME_TODAY';
        const start = parseHHmm(user.defaultAvailabilityStartTime);
        const end = parseHHmm(user.defaultAvailabilityEndTime);
        setSelectedAvailability(mode);
        setStartTime(start);
        setEndTime(end);
        savedMode.current = mode;
        savedStart.current = start;
        savedEnd.current = end;
        setEditing(false);

        const contact = user.courierContactPreference || 'CALL_ON_ARRIVAL';
        setSelectedContact(contact);
        savedContact.current = contact;
        setEditingContact(false);

        setLoadingAvailability(false);
      }).catch(() => {
        setLoadingAvailability(false);
      });
    }, [firebaseUser]),
  );

  if (!isLoading && !isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  function handleBack() {
    router.back();
  }

  function handleGoToDashboard() {
    router.replace('/(tabs)/dashboard' as any);
  }

  function handleEdit() {
    setEditing(true);
  }

  function handleCancelEdit() {
    setSelectedAvailability(savedMode.current);
    setStartTime(savedStart.current);
    setEndTime(savedEnd.current);
    setEditing(false);
  }

  async function handleSave() {
    if (!firebaseUser) return;
    setSaving(true);
    try {
      await updateUser(firebaseUser.uid, {
        defaultAvailabilityMode: selectedAvailability,
        defaultAvailabilityStartTime: selectedAvailability === 'TIME_WINDOW' ? formatTimeShort(startTime) : null,
        defaultAvailabilityEndTime: selectedAvailability === 'TIME_WINDOW' ? formatTimeShort(endTime) : null,
      });
      savedMode.current = selectedAvailability;
      savedStart.current = startTime;
      savedEnd.current = endTime;
      setEditing(false);
    } catch (err) {
      console.error('Failed to save availability:', err);
    } finally {
      setSaving(false);
    }
  }

  const hasChanges =
    selectedAvailability !== savedMode.current ||
    (selectedAvailability === 'TIME_WINDOW' &&
      (formatTimeShort(startTime) !== formatTimeShort(savedStart.current) ||
        formatTimeShort(endTime) !== formatTimeShort(savedEnd.current)));

  function handleEditContact() {
    setEditingContact(true);
  }

  function handleCancelEditContact() {
    setSelectedContact(savedContact.current);
    setEditingContact(false);
  }

  async function handleSaveContact() {
    if (!firebaseUser) return;
    setSavingContact(true);
    try {
      await updateUser(firebaseUser.uid, { courierContactPreference: selectedContact });
      savedContact.current = selectedContact;
      setEditingContact(false);
    } catch (err) {
      console.error('Failed to save contact preference:', err);
    } finally {
      setSavingContact(false);
    }
  }

  const hasContactChanges = selectedContact !== savedContact.current;

  function getContactSummary(): string {
    if (savedContact.current === 'NO_CALL_LEAVE_PHOTO') return t('settings.contactNoCallSummary');
    return t('settings.contactCallSummary');
  }

  function handleSignOut() {
    Alert.alert(t('settings.signOut'), t('settings.signOutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.signOut'),
        style: 'destructive',
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  }

  function getAvailabilitySummary(): string {
    if (savedMode.current === 'TIME_WINDOW') {
      return t('settings.availabilityTimeWindow', {
        from: formatTimeShort(savedStart.current),
        to: formatTimeShort(savedEnd.current),
      });
    }
    if (savedMode.current === 'NOT_AVAILABLE_TODAY') return t('settings.availabilityNotAvailable');
    return t('settings.availabilityAnytime');
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerNav}>
          <Pressable style={styles.headerBtn} onPress={handleBack}>
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path d="M15 18L9 12L15 6" stroke={Colors.text} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </Pressable>
          <HomeButton onPress={handleGoToDashboard} />
        </View>
      </View>

      <ScrollView ref={scrollViewRef} style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>{t('settings.title')}</Text>
        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.account')}</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t('settings.phone')}</Text>
            <Text style={styles.rowValue}>
              {firebaseUser?.phoneNumber ?? t('settings.notSignedIn')}
            </Text>
          </View>
        </View>

        {/* Language dropdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
          <Pressable
            style={styles.row}
            onPress={() => setShowLanguageDropdown((v) => !v)}
          >
            <Text style={styles.rowLabel}>{t('settings.appLanguage')}</Text>
            <View style={styles.dropdownTrigger}>
              <Text style={styles.rowValue}>
                {language === 'en' ? t('settings.english') : t('settings.arabic')}
              </Text>
              <Text style={styles.chevron}>{showLanguageDropdown ? '▲' : '▼'}</Text>
            </View>
          </Pressable>
          {showLanguageDropdown && (
            <View style={styles.languageDropdown}>
              {LANGUAGE_OPTIONS.map((option) => {
                const isSelected = language === option.value;
                return (
                  <Pressable
                    key={option.value}
                    style={[
                      styles.languageOption,
                      isSelected && styles.languageOptionSelected,
                    ]}
                    onPress={() => {
                      setLanguage(option.value);
                      setShowLanguageDropdown(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.languageOptionText,
                        isSelected && styles.languageOptionTextSelected,
                      ]}
                    >
                      {t(option.labelKey)}
                    </Text>
                    {isSelected && (
                      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                        <Path
                          d="M20 6L9 17l-5-5"
                          stroke={Colors.primary}
                          strokeWidth={2.5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Svg>
                    )}
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* Delivery Availability */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionTitle}>{t('settings.availability')}</Text>
              <Text style={styles.sectionDescription}>{t('settings.availabilityDescription')}</Text>
            </View>
            {!editing && (
              <Pressable
                style={[styles.editButton, loadingAvailability && styles.editButtonDisabled]}
                onPress={handleEdit}
                disabled={loadingAvailability}
              >
                <Text style={[styles.editButtonText, loadingAvailability && styles.editButtonTextDisabled]}>
                  {t('common.edit')}
                </Text>
              </Pressable>
            )}
          </View>

          {loadingAvailability ? (
            <View style={styles.skeletonContainer}>
              <View style={styles.skeletonRow}>
                <SkeletonBlock width={18} height={18} />
                <SkeletonBlock width={160} height={16} />
              </View>
            </View>
          ) : editing ? (
            <>
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
                        <Text style={styles.availabilityDesc}>{t(option.descriptionKey)}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

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

              <View style={styles.editActions}>
                <Pressable style={styles.cancelButton} onPress={handleCancelEdit} disabled={saving}>
                  <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                </Pressable>
                <Pressable
                  style={[styles.saveButton, (!hasChanges || saving) && styles.saveButtonDisabled]}
                  onPress={handleSave}
                  disabled={!hasChanges || saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.saveButtonText}>{t('common.save')}</Text>
                  )}
                </Pressable>
              </View>
            </>
          ) : (
            <View style={styles.availabilitySummaryRow}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Circle cx={12} cy={12} r={10} stroke={Colors.textMuted} strokeWidth={2} />
                <Path d="M12 6v6l4 2" stroke={Colors.textMuted} strokeWidth={2} strokeLinecap="round" />
              </Svg>
              <Text style={styles.availabilitySummaryText}>{getAvailabilitySummary()}</Text>
            </View>
          )}
        </View>

        {/* Courier Contact Preference */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionTitle}>{t('settings.courierContact')}</Text>
              <Text style={styles.sectionDescription}>{t('settings.courierContactDescription')}</Text>
            </View>
            {!editingContact && (
              <Pressable
                style={[styles.editButton, loadingAvailability && styles.editButtonDisabled]}
                onPress={handleEditContact}
                disabled={loadingAvailability}
              >
                <Text style={[styles.editButtonText, loadingAvailability && styles.editButtonTextDisabled]}>
                  {t('common.edit')}
                </Text>
              </Pressable>
            )}
          </View>

          {loadingAvailability ? (
            <View style={styles.skeletonContainer}>
              <View style={styles.skeletonRow}>
                <SkeletonBlock width={18} height={18} />
                <SkeletonBlock width={160} height={16} />
              </View>
            </View>
          ) : editingContact ? (
            <>
              <View style={styles.availabilityOptions}>
                {CONTACT_PREFERENCE_OPTIONS.map((option) => {
                  const isSelected = selectedContact === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      style={[
                        styles.availabilityOption,
                        isSelected && styles.availabilityOptionSelected,
                      ]}
                      onPress={() => setSelectedContact(option.value)}
                    >
                      <View
                        style={[
                          styles.availabilityIconCircle,
                          isSelected && styles.availabilityIconCircleSelected,
                        ]}
                      >
                        <ContactIcon icon={option.icon} selected={isSelected} />
                      </View>
                      <View style={styles.availabilityText}>
                        <Text style={styles.availabilityLabel}>{t(option.labelKey)}</Text>
                        <Text style={styles.availabilityDesc}>{t(option.descriptionKey)}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.editActions}>
                <Pressable style={styles.cancelButton} onPress={handleCancelEditContact} disabled={savingContact}>
                  <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                </Pressable>
                <Pressable
                  style={[styles.saveButton, (!hasContactChanges || savingContact) && styles.saveButtonDisabled]}
                  onPress={handleSaveContact}
                  disabled={!hasContactChanges || savingContact}
                >
                  {savingContact ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.saveButtonText}>{t('common.save')}</Text>
                  )}
                </Pressable>
              </View>
            </>
          ) : (
            <View style={styles.availabilitySummaryRow}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                {savedContact.current === 'CALL_ON_ARRIVAL' ? (
                  <Path
                    d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"
                    stroke={Colors.textMuted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                  />
                ) : (
                  <>
                    <Path d="M13.73 21a2 2 0 01-3.46 0M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9z" stroke={Colors.textMuted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    <Path d="M3 3l18 18" stroke={Colors.textMuted} strokeWidth={2} strokeLinecap="round" />
                  </>
                )}
              </Svg>
              <Text style={styles.availabilitySummaryText}>{getContactSummary()}</Text>
            </View>
          )}
        </View>

        {/* Customer Support */}
        <Pressable style={styles.supportButton} onPress={() => router.push('/support' as any)}>
          <View style={styles.supportButtonInner}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke={Colors.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
            <Text style={styles.supportButtonText}>{t('support.contactSupport')}</Text>
          </View>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path d="M9 18l6-6-6-6" stroke={Colors.textMuted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </Pressable>

        {/* Sign out */}
        <Pressable style={styles.logoutButton} onPress={handleSignOut}>
          <Text style={styles.logoutText}>{t('settings.signOut')}</Text>
        </Pressable>
      </ScrollView>

      {/* Android time pickers */}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
  pageTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.5,
    marginBottom: Spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  sectionHeaderText: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  sectionDescription: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  rowLabel: {
    fontSize: FontSize.base,
    color: Colors.text,
  },
  rowValue: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },

  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chevron: {
    fontSize: 8,
    color: Colors.textMuted,
  },
  languageDropdown: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderLight,
  },
  languageOptionSelected: {
    backgroundColor: Colors.primaryBg,
  },
  languageOptionText: {
    fontSize: FontSize.base,
    color: Colors.text,
  },
  languageOptionTextSelected: {
    fontWeight: '600',
    color: Colors.primary,
  },

  editButton: {
    marginTop: Spacing.lg,
    marginRight: Spacing.lg,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  editButtonDisabled: {
    opacity: 0.4,
  },
  editButtonText: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  editButtonTextDisabled: {
    color: Colors.textMuted,
  },

  skeletonContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  skeleton: {
    backgroundColor: Colors.borderLight,
    borderRadius: BorderRadius.sm,
  },

  availabilitySummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  availabilitySummaryText: {
    fontSize: FontSize.base,
    color: Colors.text,
    flex: 1,
  },

  availabilityOptions: {
    gap: Spacing.md,
    padding: Spacing.lg,
    paddingTop: Spacing.sm,
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
  availabilityDesc: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },

  timeWindow: {
    paddingVertical: 4,
    paddingHorizontal: Spacing.lg,
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
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

  editActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: FontSize.base,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  saveButton: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  saveButtonDisabled: {
    opacity: 0.4,
  },
  saveButtonText: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: '#ffffff',
  },

  logoutButton: {
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.danger,
  },
  supportButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: 12,
  },
  supportButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  supportButtonText: {
    fontSize: FontSize.base,
    fontWeight: '500',
    color: Colors.text,
  },
});
