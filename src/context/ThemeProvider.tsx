import React, {createContext, useCallback, useEffect, useMemo, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeName = 'light' | 'dark';

type ThemeContextValue = {
    theme: ThemeName;
    toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextValue>({
    theme: 'light',
    toggleTheme: () => {},
});

const THEME_KEY = 'theme-preference';

export const ThemeProvider: React.FC<React.PropsWithChildren> = ({children}) => {
    const [theme, setTheme] = useState<ThemeName>('light');

    useEffect(() => {
        (async () => {
            try {
                const saved = await AsyncStorage.getItem(THEME_KEY);
                if(saved === 'light' || saved === 'dark') setTheme(saved);
            } catch {}
        })();
    }, []);

    const toggleTheme = useCallback(() => {
        setTheme(prev => {
            const next = prev === 'light' ? 'dark' : 'light';
            AsyncStorage.setItem(THEME_KEY, next).catch(() => {});
            return next;
        });
    }, []);

    const value = useMemo(() => ({theme, toggleTheme}), [theme, toggleTheme]);

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}