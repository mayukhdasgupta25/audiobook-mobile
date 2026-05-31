import React, { useState } from 'react';
import {
   View,
   Text,
   Modal,
   StyleSheet,
   TextInput,
   TouchableOpacity,
   Pressable,
   ActivityIndicator,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '@/theme';

interface CreatePlaylistModalProps {
   visible: boolean;
   onClose: () => void;
   onCreate: (name: string, description: string) => void;
   isPending?: boolean;
}

export const CreatePlaylistModal: React.FC<CreatePlaylistModalProps> = ({
   visible,
   onClose,
   onCreate,
   isPending,
}) => {
   const [name, setName] = useState('');
   const [description, setDescription] = useState('');

   const handleCreate = () => {
      const trimmed = name.trim();
      if (!trimmed) return;
      onCreate(trimmed, description.trim());
      setName('');
      setDescription('');
   };

   return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
         <Pressable style={styles.backdrop} onPress={onClose}>
            <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
               <Text style={styles.title}>New playlist</Text>
               <TextInput
                  style={styles.input}
                  placeholder="Name"
                  placeholderTextColor={colors.text.muted}
                  value={name}
                  onChangeText={setName}
               />
               <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Description (optional)"
                  placeholderTextColor={colors.text.muted}
                  value={description}
                  onChangeText={setDescription}
                  multiline
               />
               <View style={styles.actions}>
                  <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
                     <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                     onPress={handleCreate}
                     style={styles.createBtn}
                     disabled={isPending || !name.trim()}
                  >
                     {isPending ? (
                        <ActivityIndicator color="#fff" size="small" />
                     ) : (
                        <Text style={styles.createText}>Create</Text>
                     )}
                  </TouchableOpacity>
               </View>
            </Pressable>
         </Pressable>
      </Modal>
   );
};

const styles = StyleSheet.create({
   backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'center',
      padding: spacing.lg,
   },
   card: {
      backgroundColor: colors.background.screen,
      borderRadius: borderRadius.xl,
      padding: spacing.lg,
   },
   title: {
      fontSize: typography.fontSize.lg,
      fontWeight: '700',
      color: colors.text.primary,
      marginBottom: spacing.md,
   },
   input: {
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
      color: colors.text.primary,
      backgroundColor: colors.background.input,
   },
   textArea: {
      minHeight: 80,
      textAlignVertical: 'top',
   },
   actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: spacing.md,
      marginTop: spacing.md,
   },
   cancelBtn: {
      padding: spacing.sm,
   },
   cancelText: {
      color: colors.text.secondary,
   },
   createBtn: {
      backgroundColor: colors.accent.primary,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.md,
      minWidth: 88,
      alignItems: 'center',
   },
   createText: {
      color: '#fff',
      fontWeight: '600',
   },
});
