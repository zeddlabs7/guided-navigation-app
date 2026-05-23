import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';

const logoEng = require('@/assets/logo-eng.png');
const logoAr = require('@/assets/logo-ar.png');

interface AppHeaderProps {
  currentLanguage?: 'en' | 'ar';
  onLanguageToggle?: () => void;
}

export function AppHeader({ currentLanguage = 'en', onLanguageToggle }: AppHeaderProps) {
  const router = useRouter();
  const { signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleNew() {
    router.push('/guidance/create');
  }

  function handleLogoPress() {
    // Already on dashboard — no-op or scroll to top
  }

  function handleUserPress() {
    setMenuOpen((prev) => !prev);
  }

  function handleLogout() {
    setMenuOpen(false);
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {/* Logo */}
        <TouchableOpacity onPress={handleLogoPress} style={styles.logoButton}>
          <Image
            source={currentLanguage === 'ar' ? logoAr : logoEng}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <View style={styles.spacer} />

        {onLanguageToggle && (
          <TouchableOpacity style={styles.langButton} onPress={onLanguageToggle} activeOpacity={0.7}>
            <Text style={styles.langText}>
              {currentLanguage === 'en' ? 'عربي' : 'EN'}
            </Text>
          </TouchableOpacity>
        )}

        {/* + New button */}
        <TouchableOpacity style={styles.newButton} onPress={handleNew} activeOpacity={0.8}>
          <Text style={styles.newButtonPlus}>+</Text>
          <Text style={styles.newButtonLabel}>New</Text>
        </TouchableOpacity>

        {/* User menu icon */}
        <TouchableOpacity
          style={[styles.userButton, menuOpen && styles.userButtonActive]}
          onPress={handleUserPress}
          activeOpacity={0.7}
        >
          <View style={styles.userIconSvg}>
            <View style={styles.userHead} />
            <View style={styles.userBody} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Dropdown menu */}
      {menuOpen && (
        <>
          <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={() => setMenuOpen(false)}
          />
          <View style={styles.dropdown}>
            <TouchableOpacity style={styles.dropdownItem} onPress={handleLogout}>
              <Text style={styles.logoutIcon}>↗</Text>
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  logoButton: {
    height: 34,
    justifyContent: 'center',
  },
  logoImage: {
    height: 26,
    width: 96,
  },
  spacer: {
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
    marginRight: 10,
  },
  langText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    height: 34,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.text,
    marginRight: 10,
  },
  newButtonPlus: {
    fontSize: 15,
    fontWeight: '300',
    color: '#FFFFFF',
    marginRight: 5,
    marginTop: -1,
  },
  newButtonLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.1,
  },
  userButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  userButtonActive: {
    borderColor: Colors.textSecondary,
    backgroundColor: Colors.background,
  },
  userIconSvg: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  userHead: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    borderWidth: 1.5,
    borderColor: Colors.textMuted,
    marginBottom: 1,
  },
  userBody: {
    width: 15,
    height: 7,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderWidth: 1.5,
    borderBottomWidth: 0,
    borderColor: Colors.textMuted,
  },
  overlay: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    bottom: -1000,
    zIndex: 99,
  },
  dropdown: {
    position: 'absolute',
    top: 62,
    right: Spacing.xl,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 6,
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 100,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  logoutIcon: {
    fontSize: 13,
    color: Colors.danger,
    marginRight: Spacing.sm,
    transform: [{ rotate: '90deg' }],
  },
  logoutText: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.danger,
  },
});
