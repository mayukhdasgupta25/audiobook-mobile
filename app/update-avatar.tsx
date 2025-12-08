import React, { useState, useCallback } from 'react';
import {
   View,
   Text,
   StyleSheet,
   ScrollView,
   TouchableOpacity,
   Platform,
   KeyboardAvoidingView,
   ActivityIndicator,
   Image,
   Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { updateUserProfile } from '@/services/user';
import { fetchUserProfile } from '@/store/auth';
import { AppDispatch, RootState } from '@/store';
import { ApiError } from '@/services/api';
import { getMainApiUrl } from '@/services/api';

/**
 * Update avatar screen
 * Allows user to update their avatar by selecting an image from device
 */
export default function UpdateAvatarScreen() {
   const dispatch = useDispatch<AppDispatch>();
   const userProfile = useSelector((state: RootState) => state.auth.userProfile);
   const currentAvatar = userProfile?.avatar;

   const [selectedImage, setSelectedImage] = useState<string | null>(null);
   const [isLoading, setIsLoading] = useState(false);
   const [isPickingImage, setIsPickingImage] = useState(false);
   const [error, setError] = useState<string | null>(null);

   // Get avatar display URI
   const avatarUri = selectedImage || (currentAvatar ? `${getMainApiUrl()}${currentAvatar}` : null);

   // Get user initials for placeholder
   const getInitials = useCallback((name: string): string => {
      const names = name.trim().split(' ');
      if (names.length >= 2) {
         return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
   }, []);

   const displayName = userProfile
      ? userProfile.firstName && userProfile.lastName
         ? `${userProfile.firstName} ${userProfile.lastName}`
         : userProfile.username || 'User'
      : 'User';

   /**
    * Request image picker permissions
    */
   const requestPermissions = useCallback(async (): Promise<boolean> => {
      try {
         const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
         if (status !== 'granted') {
            Alert.alert(
               'Permission Required',
               'We need access to your photos to select an avatar image.',
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

   /**
    * Handle image picker
    */
   const handlePickImage = useCallback(async () => {
      setError(null);
      setIsPickingImage(true);

      try {
         // Request permissions
         const hasPermission = await requestPermissions();
         if (!hasPermission) {
            setIsPickingImage(false);
            return;
         }

         // Launch image picker
         const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
         });

         if (!result.canceled && result.assets && result.assets.length > 0) {
            const imageUri = result.assets[0].uri;
            setSelectedImage(imageUri);
         }
      } catch (err) {
         console.error('[UpdateAvatar] Image picker error:', err);
         setError('Failed to pick image. Please try again.');
      } finally {
         setIsPickingImage(false);
      }
   }, [requestPermissions]);

   /**
    * Handle update avatar
    */
   const handleUpdate = useCallback(async () => {
      setError(null);

      // Check if image was selected
      if (!selectedImage) {
         setError('Please select an image');
         return;
      }

      setIsLoading(true);

      try {
         // For now, send the image URI to the API
         // If the backend requires file upload, this will need to be updated
         // to upload the image first and then send the URL
         await updateUserProfile({
            avatar: selectedImage,
         });

         // Refresh user profile
         try {
            await dispatch(fetchUserProfile()).unwrap();
         } catch (profileError) {
            console.error('[UpdateAvatar] Failed to refresh user profile:', profileError);
         }

         // Redirect back to account screen
         router.replace('/account');
      } catch (err) {
         // Handle API errors
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
            const errorMessage =
               err instanceof Error ? err.message : 'Unknown error';
            console.error('[UpdateAvatar] Non-API error:', errorMessage);

            // Provide helpful error message for network issues
            let userMessage = 'Network error. Please check your connection and try again.';
            if (errorMessage.includes('Network request failed')) {
               userMessage =
                  'Cannot connect to server. If testing on a physical device, set EXPO_PUBLIC_API_URL to your computer\'s IP address (e.g., http://192.168.1.100:8082)';
            }

            setError(userMessage);
         }
      } finally {
         setIsLoading(false);
      }
   }, [selectedImage, dispatch]);

   /**
    * Handle remove avatar
    */
   const handleRemove = useCallback(async () => {
      setError(null);
      setIsLoading(true);

      try {
         // Remove avatar by setting it to null
         await updateUserProfile({
            avatar: null,
         });

         // Refresh user profile
         try {
            await dispatch(fetchUserProfile()).unwrap();
         } catch (profileError) {
            console.error('[UpdateAvatar] Failed to refresh user profile:', profileError);
         }

         // Redirect back to account screen
         router.replace('/account');
      } catch (err) {
         // Handle API errors
         if (err instanceof ApiError) {
            const errorData = err.data as { message?: string } | undefined;
            setError(errorData?.message || 'Failed to remove avatar. Please try again.');
         } else {
            const errorMessage =
               err instanceof Error ? err.message : 'Unknown error';
            console.error('[UpdateAvatar] Remove avatar error:', errorMessage);
            setError('Failed to remove avatar. Please try again.');
         }
      } finally {
         setIsLoading(false);
      }
   }, [dispatch]);

   const handleBackPress = useCallback(() => {
      router.back();
   }, []);

   return (
      <>
         <Stack.Screen
            options={{
               headerShown: false,
               contentStyle: {
                  backgroundColor: colors.background.dark,
               },
            }}
         />

         <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <KeyboardAvoidingView
               style={styles.keyboardAvoid}
               behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
               <ScrollView
                  style={styles.scrollView}
                  contentContainerStyle={styles.scrollContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
               >
                  {/* Header */}
                  <View style={styles.header}>
                     <TouchableOpacity onPress={handleBackPress} style={styles.backButton} activeOpacity={0.7}>
                        <Text style={styles.backButtonText}>← Back</Text>
                     </TouchableOpacity>
                     <Text style={styles.title}>Update Avatar</Text>
                     <Text style={styles.subtitle}>
                        Select an image from your device
                     </Text>
                  </View>

                  {/* Avatar Preview */}
                  <View style={styles.avatarSection}>
                     <View style={styles.avatarContainer}>
                        {avatarUri ? (
                           <Image source={{ uri: avatarUri }} style={styles.avatar} />
                        ) : (
                           <View style={[styles.avatar, styles.avatarPlaceholder]}>
                              <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
                           </View>
                        )}
                     </View>

                     {/* Pick Image Button */}
                     <TouchableOpacity
                        style={[styles.pickImageButton, isPickingImage && styles.pickImageButtonDisabled]}
                        onPress={handlePickImage}
                        activeOpacity={0.8}
                        disabled={isPickingImage || isLoading}
                        testID="pick-image-button"
                     >
                        {isPickingImage ? (
                           <ActivityIndicator size="small" color={colors.text.dark} />
                        ) : (
                           <>
                              <Ionicons name="image-outline" size={20} color={colors.text.dark} />
                              <Text style={styles.pickImageButtonText}>Choose Image</Text>
                           </>
                        )}
                     </TouchableOpacity>
                  </View>

                  {/* Error Message */}
                  {error && (
                     <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                     </View>
                  )}

                  {/* Action Buttons */}
                  <View style={styles.actionsContainer}>
                     <TouchableOpacity
                        style={[styles.updateButton, isLoading && styles.updateButtonDisabled]}
                        onPress={handleUpdate}
                        activeOpacity={0.8}
                        disabled={isLoading || !selectedImage}
                        testID="update-button"
                     >
                        {isLoading ? (
                           <ActivityIndicator color={colors.text.dark} />
                        ) : (
                           <Text style={styles.updateButtonText}>Update Avatar</Text>
                        )}
                     </TouchableOpacity>

                     {currentAvatar && (
                        <TouchableOpacity
                           style={[styles.removeButton, isLoading && styles.removeButtonDisabled]}
                           onPress={handleRemove}
                           activeOpacity={0.8}
                           disabled={isLoading}
                           testID="remove-button"
                        >
                           <Text style={styles.removeButtonText}>Remove Avatar</Text>
                        </TouchableOpacity>
                     )}
                  </View>
               </ScrollView>
            </KeyboardAvoidingView>
         </SafeAreaView>
      </>
   );
}

const styles = StyleSheet.create({
   container: {
      flex: 1,
      backgroundColor: colors.background.dark,
   },
   keyboardAvoid: {
      flex: 1,
   },
   scrollView: {
      flex: 1,
   },
   scrollContent: {
      flexGrow: 1,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xxl,
      paddingBottom: spacing.xl,
   },
   header: {
      marginBottom: spacing.xl,
   },
   backButton: {
      alignSelf: 'flex-start',
      marginBottom: spacing.md,
      padding: spacing.xs,
   },
   backButtonText: {
      fontSize: typography.fontSize.base,
      color: colors.primary[400],
      ...Platform.select({
         ios: {
            fontFamily: 'System',
            fontWeight: '500',
         },
         android: {
            fontFamily: 'sans-serif-medium',
         },
      }),
   },
   title: {
      fontSize: typography.fontSize['4xl'],
      fontWeight: '700',
      color: colors.text.dark,
      marginBottom: spacing.sm,
      ...Platform.select({
         ios: {
            fontFamily: 'System',
            fontWeight: '700',
         },
         android: {
            fontFamily: 'sans-serif-bold',
         },
      }),
   },
   subtitle: {
      fontSize: typography.fontSize.base,
      color: colors.text.secondaryDark,
      ...Platform.select({
         ios: {
            fontFamily: 'System',
            fontWeight: '400',
         },
         android: {
            fontFamily: 'sans-serif',
         },
      }),
   },
   avatarSection: {
      alignItems: 'center',
      marginBottom: spacing.xl,
   },
   avatarContainer: {
      marginBottom: spacing.lg,
   },
   avatar: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colors.background.darkGrayLight,
   },
   avatarPlaceholder: {
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.primary[400],
   },
   avatarText: {
      fontSize: typography.fontSize['3xl'],
      fontWeight: '600',
      color: colors.text.dark,
      ...Platform.select({
         ios: {
            fontFamily: 'System',
            fontWeight: '600',
         },
         android: {
            fontFamily: 'sans-serif-medium',
         },
      }),
   },
   pickImageButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background.darkGrayLight,
      borderRadius: borderRadius.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      gap: spacing.sm,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
   },
   pickImageButtonDisabled: {
      opacity: 0.6,
   },
   pickImageButtonText: {
      fontSize: typography.fontSize.base,
      fontWeight: '600',
      color: colors.text.dark,
      ...Platform.select({
         ios: {
            fontFamily: 'System',
            fontWeight: '600',
         },
         android: {
            fontFamily: 'sans-serif-medium',
         },
      }),
   },
   errorContainer: {
      marginBottom: spacing.md,
   },
   errorText: {
      fontSize: typography.fontSize.sm,
      color: colors.error,
      textAlign: 'center',
      ...Platform.select({
         ios: {
            fontFamily: 'System',
            fontWeight: '400',
         },
         android: {
            fontFamily: 'sans-serif',
         },
      }),
   },
   actionsContainer: {
      gap: spacing.md,
   },
   updateButtonDisabled: {
      opacity: 0.6,
   },
   updateButton: {
      backgroundColor: colors.app.red,
      borderRadius: borderRadius.md,
      height: 48,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: spacing.md,
   },
   updateButtonText: {
      fontSize: typography.fontSize.lg,
      fontWeight: '600',
      color: colors.text.dark,
      ...Platform.select({
         ios: {
            fontFamily: 'System',
            fontWeight: '600',
         },
         android: {
            fontFamily: 'sans-serif-medium',
         },
      }),
   },
   removeButtonDisabled: {
      opacity: 0.6,
   },
   removeButton: {
      backgroundColor: colors.background.darkGrayLight,
      borderRadius: borderRadius.md,
      height: 48,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
   },
   removeButtonText: {
      fontSize: typography.fontSize.base,
      fontWeight: '600',
      color: colors.error,
      ...Platform.select({
         ios: {
            fontFamily: 'System',
            fontWeight: '600',
         },
         android: {
            fontFamily: 'sans-serif-medium',
         },
      }),
   },
});

