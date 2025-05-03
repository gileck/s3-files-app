import { NavItem } from './types';
import HomeIcon from '@mui/icons-material/Home';
import ChatIcon from '@mui/icons-material/Chat';
import FolderIcon from '@mui/icons-material/Folder';
import SettingsIcon from '@mui/icons-material/Settings';
import InsightsIcon from '@mui/icons-material/Insights';
import StorageIcon from '@mui/icons-material/Storage';

export const navItems: NavItem[] = [
  { path: '/', label: 'Home', icon: <HomeIcon /> },
  { path: '/ai-chat', label: 'AI Chat', icon: <ChatIcon /> },
  { path: '/file-manager', label: 'Files', icon: <FolderIcon /> },
  { path: '/mongodb', label: 'MongoDB', icon: <StorageIcon /> },
  { path: '/settings', label: 'Settings', icon: <SettingsIcon /> },
];

export const menuItems: NavItem[] = [
  { path: '/', label: 'Home', icon: <HomeIcon /> },
  { path: '/ai-chat', label: 'AI Chat', icon: <ChatIcon /> },
  { path: '/file-manager', label: 'Files', icon: <FolderIcon /> },
  { path: '/mongodb', label: 'MongoDB', icon: <StorageIcon /> },
  { path: '/settings', label: 'Settings', icon: <SettingsIcon /> },
  { path: '/ai-monitoring', label: 'AI Monitoring', icon: <InsightsIcon /> },
];
