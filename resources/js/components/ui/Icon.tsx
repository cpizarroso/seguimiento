import type { ReactNode, SVGProps } from 'react';

export type IconName =
    | 'dashboard'
    | 'document'
    | 'people'
    | 'building'
    | 'chart'
    | 'settings'
    | 'key'
    | 'shield'
    | 'search'
    | 'plus'
    | 'download'
    | 'edit'
    | 'trash'
    | 'user'
    | 'logout'
    | 'sun'
    | 'moon'
    | 'menu'
    | 'close'
    | 'filter'
    | 'check'
    | 'warning'
    | 'info'
    | 'chevron-down'
    | 'chevron-left'
    | 'chevron-right'
    | 'arrow-up'
    | 'arrow-down'
    | 'sort'
    | 'calendar'
    | 'clock'
    | 'more'
    | 'arrow-left'
    | 'arrow-right'
    | 'external'
    | 'folder'
    | 'refresh'
    | 'save'
    | 'message';

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
    name: IconName;
    size?: number;
}

const paths: Record<IconName, ReactNode> = {
    dashboard: (
        <>
            <rect x="3" y="3" width="7" height="7" rx="1.2" />
            <rect x="14" y="3" width="7" height="7" rx="1.2" />
            <rect x="3" y="14" width="7" height="7" rx="1.2" />
            <rect x="14" y="14" width="7" height="7" rx="1.2" />
        </>
    ),
    document: (
        <>
            <path d="M6 2.75h7.5L19 8.25v13H6z" />
            <path d="M13.5 2.75v5.5H19" />
            <path d="M9 12h7M9 15.5h7M9 19h4.5" />
        </>
    ),
    people: (
        <>
            <circle cx="9" cy="8" r="3.25" />
            <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
            <path d="M16 5.2a3.2 3.2 0 0 1 0 5.6M17.5 14.2A5.5 5.5 0 0 1 21 20" />
        </>
    ),
    building: (
        <>
            <path d="M4 21V5.5A1.5 1.5 0 0 1 5.5 4h7A1.5 1.5 0 0 1 14 5.5V21" />
            <path d="M14 9h4.5A1.5 1.5 0 0 1 20 10.5V21M2.5 21h19" />
            <path d="M7 8h4M7 12h4M7 16h4M17 13h.01M17 17h.01" />
        </>
    ),
    chart: (
        <>
            <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
            <path d="M4 10l6-6 6 9 6-5" />
        </>
    ),
    settings: (
        <>
            <circle cx="12" cy="12" r="3.25" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </>
    ),
    key: (
        <>
            <circle cx="8" cy="15" r="4" />
            <path d="M11 12l9-9M17 5l2 2M14 8l2 2" />
        </>
    ),
    shield: (
        <>
            <path d="M12 3l7 3v5.2c0 4.4-3 7.8-7 9.8-4-2-7-5.4-7-9.8V6l7-3z" />
            <path d="M9 12l2 2 3.5-4" />
        </>
    ),
    search: (
        <>
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="M15.5 15.5L21 21" />
        </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    download: (
        <>
            <path d="M12 3v12M7.5 10.5L12 15l4.5-4.5" />
            <path d="M4 19.5h16" />
        </>
    ),
    edit: (
        <>
            <path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3z" />
            <path d="M13.5 5.5l5 5" />
        </>
    ),
    trash: (
        <>
            <path d="M4 7h16M9 7V4.5h6V7M6.5 7l.8 13h9.4l.8-13" />
            <path d="M10 11v5M14 11v5" />
        </>
    ),
    user: (
        <>
            <circle cx="12" cy="8" r="3.5" />
            <path d="M5 21a7 7 0 0 1 14 0" />
        </>
    ),
    logout: (
        <>
            <path d="M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5" />
            <path d="M14 8l4 4-4 4M18 12H9" />
        </>
    ),
    sun: (
        <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42" />
        </>
    ),
    moon: <path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2z" />,
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    close: <path d="M6 6l12 12M18 6L6 18" />,
    filter: <path d="M4 5h16l-6.5 7.3V20l-3-1.7v-6L4 5z" />,
    check: <path d="M4.5 12.5l5 5 10-11" />,
    warning: (
        <>
            <path d="M12 3L2.8 20h18.4L12 3z" />
            <path d="M12 9v4.5M12 17h.01" />
        </>
    ),
    info: (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 10.5V17M12 7.5h.01" />
        </>
    ),
    'chevron-down': <path d="M6 9l6 6 6-6" />,
    'chevron-left': <path d="M15 5l-7 7 7 7" />,
    'chevron-right': <path d="M9 5l7 7-7 7" />,
    'arrow-up': <path d="M12 19V5M6 11l6-6 6 6" />,
    'arrow-down': <path d="M12 5v14M6 13l6 6 6-6" />,
    sort: <path d="M8 9l4-4 4 4M8 15l4 4 4-4" />,
    calendar: (
        <>
            <rect x="3" y="5" width="18" height="16" rx="1.5" />
            <path d="M3 10h18M8 3v4M16 3v4" />
        </>
    ),
    clock: (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3.5 2" />
        </>
    ),
    more: (
        <>
            <circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" />
            <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
            <circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" />
        </>
    ),
    'arrow-left': <path d="M19 12H5M11 6l-6 6 6 6" />,
    'arrow-right': <path d="M5 12h14M13 6l6 6-6 6" />,
    external: (
        <>
            <path d="M14 4h6v6M20 4l-9 9" />
            <path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" />
        </>
    ),
    folder: <path d="M3 7a1 1 0 0 1 1-1h5l2 2h8a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7z" />,
    refresh: (
        <>
            <path d="M20 11a8 8 0 0 0-14.9-3M4 5v5h5" />
            <path d="M4 13a8 8 0 0 0 14.9 3M20 19v-5h-5" />
        </>
    ),
    save: (
        <>
            <path d="M5 3h11l3 3v15H5z" />
            <path d="M8 3v6h8V3M8 21v-7h8v7" />
        </>
    ),
    message: (
        <>
            <path d="M4 5h16v11H9l-5 4V5z" />
            <path d="M8 9h8M8 12h5" />
        </>
    ),
};

export function Icon({ name, size = 20, className = '', ...props }: IconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.7}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className={className}
            {...props}
        >
            {paths[name]}
        </svg>
    );
}
