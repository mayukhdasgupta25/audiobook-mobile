import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
   View,
   Text,
   StyleSheet,
   FlatList,
   ActivityIndicator,
   TouchableOpacity,
   Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useOrganizationAudiobooks } from '@/hooks/useOrganizations';
import { Audiobook } from '@/services/audiobooks';
import { apiConfig } from '@/services/api';
import {
   AudiobookGridCard,
   GRID_PADDING,
   GRID_GAP,
   NUM_COLUMNS,
} from '@/components/AudiobookGridCard';
import { colors, spacing, typography, borderRadius } from '@/theme';

export default function PublisherDetailScreen() {
   const params = useLocalSearchParams<{
      id: string;
      name?: string;
      description?: string;
      imagePath?: string;
   }>();
   const organizationId = params.id ?? '';
   const displayName = params.name ?? 'Publisher';

   const [page, setPage] = useState(1);
   const [allAudiobooks, setAllAudiobooks] = useState<Audiobook[]>([]);

   const { data, isLoading, error, isFetching } = useOrganizationAudiobooks(
      organizationId,
      page
   );

   const pagination = data?.pagination;
   const imageUri = params.imagePath
      ? `${apiConfig.baseURL}${params.imagePath}`
      : undefined;

   useEffect(() => {
      if (!data?.data) return;
      setAllAudiobooks((prev) => {
         if (page === 1) return data.data;
         const ids = new Set(prev.map((b) => b.id));
         const merged = [...prev];
         for (const book of data.data) {
            if (!ids.has(book.id)) merged.push(book);
         }
         return merged;
      });
   }, [data, page]);

   const handleLoadMore = useCallback(() => {
      if (pagination?.hasNextPage && !isFetching) {
         setPage((p) => p + 1);
      }
   }, [pagination, isFetching]);

   const renderAudiobook = useCallback(
      ({ item }: { item: Audiobook }) => (
         <AudiobookGridCard
            item={item}
            onPress={() => router.push(`/details/${item.id}` as never)}
         />
      ),
      []
   );

   const listHeader = useMemo(
      () => (
         <View style={styles.headerBlock}>
            {imageUri ? (
               <Image source={{ uri: imageUri }} style={styles.logo} contentFit="cover" />
            ) : (
               <View style={[styles.logo, styles.placeholder]}>
                  <Text style={styles.placeholderLetter}>{displayName.charAt(0)}</Text>
               </View>
            )}
            <Text style={styles.name}>{displayName}</Text>
            {params.description ? (
               <Text style={styles.description}>{params.description}</Text>
            ) : null}
            <Text style={styles.sectionLabel}>Audiobooks</Text>
         </View>
      ),
      [imageUri, displayName, params.description]
   );

   const listEmpty = useMemo(() => {
      if (isLoading) return null;
      return (
         <View style={styles.empty}>
            <Text style={styles.emptyText}>No audiobooks for this publisher yet.</Text>
         </View>
      );
   }, [isLoading]);

   return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
         <View style={styles.topBar}>
            <TouchableOpacity style={styles.back} onPress={() => router.back()}>
               <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
            </TouchableOpacity>
         </View>

         {isLoading && allAudiobooks.length === 0 ? (
            <View style={styles.center}>
               <ActivityIndicator size="large" color={colors.accent.primary} />
            </View>
         ) : error ? (
            <View style={styles.center}>
               <Text style={styles.error}>Unable to load audiobooks</Text>
            </View>
         ) : (
            <FlatList
               data={allAudiobooks}
               keyExtractor={(item) => item.id}
               renderItem={renderAudiobook}
               numColumns={NUM_COLUMNS}
               columnWrapperStyle={styles.gridRow}
               ListHeaderComponent={listHeader}
               ListEmptyComponent={listEmpty}
               onEndReached={handleLoadMore}
               onEndReachedThreshold={0.4}
               ListFooterComponent={
                  isFetching && allAudiobooks.length > 0 ? (
                     <ActivityIndicator
                        style={styles.footerLoader}
                        color={colors.accent.primary}
                     />
                  ) : null
               }
               contentContainerStyle={styles.listContent}
            />
         )}
      </SafeAreaView>
   );
}

const styles = StyleSheet.create({
   container: {
      flex: 1,
      backgroundColor: colors.background.screen,
   },
   topBar: {
      paddingHorizontal: spacing.md,
   },
   back: {
      paddingVertical: spacing.sm,
   },
   center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
   },
   error: {
      color: colors.error,
   },
   listContent: {
      paddingHorizontal: GRID_PADDING,
      paddingBottom: spacing.xxl,
   },
   gridRow: {
      gap: GRID_GAP,
      marginBottom: GRID_GAP,
   },
   headerBlock: {
      alignItems: 'center',
      paddingBottom: spacing.lg,
      width: '100%',
   },
   logo: {
      width: 120,
      height: 120,
      borderRadius: borderRadius.xl,
      marginBottom: spacing.md,
   },
   placeholder: {
      backgroundColor: colors.background.input,
      alignItems: 'center',
      justifyContent: 'center',
   },
   placeholderLetter: {
      fontSize: 40,
      fontWeight: '700',
      color: colors.text.muted,
   },
   name: {
      fontSize: typography.fontSize['2xl'],
      fontWeight: '700',
      color: colors.text.primary,
      textAlign: 'center',
      ...Platform.select({
         android: { fontFamily: 'sans-serif-medium' },
      }),
   },
   description: {
      fontSize: typography.fontSize.base,
      color: colors.text.secondary,
      marginTop: spacing.sm,
      lineHeight: 22,
      textAlign: 'center',
   },
   sectionLabel: {
      alignSelf: 'stretch',
      fontSize: typography.fontSize.lg,
      fontWeight: '600',
      color: colors.text.primary,
      marginTop: spacing.lg,
   },
   empty: {
      padding: spacing.xl,
      alignItems: 'center',
   },
   emptyText: {
      color: colors.text.secondary,
      textAlign: 'center',
   },
   footerLoader: {
      padding: spacing.lg,
   },
});
