import Svg, { Path } from 'react-native-svg';
import { useLanguage } from '@/contexts/LanguageContext';
import { Colors } from '@/constants/theme';

interface BackChevronProps {
  size?: number;
  color?: string;
}

export function BackChevron({ size = 24, color = Colors.text }: BackChevronProps) {
  const { isRTL } = useLanguage();
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={isRTL ? { transform: [{ scaleX: -1 }] } : undefined}
    >
      <Path
        d="M15 18L9 12L15 6"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
