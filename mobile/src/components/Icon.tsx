import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ComponentProps } from 'react';

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

type Props = {
  name: IconName;
  size?: number;
  color: string;
};

export function Icon({ name, size = 20, color }: Props) {
  return <MaterialCommunityIcons name={name} size={size} color={color} />;
}
