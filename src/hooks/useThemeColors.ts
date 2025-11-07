import {useContext} from 'react';
import {ThemeContext} from '../context/ThemeProvider';

type ThemeColors = {
    background: string;
    card: string;
    border: string;
    text: string;
    placeholder: string;
    headerBg: string;
    headerText: string;
    modalBg: string;
    primary: string;
}

export const useThemeColors = (): {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    colors: ThemeColors;
} => {
    const {theme, toggleTheme} = useContext(ThemeContext);

    const palettes : Record<'light' | 'dark', ThemeColors> = {
        light: {
            background: '#F8F9FA',
            card: '#FFFFFF',
            border: '#E5E5E5',
            text: '#62748E',
            placeholder: '#71717B',
            headerBg: '#FFFFFF',
            headerText: '#111111',
            modalBg: 'rgba(0,0,0,0.5)',
            primary: '#1E90FF',
        },
        dark: {
            background: '#121212',
            card: '#1E1E1E',
            border: '#333333',
            text: '#FFFFFF',
            placeholder: '#F5F5F5',
            headerBg: '#1E90FF',
            headerText: '#FFFFFF',
            modalBg: 'rgba(0,0,0,0.7)',
            primary: '#1E90FF',
        }
    }

    const colors = palettes[theme];
    return {theme, toggleTheme, colors};
};