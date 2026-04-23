import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { StudentPageScaffold } from '@/components/StudentPageScaffold';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useAuth } from '@/contexts/AuthContext';
import { api, isApiError } from '@/services/api';
import { Colors } from '@/constants/Colors';
import { FontFamily, FontSize } from '@/constants/Typography';
import { Spacing, Radius } from '@/constants/Layout';

export default function ProfileScreen() {
  const { user, updateUser, logout } = useAuth();

  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  function startEdit() {
    setFirstName(user?.firstName ?? '');
    setLastName(user?.lastName ?? '');
    setEmail(user?.email ?? '');
    setLocalAvatarUri(null);
    setSaveError(null);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setSaveError(null);
    setLocalAvatarUri(null);
  }

  async function pickAvatar() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission requise',
        "Autorisez l'accès à votre galerie pour changer la photo de profil."
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setLocalAvatarUri(result.assets[0].uri);
    }
  }

  async function save() {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setSaveError('Tous les champs sont requis.');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      if (localAvatarUri) {
        const ext = localAvatarUri.split('.').pop()?.toLowerCase();
        const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
        await api.users.uploadAvatar(localAvatarUri, mimeType);
      }
      const { data } = await api.users.updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
      });
      updateUser(data);
      setEditing(false);
      setLocalAvatarUri(null);
    } catch (e) {
      setSaveError(
        isApiError(e)
          ? (e.response?.data?.message ?? 'Erreur lors de la sauvegarde.')
          : 'Erreur lors de la sauvegarde.'
      );
    } finally {
      setSaving(false);
    }
  }

  const avatarSource = localAvatarUri ?? user?.avatarUrl ?? null;
  const initial = (user?.firstName ?? 'U').charAt(0).toUpperCase();

  return (
    <StudentPageScaffold title="Mon profil" subtitle="Gérez vos informations personnelles">
      {/* Avatar */}
      <View style={styles.avatarSection}>
        <Pressable
          onPress={editing ? pickAvatar : undefined}
          style={styles.avatarWrap}
        >
          {avatarSource ? (
            <Image source={{ uri: avatarSource }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitial}>{initial}</Text>
            </View>
          )}
          {editing && (
            <View style={styles.avatarOverlay}>
              <Text style={styles.avatarOverlayText}>Modifier</Text>
            </View>
          )}
        </Pressable>
      </View>

      {editing ? (
        <View style={styles.form}>
          <Input
            label="Prénom"
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
            editable={!saving}
          />
          <Input
            label="Nom"
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
            editable={!saving}
          />
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            editable={!saving}
          />
          {!!saveError && <Text style={styles.errorText}>{saveError}</Text>}
          <Button
            label="Enregistrer"
            onPress={save}
            loading={saving}
            disabled={saving}
            fullWidth
            size="lg"
          />
          <Button
            label="Annuler"
            variant="outline"
            onPress={cancelEdit}
            disabled={saving}
            fullWidth
          />
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.name}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={styles.email}>{user?.email}</Text>
          <Button
            label="Modifier mon profil"
            variant="secondary"
            onPress={startEdit}
            fullWidth
            style={{ marginTop: Spacing.lg }}
          />
        </View>
      )}

      <Button
        label="Se déconnecter"
        variant="outline"
        fullWidth
        onPress={logout}
        style={{ marginTop: Spacing.xl }}
      />
    </StudentPageScaffold>
  );
}

const AVATAR_SIZE = 96;

const styles = StyleSheet.create({
  avatarSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  avatarWrap: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.borderLight,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: FontFamily.serifBold,
    fontSize: FontSize['3xl'],
    color: Colors.white,
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOverlayText: {
    fontFamily: FontFamily.sansSemibold,
    fontSize: FontSize.xs,
    color: Colors.white,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: Colors.backgroundCard,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  name: {
    fontFamily: FontFamily.sansSemibold,
    fontSize: FontSize.xl,
    color: Colors.textPrimary,
  },
  email: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  form: {
    gap: Spacing.base,
  },
  errorText: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
    color: Colors.error,
    textAlign: 'center',
  },
});
