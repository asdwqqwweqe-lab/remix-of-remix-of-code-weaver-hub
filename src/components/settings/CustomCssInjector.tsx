import { useEffect } from 'react';
import { useSettingsStore } from '@/store/settingsStore';

const STYLE_ID = 'custom-user-css';

const CustomCssInjector = () => {
  const { settings } = useSettingsStore();
  
  useEffect(() => {
    // Remove existing custom style
    const existingStyle = document.getElementById(STYLE_ID);
    if (existingStyle) {
      existingStyle.remove();
    }
    
    // Get all active CSS codes
    const activeCss = settings.customCss
      .filter(css => css.isActive)
      .map(css => `/* ${css.name} */\n${css.code}`)
      .join('\n\n');
    
    if (activeCss) {
      // Create and inject new style
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = activeCss;
      document.head.appendChild(style);
    }
    
    return () => {
      // Cleanup on unmount
      const style = document.getElementById(STYLE_ID);
      if (style) {
        style.remove();
      }
    };
  }, [settings.customCss]);
  
  return null;
};

export default CustomCssInjector;
