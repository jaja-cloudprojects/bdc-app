import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import Svg, { Path, Rect } from 'react-native-svg';
import { useQuery } from '@tanstack/react-query';
import { StudentPageScaffold } from '@/components/StudentPageScaffold';
import { api, Document } from '@/services/api';
import { Colors } from '@/constants/Colors';
import { FontFamily, FontSize } from '@/constants/Typography';
import { Spacing, Radius } from '@/constants/Layout';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

const CATEGORY_ORDER = ['Cours', 'Attestation', 'Support', 'Autre'];

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

export default function DocumentsScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => (await api.documents.list()).data,
    placeholderData: [],
  });

  const grouped = useMemo(() => {
    const docs = (data ?? []) as Document[];
    const map = new Map<string, Document[]>();
    for (const doc of docs) {
      const cat = doc.category || 'Autre';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(doc);
    }
    const sorted = [...map.entries()].sort(([a], [b]) => {
      const ia = CATEGORY_ORDER.indexOf(a);
      const ib = CATEGORY_ORDER.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
    return sorted;
  }, [data]);

  function openDoc(doc: Document) {
    router.push({
      pathname: '/(student)/pdf-viewer',
      params: { url: doc.fileUrl, title: doc.title },
    });
  }

  return (
    <StudentPageScaffold title="Mes documents" subtitle="Retrouvez ici vos cours et ressources PDF">
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : grouped.length === 0 ? (
        <View style={styles.center}>
          <PdfIcon size={48} color={Colors.textMuted} />
          <Text style={styles.empty}>Aucun document disponible pour le moment.</Text>
        </View>
      ) : (
        <View style={{ gap: Spacing.xl }}>
          {grouped.map(([category, docs]) => (
            <View key={category}>
              <Text style={styles.categoryLabel}>{category.toUpperCase()}</Text>
              <View style={{ gap: Spacing.sm }}>
                {docs.map((doc) => (
                  <Pressable
                    key={doc.id}
                    onPress={() => openDoc(doc)}
                    style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                  >
                    <View style={styles.iconWrap}>
                      <PdfIcon size={22} color={Colors.primary} />
                    </View>
                    <View style={styles.body}>
                      <Text style={styles.docTitle} numberOfLines={2}>{doc.title}</Text>
                      <Text style={styles.docMeta}>
                        {format(parseISO(doc.uploadedAt), 'd MMM yyyy', { locale: fr })}
                        {doc.fileSize ? ` · ${formatSize(doc.fileSize)}` : ''}
                      </Text>
                    </View>
                    <ChevronIcon />
                  </Pressable>
                ))}
              </View>
            </View>
          ))}
        </View>
      )}
    </StudentPageScaffold>
  );
}

function PdfIcon({ size = 24, color = Colors.textPrimary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="2" width="13" height="17" rx="2" stroke={color} strokeWidth="1.6" />
      <Path d="M16 2l5 5v15a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
      <Path d="M16 2v5h5" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
      <Path d="M7 13h6M7 10h4" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    </Svg>
  );
}

function ChevronIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={Colors.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingTop: Spacing['3xl'],
  },
  empty: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.base,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  categoryLabel: {
    fontFamily: FontFamily.sansSemibold,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    letterSpacing: 1.2,
    marginBottom: Spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.backgroundCard,
    padding: Spacing.base,
    borderRadius: Radius.md,
  },
  cardPressed: {
    opacity: 0.7,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    backgroundColor: Colors.backgroundElevated,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  body: { flex: 1 },
  docTitle: {
    fontFamily: FontFamily.sansSemibold,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  docMeta: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 3,
  },
});
