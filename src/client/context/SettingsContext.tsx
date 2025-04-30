import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getAllModels } from '../../server/ai';
import { clearCache as clearCacheApi } from '@/apis/settings/clearCache/client';

// Define the settings type
interface Settings {
  aiModel: string;
}

// Define the settings context type
interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
  clearCache: () => Promise<{ success: boolean; message: string }>;
}

// Create the context with default values
const SettingsContext = createContext<SettingsContextType>({
  settings: {
    aiModel: '',
  },
  updateSettings: () => {},
  clearCache: async () => ({ success: false, message: 'Context not initialized' }),
});

// Custom hook to use the settings context
export const useSettings = () => useContext(SettingsContext);

// Settings provider component
export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize settings from localStorage or with defaults
  const [settings, setSettings] = useState<Settings>(() => {
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem('appSettings');
      if (savedSettings) {
        return JSON.parse(savedSettings);
      }
    }
    
    // Default settings
    return {
      aiModel: '',
    };
  });

  // Initialize AI model if not set
  useEffect(() => {
    const initializeModel = async () => {
      if (!settings.aiModel) {
        const models = getAllModels();
        if (models.length > 0) {
          updateSettings({ aiModel: models[0].id });
        }
      }
    };
    
    initializeModel();
  }, [settings.aiModel]);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined' && settings.aiModel) {
      localStorage.setItem('appSettings', JSON.stringify(settings));
    }
  }, [settings]);

  // Update settings
  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      ...newSettings,
    }));
  };

  // Clear cache function
  const clearCache = async (): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await clearCacheApi();
      return {
        success: response.data.success,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error clearing cache:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An unknown error occurred',
      };
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, clearCache }}>
      {children}
    </SettingsContext.Provider>
  );
};
