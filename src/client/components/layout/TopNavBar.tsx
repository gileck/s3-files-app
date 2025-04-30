import { AppBar, Toolbar, IconButton, Box, Button } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useRouter } from '../../router';
import { NavItem } from '../../components/layout/types';

interface TopNavBarProps {
  navItems: NavItem[];
  isStandalone?: boolean;
  onDrawerToggle: () => void;
}

export const TopNavBar = ({ navItems, isStandalone, onDrawerToggle }: TopNavBarProps) => {
  const { currentPath, navigate } = useRouter();

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <AppBar
      position="sticky"
      component="nav"
      sx={{
        // Improve iOS standalone experience
        ...(isStandalone && {
          WebkitBackdropFilter: 'blur(10px)',
          backdropFilter: 'blur(10px)',
        })
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={onDrawerToggle}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>

        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
          {navItems.map((item) => (
            <Button
              key={item.path}
              sx={{
                color: '#fff',
                backgroundColor: currentPath === item.path ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                },
                mx: 0.5
              }}
              startIcon={item.icon}
              onClick={() => handleNavigation(item.path)}
            >
              {item.label}
            </Button>
          ))}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default TopNavBar;
