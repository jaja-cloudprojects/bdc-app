import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { StudentPageScaffold } from '@/components/StudentPageScaffold';
import { Button } from '@/components/Button';
import { api, Masterclass, MyReservation } from '@/services/api';
import { Colors } from '@/constants/Colors';
import { FontFamily, FontSize } from '@/constants/Typography';
import { Spacing, Radius } from '@/constants/Layout';

type Tab = 'upcoming' | 'mine';

export default function PracticalSheetsScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('upcoming');
  const qc = useQueryClient();

  const { data: upcoming = [] } = useQuery({
    queryKey: ['masterclass', 'upcoming'],
    queryFn: async () => (await api.masterclass.upcoming()).data,
    placeholderData: [],
  });

  // Toujours chargé pour savoir quelles masterclasses sont déjà réservées
  const { data: myReservations = [], isLoading: loadingMine } = useQuery({
    queryKey: ['masterclass', 'mine'],
    queryFn: async () => (await api.masterclass.myReservations()).data,
    placeholderData: [],
  });

  // IDs des masterclasses déjà réservées par l'utilisateur
  const reservedIds = useMemo(
    () => new Set((myReservations as MyReservation[]).map((r) => r.masterclass.id)),
    [myReservations]
  );

  // Masterclasses à venir non encore réservées
  const availableUpcoming = useMemo(
    () => (upcoming as Masterclass[]).filter((m) => !reservedIds.has(m.id)),
    [upcoming, reservedIds]
  );

  const invalidateBoth = () => {
    qc.invalidateQueries({ queryKey: ['masterclass', 'upcoming'] });
    qc.invalidateQueries({ queryKey: ['masterclass', 'mine'] });
  };

  const reserve = useMutation({
    mutationFn: (id: string) => api.masterclass.reserve(id),
    onSuccess: () => {
      Alert.alert('Réservation confirmée', 'Votre place est réservée.');
      invalidateBoth();
    },
    onError: (err: any) => {
      const serverMsg = err?.response?.data?.message;
      const isNetwork = !err?.response;
      const msg = serverMsg ?? (isNetwork ? 'Impossible de joindre le serveur. Vérifiez votre connexion.' : 'La réservation a échoué.');
      Alert.alert('Erreur', msg);
    },
  });

  const cancel = useMutation({
    mutationFn: (masterclassId: string) => api.masterclass.cancelReservation(masterclassId),
    onSuccess: () => {
      Alert.alert('Annulée', 'Votre réservation a été annulée.');
      invalidateBoth();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? "L'annulation a échoué.";
      Alert.alert('Erreur', msg);
    },
  });

  const confirmCancel = (mcId: string, mcTitle: string) => {
    Alert.alert(
      'Annuler la réservation',
      `Voulez-vous annuler votre place pour « ${mcTitle} » ?`,
      [
        { text: 'Non', style: 'cancel' },
        { text: 'Oui, annuler', style: 'destructive', onPress: () => cancel.mutate(mcId) },
      ]
    );
  };

  return (
    <StudentPageScaffold title="Réserver une masterclass" subtitle="Masterclasses et ressources">
      {/* Tab switcher */}
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
            Masterclasses
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'mine' && styles.tabActive]}
          onPress={() => setActiveTab('mine')}
        >
          <Text style={[styles.tabText, activeTab === 'mine' && styles.tabTextActive]}>
            Mes réservations
            {(myReservations as MyReservation[]).filter(
              (r) => new Date(r.masterclass.date) >= new Date()
            ).length > 0 && (
              <Text style={styles.badge}>
                {' '}
                {
                  (myReservations as MyReservation[]).filter(
                    (r) => new Date(r.masterclass.date) >= new Date()
                  ).length
                }
              </Text>
            )}
          </Text>
        </Pressable>
      </View>

      {/* Onglet Masterclasses */}
      {activeTab === 'upcoming' && (
        <View style={{ gap: Spacing.md }}>
          {availableUpcoming.length === 0 ? (
            <Text style={styles.empty}>
              {reservedIds.size > 0 && (upcoming as Masterclass[]).length > 0
                ? 'Vous êtes inscrit à toutes les masterclasses disponibles.'
                : 'Aucune masterclass programmée.'}
            </Text>
          ) : (
            availableUpcoming.map((m: Masterclass) => (
              <View key={m.id} style={styles.card}>
                <Text style={styles.date}>
                  {format(parseISO(m.date), 'EEEE d MMMM', { locale: fr })}
                </Text>
                <Text style={styles.title}>{m.title}</Text>
                {!!m.location && <Text style={styles.meta}>{m.location}</Text>}
                <Text style={styles.spots}>{m.spotsAvailable} places restantes</Text>
                <Button
                  label={m.spotsAvailable > 0 ? 'Réserver' : 'Complet'}
                  disabled={m.spotsAvailable === 0 || reserve.isPending}
                  loading={reserve.isPending && reserve.variables === m.id}
                  size="sm"
                  style={{ marginTop: Spacing.md, alignSelf: 'flex-start' }}
                  onPress={() => reserve.mutate(m.id)}
                />
              </View>
            ))
          )}
        </View>
      )}

      {/* Onglet Mes réservations */}
      {activeTab === 'mine' && (
        <View style={{ gap: Spacing.md }}>
          {loadingMine ? (
            <Text style={styles.empty}>Chargement…</Text>
          ) : (myReservations as MyReservation[]).length === 0 ? (
            <Text style={styles.empty}>Vous n'avez aucune réservation.</Text>
          ) : (
            (myReservations as MyReservation[]).map((r: MyReservation) => {
              const mc = r.masterclass;
              const isPast = new Date(mc.date) < new Date();
              return (
                <View key={r.id} style={[styles.card, isPast && styles.cardPast]}>
                  <View style={styles.badgeRow}>
                    <Text style={styles.date}>
                      {format(parseISO(mc.date), 'EEEE d MMMM yyyy', { locale: fr })}
                    </Text>
                    <View style={[styles.statusBadge, isPast ? styles.badgePast : styles.badgeConfirmed]}>
                      <Text style={styles.badgeText}>{isPast ? 'Passée' : 'Confirmée'}</Text>
                    </View>
                  </View>
                  <Text style={styles.title}>{mc.title}</Text>
                  {!!mc.location && <Text style={styles.meta}>{mc.location}</Text>}
                  <Text style={styles.reservedOn}>
                    Inscrit le {format(parseISO(r.createdAt), 'd MMMM yyyy', { locale: fr })}
                  </Text>
                  {!isPast && (
                    <Button
                      label="Annuler la réservation"
                      variant="ghost"
                      size="sm"
                      loading={cancel.isPending && cancel.variables === mc.id}
                      disabled={cancel.isPending}
                      style={{ marginTop: Spacing.sm, alignSelf: 'flex-start' }}
                      onPress={() => confirmCancel(mc.id, mc.title)}
                    />
                  )}
                </View>
              );
            })
          )}
        </View>
      )}
    </StudentPageScaffold>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundCard,
    borderRadius: Radius.md,
    padding: 4,
    marginBottom: Spacing.md,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Radius.sm,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.white,
  },
  badge: {
    color: Colors.white,
    fontFamily: FontFamily.sansSemibold,
  },
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
  cardPast: {
    opacity: 0.6,
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
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  badgeConfirmed: {
    backgroundColor: Colors.success + '33',
  },
  badgePast: {
    backgroundColor: Colors.textMuted + '33',
  },
  badgeText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 10,
    color: Colors.textSecondary,
  },
  reservedOn: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
});
