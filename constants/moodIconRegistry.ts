import type { SvgProps } from 'react-native-svg';
import type { FC } from 'react';

import CalmIcon from '@/assets/moods/calm.svg';
import DarkIcon from '@/assets/moods/dark.svg';
import EmotionalIcon from '@/assets/moods/emotional.svg';
import FunnyIcon from '@/assets/moods/funny.svg';
import HappyIcon from '@/assets/moods/happy.svg';
import InspirationalIcon from '@/assets/moods/inspirational.svg';
import NostalgicIcon from '@/assets/moods/nostalgic.svg';
import RomanticIcon from '@/assets/moods/romantic.svg';
import ScaryIcon from '@/assets/moods/scary.svg';
import SuspensefulIcon from '@/assets/moods/suspenseful.svg';

import BroodingIcon from '@/assets/moods/mood_attributes/brooding.svg';
import CheerfulIcon from '@/assets/moods/mood_attributes/cheerful.svg';
import ChillingIcon from '@/assets/moods/mood_attributes/chilling.svg';
import DeepIcon from '@/assets/moods/mood_attributes/deep.svg';
import EmpoweringIcon from '@/assets/moods/mood_attributes/empowering.svg';
import FearfulIcon from '@/assets/moods/mood_attributes/fearful.svg';
import FeelGoodIcon from '@/assets/moods/mood_attributes/feel-good.svg';
import GrippingIcon from '@/assets/moods/mood_attributes/gripping.svg';
import HauntedIcon from '@/assets/moods/mood_attributes/haunted.svg';
import HeartfeltIcon from '@/assets/moods/mood_attributes/heartfelt.svg';
import HopefulIcon from '@/assets/moods/mood_attributes/hopeful.svg';
import IntenseIcon from '@/assets/moods/mood_attributes/intense.svg';
import LightIcon from '@/assets/moods/mood_attributes/light.svg';
import LovingIcon from '@/assets/moods/mood_attributes/loving.svg';
import MemoryFilledIcon from '@/assets/moods/mood_attributes/memory-filled.svg';
import MindfulIcon from '@/assets/moods/mood_attributes/mindful.svg';
import MotivatingIcon from '@/assets/moods/mood_attributes/motivating.svg';
import MovingIcon from '@/assets/moods/mood_attributes/moving.svg';
import MysteriousIcon from '@/assets/moods/mood_attributes/mysterious.svg';
import PassionateIcon from '@/assets/moods/mood_attributes/passionate.svg';
import PlayfulIcon from '@/assets/moods/mood_attributes/playful.svg';
import RelaxingIcon from '@/assets/moods/mood_attributes/relaxing.svg';
import RetroIcon from '@/assets/moods/mood_attributes/retro.svg';
import SoftIcon from '@/assets/moods/mood_attributes/soft.svg';
import TenseIcon from '@/assets/moods/mood_attributes/tense.svg';
import UpliftingIcon from '@/assets/moods/mood_attributes/uplifting.svg';
import WarmIcon from '@/assets/moods/mood_attributes/warm.svg';
import WittyIcon from '@/assets/moods/mood_attributes/witty.svg';

import CalmDescriptionIcon from '@/assets/descriptions/calm.svg';
import DarkDescriptionIcon from '@/assets/descriptions/dark.svg';
import EmotionalDescriptionIcon from '@/assets/descriptions/emotional.svg';
import FunnyDescriptionIcon from '@/assets/descriptions/funny.svg';
import HappyDescriptionIcon from '@/assets/descriptions/happy.svg';
import InspirationalDescriptionIcon from '@/assets/descriptions/inspirational.svg';
import NostalgicDescriptionIcon from '@/assets/descriptions/nostalgic.svg';
import RomanticDescriptionIcon from '@/assets/descriptions/romantic.svg';
import ScaryDescriptionIcon from '@/assets/descriptions/scary.svg';
import SuspensefulDescriptionIcon from '@/assets/descriptions/suspenseful.svg';

export type MoodSvgComponent = FC<SvgProps>;

export const MOOD_ICON_REGISTRY: Record<string, MoodSvgComponent> = {
   calm: CalmIcon,
   dark: DarkIcon,
   emotional: EmotionalIcon,
   funny: FunnyIcon,
   happy: HappyIcon,
   inspirational: InspirationalIcon,
   nostalgic: NostalgicIcon,
   romantic: RomanticIcon,
   scary: ScaryIcon,
   suspenseful: SuspensefulIcon,
};

export const MOOD_ATTRIBUTE_ICON_REGISTRY: Record<string, MoodSvgComponent> = {
   brooding: BroodingIcon,
   cheerful: CheerfulIcon,
   chilling: ChillingIcon,
   deep: DeepIcon,
   empowering: EmpoweringIcon,
   fearful: FearfulIcon,
   'feel-good': FeelGoodIcon,
   gripping: GrippingIcon,
   haunted: HauntedIcon,
   heartfelt: HeartfeltIcon,
   hopeful: HopefulIcon,
   intense: IntenseIcon,
   light: LightIcon,
   loving: LovingIcon,
   'memory-filled': MemoryFilledIcon,
   mindful: MindfulIcon,
   motivating: MotivatingIcon,
   moving: MovingIcon,
   mysterious: MysteriousIcon,
   passionate: PassionateIcon,
   playful: PlayfulIcon,
   relaxing: RelaxingIcon,
   retro: RetroIcon,
   soft: SoftIcon,
   tense: TenseIcon,
   uplifting: UpliftingIcon,
   warm: WarmIcon,
   witty: WittyIcon,
};

export const MOOD_DESCRIPTION_ICON_REGISTRY: Record<string, MoodSvgComponent> = {
   calm: CalmDescriptionIcon,
   dark: DarkDescriptionIcon,
   emotional: EmotionalDescriptionIcon,
   funny: FunnyDescriptionIcon,
   happy: HappyDescriptionIcon,
   inspirational: InspirationalDescriptionIcon,
   nostalgic: NostalgicDescriptionIcon,
   romantic: RomanticDescriptionIcon,
   scary: ScaryDescriptionIcon,
   suspenseful: SuspensefulDescriptionIcon,
};
