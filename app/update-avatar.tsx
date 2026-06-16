import React, { useState, useCallback, useMemo } from 'react';
import {
   View,
   Text,
   StyleSheet,
   ScrollView,
   TouchableOpacity,
   Platform,
   ActivityIndicator,
   Image,
   Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import * as ImagePicker from 'expo-image-picker';
import { ScreenHeader } from '@/components/ScreenHeader';
import { spacing, typography, borderRadius } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SecondaryButton } from '@/components/SecondaryButton';
import { updateAppUserProfile } from '@/services/user';
import { fetchUserProfile } from '@/store/auth';
import { AppDispatch, RootState } from '@/store';
import { ApiError } from '@/services/api';
import { resolveAvatarUrl } from '@/utils/resolveAvatarUrl';

function getInitials(name: string): string {
   const names = name.trim().split(' ');
   if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
   }
   return name.substring(0, 2).toUpperCase();
}

export default function UpdateAvatarScreen() {
   const { colors } = useTheme();
   const styles = useThemedStyles((t) =>
      StyleSheet.create({
         container: {
            flex: 1,
            backgroundColor: t.colors.background.screen,
         },
         scrollView: {
            flex: 1,
         },
         scrollContent: {},
         previewContent: {
            alignItems: 'center',
            paddingVertical: spacing.xl,
            paddingHorizontal: spacing.md,
         },
         avatarRing: {
            padding: 4,
            borderRadius: borderRadius.full,
            borderWidth: 2,
            borderColor: t.colors.border.light,
            marginBottom: spacing.md,
         },
         avatar: {
            width: 120,
            height: 120,
            borderRadius: 60,
         },
         avatarPlaceholder: {
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: t.colors.primary[200],
            justifyContent: 'center',
            alignItems: 'center',
         },
         avatarText: {
            fontSize: typography.fontSize['3xl'],
            color: t.colors.accent.primary,
            ...Platform.select({
               ios: { fontFamily: 'System', fontWeight: '700' },
               android: { fontFamily: 'sans-serif-medium', fontWeight: '700' },
            }),
         },
         previewHint: {
            fontSize: typography.fontSize.sm,
            color: t.colors.text.secondary,
            textAlign: 'center',
         },
         actionsSection: {
            padding: spacing.md,
            gap: spacing.md,
         },
         errorBanner: {
            padding: spacing.md,
            borderRadius: borderRadius.md,
            backgroundColor: t.colors.background.highlight,
         },
         errorText: {
            fontSize: typography.fontSize.sm,
            color: t.colors.error,
            textAlign: 'center',
         },
         removeButton: {
            borderRadius: borderRadius.lg,
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.lg,
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 48,
            borderWidth: 2,
            borderColor: t.colors.error,
            backgroundColor: 'transparent',
         },
         removeButtonText: {
            fontSize: typography.fontSize.base,
            fontWeight: '600',
            color: t.colors.error,
            ...Platform.select({
               ios: { fontFamily: 'System', fontWeight: '600' },
               android: { fontFamily: 'sans-serif-medium', fontWeight: '600' },
            }),
         },
      })
   );

   const insets = useSafeAreaInsets();
   const dispatch = useDispatch<AppDispatch>();
   const userProfile = useSelector((state: RootState) => state.auth.userProfile);

   const [selectedImage, setSelectedImage] = useState<string | null>(null);
   const [isLoading, setIsLoading] = useState(false);
   const [isPickingImage, setIsPickingImage] = useState(false);
   const [error, setError] = useState<string | null>(null);

   const displayName = useMemo(() => {
      if (userProfile?.firstName && userProfile?.lastName) {
         return `${userProfile.firstName} ${userProfile.lastName}`;
      }
      if (userProfile?.firstName) {
         return userProfile.firstName;
      }
      if (userProfile?.username) {
         return userProfile.username;
      }
      return 'User';
   }, [userProfile]);

   const currentAvatarUri = resolveAvatarUrl(
      userProfile?.avatar,
      userProfile?.imageAssets
   );
   const previewUri = selectedImage ?? currentAvatarUri;
   const hasExistingAvatar = Boolean(userProfile?.avatar);

   const requestPermissions = useCallback(async (): Promise<boolean> => {
      try {
         const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
         if (status !== 'granted') {
            Alert.alert(
               'Permission required',
               'We need access to your photos to select a profile picture.',
               [{ text: 'OK' }]
            );
            return false;
         }
         return true;
      } catch (err) {
         console.error('[UpdateAvatar] Permission request error:', err);
         return false;
      }
   }, []);

   const handlePickImage = useCallback(async () => {
      setError(null);
      setIsPickingImage(true);

      try {
         const hasPermission = await requestPermissions();
         if (!hasPermission) {
            return;
         }

         const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
         });

         if (!result.canceled && result.assets.length > 0) {
            setSelectedImage(result.assets[0].uri);
         }
      } catch (err) {
         console.error('[UpdateAvatar] Image picker error:', err);
         setError('Failed to pick image. Please try again.');
      } finally {
         setIsPickingImage(false);
      }
   }, [requestPermissions]);

   const handleUpdate = useCallback(async () => {
      setError(null);

      if (!selectedImage) {
         setError('Please choose a photo first');
         return;
      }

      setIsLoading(true);

      try {
         await updateAppUserProfile({ avatar: selectedImage });

         try {
            await dispatch(fetchUserProfile()).unwrap();
         } catch (profileError) {
            console.error('[UpdateAvatar] Failed to refresh user profile:', profileError);
         }

         router.replace('/account');
      } catch (err) {
         if (err instanceof ApiError) {
            if (err.status === 400) {
               const errorData = err.data as { message?: string } | undefined;
               setError(errorData?.message || 'Invalid image. Please try again.');
            } else if (err.status === 401) {
               setError('Update failed. Please sign in again.');
            } else {
               const errorData = err.data as { message?: string } | undefined;
               setError(errorData?.message || 'Update failed. Please try again.');
            }
         } else {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            let userMessage = 'Network error. Please check your connection and try again.';
            if (errorMessage.includes('Network request failed')) {
               userMessage =
                  "Cannot connect to server. If testing on a device, set EXPO_PUBLIC_API_URL to your computer's IP address.";
            }
            setError(userMessage);
         }
      } finally {
         setIsLoading(false);
      }
   }, [selectedImage, dispatch]);

   const handleRemove = useCallback(async () => {
      Alert.alert(
         'Remove photo',
         'Your profile picture will be removed.',
         [
            { text: 'Cancel', style: 'cancel' },
            {
               text: 'Remove',
               style: 'destructive',
               onPress: async () => {
                  setError(null);
                  setIsLoading(true);

                  try {
                     await updateAppUserProfile({ avatar: null });

                     try {
                        await dispatch(fetchUserProfile()).unwrap();
                     } catch (profileError) {
                        console.error(
                           '[UpdateAvatar] Failed to refresh user profile:',
                           profileError
                        );
                     }

                     router.replace('/account');
                  } catch (err) {
                     if (err instanceof ApiError) {
                        const errorData = err.data as { message?: string } | undefined;
                        setError(
                           errorData?.message || 'Failed to remove photo. Please try again.'
                        );
                     } else {
                        setError('Failed to remove photo. Please try again.');
                     }
                  } finally {
                     setIsLoading(false);
                  }
               },
            },
         ]
      );
   }, [dispatch]);

   const handleBackPress = useCallback(() => {
      router.back();
   }, []);

   return (
      <>
         <Stack.Screen
            options={{
               headerShown: false,
               contentStyle: { backgroundColor: colors.background.screen },
            }}
         />

         <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <ScreenHeader headerIcon="update-avatar" onBack={handleBackPress} titleSize="large" />
            <ScrollView
               style={styles.scrollView}
               contentContainerStyle={[
                  styles.scrollContent,
                  { paddingBottom: insets.bottom + spacing.xl },
               ]}
               showsVerticalScrollIndicator={false}
            >
               <SettingsSection title="Preview">
                  <View style={styles.previewContent}>
                     <View style={styles.avatarRing}>
                        {previewUri ? (
                           <Image source={{ uri: previewUri }} style={styles.avatar} />
                        ) : (
                           <View style={styles.avatarPlaceholder}>
                              <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
                           </View>
                        )}
                     </View>
                     <Text style={styles.previewHint}>
                        {selectedImage
                           ? 'New photo selected — tap Save to apply'
                           : hasExistingAvatar
                             ? 'Current profile photo'
                             : 'No profile photo yet'}
                     </Text>
                  </View>
               </SettingsSection>

               <SettingsSection title="Actions">
                  <View style={styles.actionsSection}>
                     {isPickingImage ? (
                        <View style={{ alignItems: 'center', paddingVertical: spacing.sm }}>
                           <ActivityIndicator color={colors.accent.primary} />
                        </View>
                     ) : (
                        <SecondaryButton
                           title="Choose photo"
                           onPress={handlePickImage}
                           variant="outlined"
                           icon="image-outline"
                           disabled={isLoading}
                        />
                     )}

                     {error ? (
                        <View style={styles.errorBanner}>
                           <Text style={styles.errorText}>{error}</Text>
                        </View>
                     ) : null}

                     <PrimaryButton
                        title="Save photo"
                        onPress={handleUpdate}
                        loading={isLoading}
                        disabled={!selectedImage || isPickingImage}
                        testID="update-button"
                     />

                     {hasExistingAvatar ? (
                        <TouchableOpacity
                           style={styles.removeButton}
                           onPress={handleRemove}
                           activeOpacity={0.7}
                           disabled={isLoading || isPickingImage}
                           testID="remove-button"
                        >
                           <Text style={styles.removeButtonText}>Remove photo</Text>
                        </TouchableOpacity>
                     ) : null}
                  </View>
               </SettingsSection>
            </ScrollView>
         </SafeAreaView>
      </>
   );
}
