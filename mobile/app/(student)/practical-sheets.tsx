import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { StudentPageScaffold } from '@/components/StudentPageScaffold';
import { Button } from '@/components/Button';
import { api, Masterclass } from '@/services/api';
import { Colors } from '@/constants/Colors';
import { FontFamily, FontSize } from '@/constants/Typography';
import { Spacing, Radius } from '@/constants/Layout';

export default function PracticalSheetsScreen() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['masterclass', 'upcoming'],
    queryFn: async () => (await api.masterclass.upcoming()).data,
    placeholderData: [],
  });

  const reserve = useMutation({
    mutationFn: (id: string) => api.masterclass.reserve(id),
    onSuccess: () => {
      Alert.alert('Réservation confirmée', 'Votre place est réservée.');
      qc.invalidateQueries({ queryKey: ['masterclass'] });
    },
    onError: () => Alert.alert('Erreur', 'La réservation a échoué.'),
  });

  return (
    <StudentPageScaffold title="Fiches pratiques" subtitle="Masterclasses et ressources">
      {(data ?? []).length === 0 ? (
        <Text style={styles.empty}>Aucune masterclass programmée.</Text>
      ) : (
        <View style={{ gap: Spacing.md }}>
          {(data ?? []).map((m: Masterclass) => (
            <View key={m.id} style={styles.card}>
              <Text style={styles.date}>
                {format(parseISO(m.date), 'EEEE d MMMM', { locale: fr })}
              </Text>
              <Text style={styles.title}>{m.title}</Text>
              {!!m.location && <Text style={styles.meta}>{m.location}</Text>}
              <Text style={styles.spots}>{m.spotsAvailable} places restantes</Text>
              <Button
                label={m.spotsAvailable > 0 ? 'Réserver' : 'Complet'}
                disabled={m.spotsAvailable === 0}
                loading={reserve.isPending}
                size="sm"
                style={{ marginTop: Spacing.md, alignSelf: 'flex-start' }}
                onPress={() => reserve.mutate(m.id)}
              />
            </View>
          ))}
        </View>
      )}
    </StudentPageScaffold>
  );
}

const styles = StyleSheet.create({
  empty: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.base,
    color: Colors.textSecondary,
  },
  card: {
    backgroundColor: Colors.backgroundCard,
    padding: Spacing.base,
    borderRadius: Radius.md,
  },
  date: {
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.sm,
    color: Colors.primary,
    textTransform: 'capitalize',
  },
  title: {
    fontFamily: FontFamily.sansSemibold,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  meta: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  spots: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
});
