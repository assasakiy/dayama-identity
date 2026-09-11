import React from 'react';
import { Link, InertiaLinkProps } from '@inertiajs/react';

export interface SmartLinkProps extends Omit<InertiaLinkProps, 'href'> {
    href: string;
    external?: boolean;
}

export function SmartLink({ href, external, children, ...props }: SmartLinkProps) {
    const isExternal = external || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('//');

    if (isExternal) {
        // Exclude Inertia-specific props when rendering a standard <a> tag
        const { preserveScroll, preserveState, replace, only, headers, data, onCancel, onBefore, onStart, onProgress, onSuccess, onError, onFinish, ...htmlProps } = props as any;
        
        return (
            <a href={href} {...htmlProps}>
                {children}
            </a>
        );
    }

    return (
        <Link href={href} {...props}>
            {children}
        </Link>
    );
}
