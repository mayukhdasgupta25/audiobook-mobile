import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { router, type Href } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { TextInput } from '@/components/TextInput';
import { WizardScreenLayout } from '@/components/WizardScreenLayout';
import { fetchUserProfile } from '@/store/auth';
import { useOnboardingStore, MIN_AGE, MAX_AGE } from '@/store/onboarding';
import { AppDispatch, RootState } from '@/store';
import { spacing } from '@/theme';

const TOTAL_STEPS = 3;

/**
 * Onboarding step 1: collect user age and load profile for pre-fill
 */
export default function OnboardingAgeScreen() {
   const dispatch = useDispatch<AppDispatch>();
   const userProfile = useSelector((state: RootState) => state.auth.userProfile);
   const profileFetched = useSelector((state: RootState) => state.auth.profileFetched);

   const storedAge = useOnboardingStore((s) => s.age);
   const setStoredAge = useOnboardingStore((s) => s.setAge);

   const [ageInput, setAgeInput] = useState(
      storedAge !== null ? String(storedAge) : ''
   );
   const [error, setError] = useState<string | null>(null);
   const [isLoadingProfile, setIsLoadingProfile] = useState(!profileFetched);

   useEffect(() => {
      const loadProfile = async () => {
         if (profileFetched) {
            setIsLoadingProfile(false);
            return;
         }
         try {
            await dispatch(fetchUserProfile()).unwrap();
         } catch (profileError) {
            console.error('[OnboardingAge] Failed to fetch user profile:', profileError);
         } finally {
            setIsLoadingProfile(false);
         }
      };

      void loadProfile();
   }, [dispatch, profileFetched]);

   useEffect(() => {
      if (storedAge !== null) {
         setAgeInput(String(storedAge));
         return;
      }
      if (userProfile?.age != null && userProfile.age > 0) {
         setStoredAge(userProfile.age);
         setAgeInput(String(userProfile.age));
      }
   }, [userProfile?.age, storedAge, setStoredAge]);

   const handleContinue = useCallback(() => {
      setError(null);
      const parsed = parseInt(ageInput.trim(), 10);
      if (Number.isNaN(parsed)) {
         setError('Please enter a valid age');
         return;
      }
      if (parsed < MIN_AGE || parsed > MAX_AGE) {
         setError(`Age must be between ${MIN_AGE} and ${MAX_AGE}`);
         return;
      }
      setStoredAge(parsed);
      router.push('/onboarding/gender' as Href);
   }, [ageInput, setStoredAge]);

   return (
      <WizardScreenLayout
         step={1}
         totalSteps={TOTAL_STEPS}
         title="How old are you?"
         subtitle="This helps us personalize your listening experience."
         onContinue={handleContinue}
         continueDisabled={isLoadingProfile || !ageInput.trim()}
         error={error}
      >
         {isLoadingProfile ? (
            <View style={styles.loading}>
               <ActivityIndicator size="large" />
            </View>
         ) : (
            <TextInput
               label="Age"
               value={ageInput}
               onChangeText={(text) => setAgeInput(text.replace(/\D/g, '').slice(0, 3))}
               keyboardType="numeric"
               placeholder="Enter your age"
               testID="onboarding-age-input"
            />
         )}
      </WizardScreenLayout>
   );
}

const styles = StyleSheet.create({
   loading: {
      paddingVertical: spacing.xl,
      alignItems: 'center',
   },
});
