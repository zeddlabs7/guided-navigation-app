import { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Alert,
  Platform,
  ActivityIndicator,
  ActionSheetIOS,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Image } from 'expo-image';
import * as ExpoImagePicker from 'expo-image-picker';
import Svg, { Path, Circle as SvgCircle } from 'react-native-svg';
import { useRouter, Redirect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import {
  generateRequestId,
  uploadSupportAttachment,
  submitSupportRequest,
} from '@/services/support';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';
import { HomeButton } from '@/components/ui/HomeButton';

const MAX_IMAGES = 5;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ImageUploadStatus = 'uploading' | 'done' | 'failed';

interface ImageEntry {
  id: string;
  localUri: string;
  status: ImageUploadStatus;
  publicUrl?: string;
  uploadIndex: number;
}

const AnimatedSvgCircle = Animated.createAnimatedComponent(SvgCircle);

function SpinningLoader({ size }: { size: number }) {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    anim.start();
    return () => anim.stop();
  }, [rotation]);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const r = (size - 3) / 2;
  const circumference = 2 * Math.PI * r;

  return (
    <Animated.View style={{ transform: [{ rotate: spin }] }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <AnimatedSvgCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#ffffff"
          strokeWidth={2.5}
          fill="none"
          strokeDasharray={`${circumference * 0.7} ${circumference * 0.3}`}
          strokeLinecap="round"
        />
      </Svg>
    </Animated.View>
  );
}

export default function SupportScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { firebaseUser, isAuthenticated, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<ImageEntry[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [emailTouched, setEmailTouched] = useState(false);
  const [descriptionTouched, setDescriptionTouched] = useState(false);

  const descriptionRef = useRef<TextInput>(null);
  const requestIdRef = useRef<string>(generateRequestId());
  const uploadCounterRef = useRef(0);

  if (!isLoading && !isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  const emailError = emailTouched
    ? !email.trim()
      ? t('support.emailRequired')
      : !EMAIL_REGEX.test(email.trim())
        ? t('support.emailInvalid')
        : null
    : null;

  const descriptionError = descriptionTouched && !description.trim()
    ? t('support.descriptionRequired')
    : null;

  const anyUploading = images.some((img) => img.status === 'uploading');
  const canSubmit = EMAIL_REGEX.test(email.trim()) && description.trim().length > 0 && !submitting && !anyUploading;

  function handleBack() {
    router.back();
  }

  function handleGoToDashboard() {
    router.replace('/(tabs)/dashboard' as any);
  }

  function startUpload(localUri: string) {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const uploadIndex = uploadCounterRef.current++;

    const entry: ImageEntry = { id, localUri, status: 'uploading', uploadIndex };
    setImages((prev) => [...prev, entry]);

    uploadSupportAttachment(requestIdRef.current, uploadIndex, localUri)
      .then((publicUrl) => {
        setImages((prev) =>
          prev.map((img) => img.id === id ? { ...img, status: 'done' as const, publicUrl } : img),
        );
      })
      .catch((err) => {
        console.error('Image upload failed:', err);
        setImages((prev) =>
          prev.map((img) => img.id === id ? { ...img, status: 'failed' as const } : img),
        );
      });
  }

  function addImages(uris: string[]) {
    const slotsLeft = MAX_IMAGES - images.length;
    const toAdd = uris.slice(0, slotsLeft);
    for (const uri of toAdd) {
      startUpload(uri);
    }
  }

  const pickImages = useCallback(async () => {
    if (images.length >= MAX_IMAGES) return;

    const remaining = MAX_IMAGES - images.length;

    if (Platform.OS === 'ios') {
      const options = [t('steps.camera'), t('steps.chooseGallery'), t('common.cancel')];
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: 2 },
        async (buttonIndex) => {
          if (buttonIndex === 0) {
            await launchCamera();
          } else if (buttonIndex === 1) {
            await launchGallery(remaining);
          }
        },
      );
    } else {
      Alert.alert(t('support.attachImages'), '', [
        { text: t('steps.camera'), onPress: () => launchCamera() },
        { text: t('steps.chooseGallery'), onPress: () => launchGallery(remaining) },
        { text: t('common.cancel'), style: 'cancel' },
      ]);
    }
  }, [images.length, t]);

  async function launchCamera() {
    try {
      const result = await ExpoImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });
      if (result.canceled || !result.assets?.[0]?.uri) return;
      addImages([result.assets[0].uri]);
    } catch {
      Alert.alert(t('common.error'), t('steps.failedToPick'));
    }
  }

  async function launchGallery(remaining: number) {
    try {
      const result = await ExpoImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: remaining,
      });
      if (result.canceled || !result.assets?.length) return;
      addImages(result.assets.map((a) => a.uri));
    } catch {
      Alert.alert(t('common.error'), t('steps.failedToPick'));
    }
  }

  function removeImage(id: string) {
    setImages((prev) => prev.filter((img) => img.id !== id));
  }

  async function handleSubmit() {
    setEmailTouched(true);
    setDescriptionTouched(true);

    if (!canSubmit || !firebaseUser) return;

    setSubmitting(true);
    try {
      const successfulUrls = images
        .filter((img) => img.status === 'done' && img.publicUrl)
        .map((img) => img.publicUrl!);

      await submitSupportRequest(requestIdRef.current, {
        userId: firebaseUser.uid,
        phoneNumber: firebaseUser.phoneNumber ?? null,
        email: email.trim(),
        description: description.trim(),
        imageUrls: successfulUrls,
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Support request failed:', err);
      Alert.alert(t('common.error'), t('common.retry'));
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
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
        <View style={styles.successContainer}>
          <View style={styles.successIconCircle}>
            <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
              <Path d="M20 6L9 17l-5-5" stroke={Colors.success} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </View>
          <Text style={styles.successTitle}>{t('support.successTitle')}</Text>
          <Text style={styles.successMessage}>{t('support.successMessage')}</Text>
          <Pressable style={styles.doneButton} onPress={handleBack}>
            <Text style={styles.doneButtonText}>{t('common.done')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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

      <KeyboardAwareScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        bottomOffset={62}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>{t('support.title')}</Text>

        {/* Phone Number (read-only) */}
        <View style={styles.fieldWrapper}>
          <Text style={styles.fieldLabel}>{t('support.phone')}</Text>
          <View style={styles.readOnlyField}>
            <Text style={styles.readOnlyText}>
              {firebaseUser?.phoneNumber ?? '—'}
            </Text>
          </View>
        </View>

        {/* Email */}
        <View style={styles.fieldWrapper}>
          <Text style={styles.fieldLabel}>
            {t('support.email')}
            <Text style={styles.required}> *</Text>
          </Text>
          <TextInput
            style={[styles.input, emailError && styles.inputError]}
            value={email}
            onChangeText={setEmail}
            onBlur={() => setEmailTouched(true)}
            onSubmitEditing={() => descriptionRef.current?.focus()}
            placeholder={t('support.emailPlaceholder')}
            placeholderTextColor={Colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />
          {emailError && <Text style={styles.errorText}>{emailError}</Text>}
        </View>

        {/* Description */}
        <View style={styles.fieldWrapper}>
          <Text style={styles.fieldLabel}>
            {t('support.description')}
            <Text style={styles.required}> *</Text>
          </Text>
          <TextInput
            ref={descriptionRef}
            style={[styles.input, styles.textarea, descriptionError && styles.inputError]}
            value={description}
            onChangeText={setDescription}
            onBlur={() => setDescriptionTouched(true)}
            placeholder={t('support.descriptionPlaceholder')}
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
          {descriptionError && <Text style={styles.errorText}>{descriptionError}</Text>}
        </View>

        {/* Image Attachments */}
        <View style={styles.fieldWrapper}>
          <Text style={styles.fieldLabel}>{t('support.attachImages')}</Text>
          <Text style={styles.helperText}>
            {t('support.maxImages')} ({images.length}/{MAX_IMAGES})
          </Text>

          <View style={styles.imageGrid}>
            {images.map((entry) => (
              <View key={entry.id} style={styles.imageThumbnailContainer}>
                <Image
                  source={{ uri: entry.localUri }}
                  style={styles.imageThumbnail}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
                {entry.status === 'failed' && (
                  <View style={styles.failedOverlay}>
                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                      <Path d="M12 9v4M12 17h.01" stroke="#ffffff" strokeWidth={2.5} strokeLinecap="round" />
                    </Svg>
                  </View>
                )}
                <Pressable
                  style={styles.removeImageButton}
                  onPress={() => removeImage(entry.id)}
                >
                  {entry.status === 'uploading' ? (
                    <SpinningLoader size={22} />
                  ) : (
                    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                      <Path d="M18 6L6 18M6 6l12 12" stroke="#ffffff" strokeWidth={2.5} strokeLinecap="round" />
                    </Svg>
                  )}
                </Pressable>
              </View>
            ))}

            {images.length < MAX_IMAGES && (
              <Pressable style={styles.addImageButton} onPress={pickImages}>
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                  <Path d="M12 5v14M5 12h14" stroke={Colors.textMuted} strokeWidth={2} strokeLinecap="round" />
                </Svg>
                <Text style={styles.addImageText}>📷</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Submit */}
        <Pressable
          style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.submitButtonText}>{t('support.submit')}</Text>
          )}
        </Pressable>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
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
  content: {
    padding: Spacing.lg,
    gap: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  pageTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.5,
    marginBottom: Spacing.sm,
  },
  fieldWrapper: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  required: {
    color: Colors.danger,
  },
  readOnlyField: {
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.borderLight,
  },
  readOnlyText: {
    fontSize: FontSize.base,
    color: Colors.textMuted,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: FontSize.base,
    color: Colors.text,
    backgroundColor: Colors.surface,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  textarea: {
    minHeight: 120,
  },
  errorText: {
    fontSize: FontSize.xs,
    color: Colors.danger,
  },
  helperText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  imageThumbnailContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  imageThumbnail: {
    width: '100%',
    height: '100%',
  },
  failedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(239,68,68,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImageButton: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    gap: 2,
  },
  addImageText: {
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: Colors.text,
    borderRadius: BorderRadius.full,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    marginTop: Spacing.md,
  },
  submitButtonDisabled: {
    opacity: 0.4,
  },
  submitButtonText: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: '#ffffff',
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  successTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: FontSize.base,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  doneButton: {
    backgroundColor: Colors.text,
    borderRadius: BorderRadius.full,
    paddingVertical: 12,
    paddingHorizontal: Spacing.xxl,
    marginTop: Spacing.md,
  },
  doneButtonText: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: '#ffffff',
  },
});
