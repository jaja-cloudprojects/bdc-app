import React from 'react';
import { Text, StyleSheet, Linking } from 'react-native';
import { router } from 'expo-router';
import { StudentPageScaffold } from '@/components/StudentPageScaffold';
import { Button } from '@/components/Button';
import { Colors } from '@/constants/Colors';
import { FontFamily, FontSize } from '@/constants/Typography';
import { Spacing } from '@/constants/Layout';

export default function HelpScreen() {
  return (
    <StudentPageScaffold title="Besoin d'aide ?" subtitle="Nous sommes là pour vous accompagner">
      <Text style={styles.para}>
        Vous rencontrez une difficulté ? Vous pouvez poser votre question directement au BDC Bot,
        ou nous contacter par email ou téléphone.
      </Text>
      <Button
        label="Ouvrir le chat avec BDC Bot"
        fullWidth
        style={{ marginTop: Spacing.xl }}
        onPress={() => router.push('/(student)/chat' as any)}
      />
      <Button
        label="Envoyer un email"
        variant="outline"
        fullWidth
        style={{ marginTop: Spacing.md }}
        onPress={() => Linking.openURL('mailto:beauteducil.collection@gmail.com')}
      />
      <Button
        label="Appeler le support"
        variant="outline"
        fullWidth
        style={{ marginTop: Spacing.md }}
        onPress={() => Linking.openURL('tel:+33651398918')}
      />
    </StudentPageScaffold>
  );
}

const styles = StyleSheet.create({
  para: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    lineHeight: FontSize.base * 1.6,
  },
});
