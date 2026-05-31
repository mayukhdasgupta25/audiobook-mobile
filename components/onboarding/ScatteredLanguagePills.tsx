import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { SelectableChip } from '@/components/SelectableChip';
import {
   INDIAN_LANGUAGES,
   shuffleLanguages,
   type IndianLanguage,
} from '@/constants/indianLanguages';
import { spacing } from '@/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';

/** Subtle per-pill rotation for an organic, non-grid feel */
const SCATTER_ROTATIONS = [
   -4, 3, -2, 5, -3, 2, -5, 4, -2, 3, -4, 2, -3, 5, -2, 4, -5, 3, -3, 2, -4, 5, -2,
] as const;

/** Small positional nudges (px) — keeps flow layout but avoids perfect alignment */
const SCATTER_NUDGES: { x: number; y: number }[] = [
   { x: 0, y: 4 },
   { x: 6, y: -2 },
   { x: -4, y: 3 },
   { x: 3, y: -4 },
   { x: -6, y: 2 },
   { x: 4, y: 0 },
   { x: -3, y: -3 },
   { x: 5, y: 4 },
   { x: -5, y: -2 },
   { x: 2, y: 3 },
   { x: -2, y: -4 },
   { x: 6, y: 0 },
   { x: 0, y: -3 },
   { x: -4, y: 4 },
   { x: 3, y: 2 },
   { x: -6, y: -2 },
   { x: 4, y: -3 },
   { x: -2, y: 4 },
   { x: 5, y: -4 },
   { x: -3, y: 0 },
   { x: 2, y: -2 },
   { x: -5, y: 3 },
   { x: 4, y: 2 },
];

interface ScatteredLanguagePillsProps {
   selectedCodes: string[];
   onToggle: (code: string) => void;
   maxSelections: number;
   languages?: readonly IndianLanguage[];
}

/**
 * Language pills in shuffled order with a flowing wrap layout and subtle scatter nudges
 */
export const ScatteredLanguagePills: React.FC<ScatteredLanguagePillsProps> = ({
   selectedCodes,
   onToggle,
   maxSelections,
   languages = INDIAN_LANGUAGES,
}) => {
   const shuffledLanguages = useMemo(() => shuffleLanguages(languages), [languages]);
   const atMaxSelection = selectedCodes.length >= maxSelections;

   const styles = useThemedStyles(() =>
      StyleSheet.create({
         container: {
            flex: 1,
            width: '100%',
            justifyContent: 'center',
            alignItems: 'center',
         },
         wrap: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'center',
            gap: spacing.sm,
            width: '100%',
         },
         pillWrap: {
            // Wrapper keeps rotation from affecting sibling layout bounds
         },
      })
   );

   return (
      <View style={styles.container}>
         <View style={styles.wrap}>
            {shuffledLanguages.map((language, index) => {
               const selected = selectedCodes.includes(language.code);
               const disabled = atMaxSelection && !selected;
               const rotation = SCATTER_ROTATIONS[index % SCATTER_ROTATIONS.length];
               const nudge = SCATTER_NUDGES[index % SCATTER_NUDGES.length];

               return (
                  <View
                     key={language.code}
                     style={[
                        styles.pillWrap,
                        {
                           marginLeft: nudge.x,
                           marginTop: nudge.y,
                           transform: [{ rotate: `${rotation}deg` }],
                        },
                     ]}
                  >
                     <SelectableChip
                        label={language.label}
                        selected={selected}
                        disabled={disabled}
                        onPress={() => onToggle(language.code)}
                        testID={`onboarding-language-${language.code}`}
                        compact
                     />
                  </View>
               );
            })}
         </View>
      </View>
   );
};
