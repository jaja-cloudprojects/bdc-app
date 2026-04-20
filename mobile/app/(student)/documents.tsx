import React from 'react';
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useQuery } from '@tanstack/react-query';
import { StudentPageScaffold } from '@/components/StudentPageScaffold';
import { api, Document } from '@/services/api';
import { Colors } from '@/constants/Colors';
import { FontFamily, FontSize } from '@/constants/Typography';
import { Spacing, Radius } from '@/constants/Layout';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function DocumentsScreen() {
  const { data } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => (await api.documents.list()).data,
    placeholderData: [],
  });

  return (
    <StudentPageScaffold title="Mes documents" subtitle="Retrouvez ici tous vos documents et attestations">
      {(data ?? []).length === 0 ? (
        <Text style={styles.empty}>Aucun document disponible pour le moment.</Text>
      ) : (
        <View style={{ gap: Spacing.md }}>
          {(data ?? []).map((doc: Document) => (
            <Pressable
              key={doc.id}
              onPress={() => Linking.openURL(doc.fileUrl)}
              style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
            >
              <FileIcon />
              <View style={styles.body}>
                <Text style={styles.docTitle} numberOfLines={1}>{doc.title}</Text>
                <Text style={styles.docMeta}>
                  {doc.category} · {format(parseISO(doc.uploadedAt), 'd MMM yyyy', { locale: fr })}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </StudentPageScaffold>
  );
}

function FileIcon() {
  return (
    <View style={styles.icon}>
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <Path
          d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z"
          stroke={Colors.textPrimary}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <Path d="M14 3v6h6" stroke={Colors.textPrimary} strokeWidth="1.6" strokeLinejoin="round" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    marginTop: Spacing.xl,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.backgroundCard,
    padding: Spacing.base,
    borderRadius: Radius.md,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  docTitle: {
    fontFamily: FontFamily.sansSemibold,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },
  docMeta: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
