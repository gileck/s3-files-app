import { usePathname } from 'next/navigation';
import Link from 'next/link';
import clsx from 'clsx';

const links = [
    { name: 'Home', href: '/' },
    { name: 'Files', href: '/files' },
    { name: 'MongoDB', href: '/mongodb' }
];

export function NavLinks() {
    const pathname = usePathname();

    return (
        <nav className="flex items-center gap-4 md:gap-6">
            {links.map(link => (
                <Link
                    key={link.name}
                    href={link.href}
                    className={clsx(
                        'text-sm font-medium transition-colors hover:text-primary',
                        pathname === link.href ? 'text-primary' : 'text-muted-foreground'
                    )}
                >
                    {link.name}
                </Link>
            ))}
        </nav>
    );
} 