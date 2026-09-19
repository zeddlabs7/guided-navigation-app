import { Text, I18nManager } from 'react-native';

const originalRender = (Text as any).render;

if (originalRender) {
  (Text as any).render = function (props: any, ref: any) {
    if (I18nManager.isRTL) {
      return originalRender.call(this, {
        ...props,
        style: [{ writingDirection: 'rtl' as const, textAlign: 'left' as const }, props.style],
      }, ref);
    }
    return originalRender.call(this, props, ref);
  };
}
