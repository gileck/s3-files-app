import { NavItem } from './layout/types';
import HomeIcon from '@mui/icons-material/Home';
import ChatIcon from '@mui/icons-material/Chat';
import FolderIcon from '@mui/icons-material/Folder';
import SettingsIcon from '@mui/icons-material/Settings';
import InsightsIcon from '@mui/icons-material/Insights';

export const navItems: NavItem[] = [ 
    { path: '/', label: 'Home', icon: <HomeIcon /> },
    { path: '/ai-chat', label: 'AI Chat', icon: <ChatIcon /> },
    { path: '/file-manager', label: 'Files', icon: <FolderIcon /> },
    { path: '/settings', label: 'Settings', icon: <SettingsIcon /> },
  ];
  
  export const menuItems: NavItem[] = [ 
    { path: '/', label: 'Home', icon: <HomeIcon /> },
    { path: '/ai-chat', label: 'AI Chat', icon: <ChatIcon /> },
    { path: '/file-manager', label: 'Files', icon: <FolderIcon /> },
    { path: '/settings', label: 'Settings', icon: <SettingsIcon /> },
    { path: '/ai-monitoring', label: 'AI Monitoring', icon: <InsightsIcon /> },
  ];
  