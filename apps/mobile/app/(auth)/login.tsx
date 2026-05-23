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
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';
import { sendVerificationCode, confirmCode } from '@/services/auth';
import { useAuth } from '@/contexts/AuthContext';

const logoEng = require('@/assets/logo-eng.png');
const logoAr = require('@/assets/logo-ar.png');

type Step = 'phone' | 'code';

export default function LoginScreen() {
  const [step, setStep] = useState<Step>('phone');
  const [phoneNumber, setPhoneNumber] = useState('+966');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'ar'>('en');
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)/dashboard');
    }
  }, [isAuthenticated]);

  async function handleSendCode() {
    if (!phoneNumber.trim() || phoneNumber.length < 8) {
      setError('Please enter a valid phone number');
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
        setError('Invalid phone number. Use format: +966XXXXXXXXX');
      } else if (errCode === 'auth/too-many-requests') {
        setError('Too many attempts. Please try again later.');
      } else if (errCode === 'auth/quota-exceeded') {
        setError('SMS quota exceeded. Please try again later.');
      } else {
        setError(`[${errCode || 'unknown'}] ${e?.message || 'Failed to send verification code.'}`);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode() {
    if (code.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await confirmCode(code);
    } catch (e: any) {
      const errCode = e?.code;
      if (errCode === 'auth/invalid-verification-code') {
        setError('Invalid code. Please check and try again.');
      } else if (errCode === 'auth/session-expired') {
        setError('Code expired. Please request a new one.');
        setStep('phone');
        setCode('');
      } else {
        setError(e?.message || 'Verification failed.');
      }
    } finally {
      setLoading(false);
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
          source={currentLanguage === 'ar' ? logoAr : logoEng}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <View style={styles.headerSpacer} />
        <TouchableOpacity
          style={styles.langButton}
          onPress={() => setCurrentLanguage((l) => (l === 'en' ? 'ar' : 'en'))}
          activeOpacity={0.7}
        >
          <Text style={styles.langText}>
            {currentLanguage === 'en' ? 'عربي' : 'EN'}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <View style={styles.branding}>
            <Text style={styles.title}>Welcome</Text>
            <Text style={styles.subtitle}>
              {step === 'phone'
                ? 'Sign in with your phone number'
                : 'Enter verification code'}
            </Text>
          </View>

          {step === 'phone' ? (
            <View style={styles.form}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={phoneNumber}
                onChangeText={(text) => {
                  setPhoneNumber(text);
                  setError(null);
                }}
                placeholder="+966XXXXXXXXX"
                placeholderTextColor={Colors.textMuted}
                keyboardType="phone-pad"
                autoComplete="tel"
                textContentType="telephoneNumber"
                editable={!loading}
              />
              <Text style={styles.hint}>
                We'll send you a verification code via SMS
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
                  <Text style={styles.buttonText}>Send Code</Text>
                )}
              </Pressable>
            </View>
          ) : (
            <View style={styles.form}>
              <Pressable onPress={handleBack} style={styles.backLink}>
                <Text style={styles.backLinkText}>← Change phone number</Text>
              </Pressable>

              <Text style={styles.label}>Verification Code</Text>
              <Text style={styles.phoneSent}>Sent to {phoneNumber}</Text>
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
                  <Text style={styles.buttonText}>Verify</Text>
                )}
              </Pressable>

              <Pressable
                onPress={handleSendCode}
                disabled={loading}
                style={styles.resendLink}
              >
                <Text style={styles.resendText}>Resend code</Text>
              </Pressable>
            </View>
          )}
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
});
