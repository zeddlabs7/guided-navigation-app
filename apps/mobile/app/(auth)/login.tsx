import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';
import { sendVerificationCode, confirmCode, devSignIn } from '@/services/auth';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

const logoEng = require('@/assets/logo-eng.png');
const logoAr = require('@/assets/logo-ar.png');

type Step = 'phone' | 'code';

export default function LoginScreen() {
  const [step, setStep] = useState<Step>('phone');
  const [phoneNumber, setPhoneNumber] = useState('+966');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();
  const { language, toggleLanguage } = useLanguage();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)/dashboard');
    }
  }, [isAuthenticated]);

  async function handleSendCode() {
    if (!phoneNumber.trim() || phoneNumber.length < 8) {
      setError(t('auth.errorInvalidPhone'));
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await sendVerificationCode(phoneNumber);
      setStep('code');
    } catch (e: any) {
      console.error('Phone auth error:', JSON.stringify(e, null, 2));
      console.error('Error code:', e?.code, 'Message:', e?.message, 'nativeErrorMessage:', e?.nativeErrorMessage);
      const errCode = e?.code;
      if (errCode === 'auth/invalid-phone-number') {
        setError(t('auth.errorInvalidPhoneFormat'));
      } else if (errCode === 'auth/too-many-requests') {
        setError(t('auth.errorTooManyRequests'));
      } else if (errCode === 'auth/quota-exceeded') {
        setError(t('auth.errorQuotaExceeded'));
      } else {
        setError(`[${errCode || 'unknown'}] ${e?.message || 'Failed to send verification code.'}`);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode() {
    if (code.length !== 6) {
      setError(t('auth.errorInvalidCode'));
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await confirmCode(code);
    } catch (e: any) {
      setLoading(false);
      const errCode = e?.code;
      if (errCode === 'auth/invalid-verification-code') {
        setError(t('auth.errorInvalidVerification'));
      } else if (errCode === 'auth/session-expired') {
        setError(t('auth.errorSessionExpired'));
        setStep('phone');
        setCode('');
      } else {
        setError(e?.message || t('auth.errorVerificationFailed'));
      }
    }
  }

  async function handleDevSignIn() {
    setError(null);
    setLoading(true);
    try {
      await devSignIn();
    } catch (e: any) {
      setLoading(false);
      setError(e?.message || t('auth.errorDevSignIn'));
    }
  }

  function handleBack() {
    setStep('phone');
    setCode('');
    setError(null);
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with logo and language toggle */}
      <View style={styles.header}>
        <Image
          source={language === 'ar' ? logoAr : logoEng}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <View style={styles.headerSpacer} />
        <TouchableOpacity
          style={styles.langButton}
          onPress={toggleLanguage}
          activeOpacity={0.7}
        >
          <Text style={styles.langText}>
            {language === 'en' ? 'عربي' : 'EN'}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <View style={styles.branding}>
            <Text style={styles.title}>{t('auth.welcome')}</Text>
            <Text style={styles.subtitle}>
              {step === 'phone'
                ? t('auth.signInSubtitle')
                : t('auth.enterCode')}
            </Text>
          </View>

          {step === 'phone' ? (
            <View style={styles.form}>
              <Text style={styles.label}>{t('auth.phoneNumber')}</Text>
              <TextInput
                style={styles.input}
                value={phoneNumber}
                onChangeText={(text) => {
                  setPhoneNumber(text);
                  setError(null);
                }}
                placeholder={t('auth.phonePlaceholder')}
                placeholderTextColor={Colors.textMuted}
                keyboardType="phone-pad"
                autoComplete="tel"
                textContentType="telephoneNumber"
                editable={!loading}
              />
              <Text style={styles.hint}>
                {t('auth.smsHint')}
              </Text>

              {error && <Text style={styles.error}>{error}</Text>}

              <Pressable
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSendCode}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.buttonText}>{t('auth.sendCode')}</Text>
                )}
              </Pressable>
            </View>
          ) : (
            <View style={styles.form}>
              <Pressable onPress={handleBack} style={styles.backLink}>
                <Text style={styles.backLinkText}>{t('auth.changePhone')}</Text>
              </Pressable>

              <Text style={styles.label}>{t('auth.verificationCode')}</Text>
              <Text style={styles.phoneSent}>{t('auth.sentTo', { phone: phoneNumber })}</Text>
              <TextInput
                style={[styles.input, styles.codeInput]}
                value={code}
                onChangeText={(text) => {
                  setCode(text.replace(/[^0-9]/g, '').slice(0, 6));
                  setError(null);
                }}
                placeholder="000000"
                placeholderTextColor={Colors.textMuted}
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                autoComplete="sms-otp"
                maxLength={6}
                editable={!loading}
                autoFocus
              />

              {error && <Text style={styles.error}>{error}</Text>}

              <Pressable
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleVerifyCode}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.buttonText}>{t('auth.verify')}</Text>
                )}
              </Pressable>

              <Pressable
                onPress={handleSendCode}
                disabled={loading}
                style={styles.resendLink}
              >
                <Text style={styles.resendText}>{t('auth.resendCode')}</Text>
              </Pressable>
            </View>
          )}
          <View style={styles.devSection}>
              <View style={styles.devDivider}>
                <View style={styles.devDividerLine} />
                <Text style={styles.devDividerText}>{t('auth.devOnly')}</Text>
                <View style={styles.devDividerLine} />
              </View>
              <Pressable
                style={[styles.devButton, loading && styles.buttonDisabled]}
                onPress={handleDevSignIn}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.text} />
                ) : (
                  <Text style={styles.devButtonText}>{t('auth.devSignIn')}</Text>
                )}
              </Pressable>
            </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
  },
  logoImage: {
    height: 26,
    width: 96,
  },
  headerSpacer: {
    flex: 1,
  },
  langButton: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  langText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  keyboardView: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  branding: {
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
  },
  title: {
    fontSize: FontSize.xxxl,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.5,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSize.base,
    color: Colors.textMuted,
  },
  form: {
    gap: Spacing.md,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    fontSize: FontSize.lg,
    color: Colors.text,
  },
  codeInput: {
    textAlign: 'center',
    letterSpacing: 8,
    fontSize: FontSize.xxl,
  },
  hint: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  phoneSent: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: -Spacing.sm,
  },
  error: {
    fontSize: FontSize.sm,
    color: Colors.danger,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  button: {
    backgroundColor: Colors.text,
    paddingVertical: 14,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: FontSize.base,
    fontWeight: '600',
  },
  backLink: {
    marginBottom: Spacing.sm,
  },
  backLinkText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  resendLink: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  resendText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  devSection: {
    marginTop: Spacing.xxl,
    gap: Spacing.md,
  },
  devDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  devDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  devDividerText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: '600',
    letterSpacing: 1,
  },
  devButton: {
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
    paddingVertical: 14,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  devButtonText: {
    color: '#B45309',
    fontSize: FontSize.base,
    fontWeight: '600',
  },
});
