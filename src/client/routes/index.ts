import { Home } from './Home';
import { NotFound } from './NotFound';
import { AIChat } from './AIChat';
import { Settings } from './Settings';
import { FileManager } from './FileManager';
import { AIMonitoring } from './AIMonitoring';
import { MongoDb } from './MongoDb';
import { createRoutes } from '../router';

// Define routes
export const routes = createRoutes({
  '/': Home,
  '/ai-chat': AIChat,
  '/settings': Settings,
  '/file-manager': FileManager,
  '/ai-monitoring': AIMonitoring,
  '/mongodb': MongoDb,
  '/mongodb/:database': MongoDb,
  '/mongodb/:database/:collection': MongoDb,
  '/not-found': NotFound,
});
