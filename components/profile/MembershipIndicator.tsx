import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors } from '@/theme';
import {
   getMembershipCrownColor,
   type MembershipTier,
} from '@/utils/membershipDisplay';

interface MembershipIndicatorProps {
   tier: MembershipTier;
   size?: number;
}

/**
 * Crown for paid tiers; muted no-subscription icon when tier is none.
 */
export const MembershipIndicator: React.FC<MembershipIndicatorProps> = ({
   tier,
   size = 18,
}) => {
   if (tier === 'none') {
      return (
         <Ionicons
            name="card-outline"
            size={size}
            color={colors.iconForegrounds.muted}
         />
      );
   }

   const crownColor = getMembershipCrownColor(tier) ?? colors.iconForegrounds.yellow;

   return (
      <View style={styles.container}>
         <MaterialCommunityIcons name="crown" size={size} color={crownColor} />
      </View>
   );
};

const styles = StyleSheet.create({
   container: {
      justifyContent: 'center',
      alignItems: 'center',
   },
});
