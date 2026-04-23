import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Linking,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Header } from '@/components/Header';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/Colors';
import { FontFamily, FontSize, LetterSpacing } from '@/constants/Typography';
import { Spacing, Radius, MaxContentWidth } from '@/constants/Layout';
import { useResponsive } from '@/hooks/useResponsive';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, error } = useAuth();
  const { width, scale } = useResponsive();

  const contentWidth = Math.min(width, 480);

  const handleSubmit = async () => {
    if (!email.trim() || !password) return;
    try {
      setLoading(true);
      await login(email.trim(), password);
      router.replace('/(student)/dashboard' as any);
    } catch {
      // error exposed via useAuth().error
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <Header showCart={false} onMenuPress={() => router.back()} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.scroll, { width: contentWidth, alignSelf: 'center' }]}
        >
          {/* Title block - ESPACE Élèves */}
          <View style={styles.titleBlock}>
            <Text
              style={[
                styles.espaceText,
                { fontSize: scale({ phoneSm: 52, phone: 64, tablet: 92 }) },
              ]}
            >
              ESPACE
            </Text>
            <Text
              style={[
                styles.elevesText,
                { fontSize: scale({ phoneSm: 32, phone: 40, tablet: 56 }) },
              ]}
            >
              Élèves
            </Text>
            <Image
              source={{ uri: 'https://i.postimg.cc/F9g9RdFH/capture-produits.png' }}
              style={styles.decorImage}
              contentFit="contain"
            />
          </View>

          <View style={styles.form}>
            <Input
              label="Identifiant :"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="username"
              editable={!loading}
            />
            <Input
              label="Mot de passe :"
              value={password}
              onChangeText={setPassword}
              secure
              autoComplete="password"
              textContentType="password"
              editable={!loading}
              error={error ?? undefined}
            />

            <Button
              label="Connexion"
              onPress={handleSubmit}
              loading={loading}
              disabled={!email.trim() || !password}
              fullWidth
              size="lg"
              style={styles.connect}
            />

            <Text style={styles.helpText}>
              En cas de problème de connexion, merci de nous contacter par mail{'\n'}
              <Text
                style={styles.mail}
                onPress={() => Linking.openURL('mailto:beauteducil.collection@gmail.com')}
              >
                beauteducil.collection@gmail.com
              </Text>
            </Text>
          </View>

          <View style={styles.footer}>
            <Pressable onPress={() => Linking.openURL('https://beauteducil.com/cgv')}>
              <Text style={styles.footerLink}>Conditions de services</Text>
            </Pressable>
            <Pressable onPress={() => Linking.openURL('https://beauteducil.com/privacy')}>
              <Text style={styles.footerLink}>Politique de confidentialité</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: { flex: 1 },
  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  titleBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
    position: 'relative',
  },
  espaceText: {
    fontFamily: FontFamily.serifBold,
    color: Colors.textPrimary,
    letterSpacing: LetterSpacing.wider,
  },
  elevesText: {
    fontFamily: FontFamily.script,
    color: Colors.textPrimary,
    marginTop: -Spacing.md,
  },
  decorImage: {
    position: 'absolute',
    right: -10,
    top: -10,
    width: 90,
    height: 90,
    opacity: 0.85,
  },
  form: {
    gap: Spacing.base,
    marginBottom: Spacing.xl,
  },
  connect: {
    marginTop: Spacing.lg,
  },
  helpText: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.lg,
    lineHeight: FontSize.sm * 1.6,
  },
  mail: {
    color: Colors.primaryLight,
    fontFamily: FontFamily.sansMedium,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.sm,
  },
  footerLink: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
});
