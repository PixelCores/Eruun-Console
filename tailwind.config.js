/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                text: {
                    primary: 'var(--color-text-primary)',
                    secondary: 'var(--color-text-secondary)',
                    tertiary: 'var(--color-text-tertiary)',
                    quaternary: 'var(--color-text-quaternary)',
                    placeholder: 'var(--color-text-placeholder)',
                    disabled: 'var(--color-text-disabled)',
                },
                background: {
                    body: 'var(--color-background-body)',
                    default: 'var(--color-background-default)',
                    surface: {
                        white: 'var(--color-background-surface-white)',
                    },
                    neutral: {
                        subtle: 'var(--color-background-neutral-subtle)',
                    },
                },
                state: {
                    base: {
                        hover: 'var(--color-state-base-hover)',
                    },
                    accent: {
                        hover: 'var(--color-state-accent-hover)',
                        solid: 'var(--color-state-accent-solid)',
                    },
                },
                components: {
                    button: {
                        primary: {
                            bg: 'var(--color-components-button-primary-bg)',
                            'bg-hover': 'var(--color-components-button-primary-bg-hover)',
                            'bg-disabled': 'var(--color-components-button-primary-bg-disabled)',
                            border: 'var(--color-components-button-primary-border)',
                            'border-hover': 'var(--color-components-button-primary-border-hover)',
                            'border-disabled': 'var(--color-components-button-primary-border-disabled)',
                            text: 'var(--color-components-button-primary-text)',
                            'text-disabled': 'var(--color-components-button-primary-text-disabled)',
                        },
                        secondary: {
                            bg: 'var(--color-components-button-secondary-bg)',
                            'bg-hover': 'var(--color-components-button-secondary-bg-hover)',
                            'bg-disabled': 'var(--color-components-button-secondary-bg-disabled)',
                            border: 'var(--color-components-button-secondary-border)',
                            'border-hover': 'var(--color-components-button-secondary-border-hover)',
                            'border-disabled': 'var(--color-components-button-secondary-border-disabled)',
                            text: 'var(--color-components-button-secondary-text)',
                            'text-disabled': 'var(--color-components-button-secondary-text-disabled)',
                            'accent-text': 'var(--color-components-button-secondary-accent-text)',
                            'accent-text-disabled': 'var(--color-components-button-secondary-accent-text-disabled)',
                        },
                        tertiary: {
                            bg: 'var(--color-components-button-tertiary-bg)',
                            'bg-hover': 'var(--color-components-button-tertiary-bg-hover)',
                            text: 'var(--color-components-button-tertiary-text)',
                            'text-disabled': 'var(--color-components-button-tertiary-text-disabled)',
                        },
                        ghost: {
                            'bg-hover': 'var(--color-components-button-ghost-bg-hover)',
                            text: 'var(--color-components-button-ghost-text)',
                            'text-disabled': 'var(--color-components-button-ghost-text-disabled)',
                            'accent-text': 'var(--color-components-button-ghost-accent-text)',
                            'accent-text-disabled': 'var(--color-components-button-ghost-accent-text-disabled)',
                        },
                        warning: {
                            text: 'var(--color-components-button-warning-text)',
                            border: 'var(--color-components-button-warning-border)',
                            'bg-hover': 'var(--color-components-button-warning-bg-hover)',
                        },
                        destructive: {
                            bg: 'var(--color-components-button-destructive-bg)',
                            'bg-hover': 'var(--color-components-button-destructive-bg-hover)',
                            text: 'var(--color-components-button-destructive-text)',
                        },
                    },
                    panel: {
                        bg: 'var(--color-components-panel-bg)',
                        'bg-blur': 'var(--color-components-panel-bg-blur)',
                        border: 'var(--color-components-panel-border)',
                        'border-subtle': 'var(--color-components-panel-border-subtle)',
                    },
                },
                border: {
                    'divider-subtle': 'var(--color-divider-subtle)',
                    'divider-regular': 'var(--color-divider-regular)',
                },
            },
            boxShadow: {
                xs: 'var(--color-shadow-shadow-1)',
                sm: 'var(--color-shadow-shadow-2)',
                md: 'var(--color-shadow-shadow-3)',
                lg: 'var(--color-shadow-shadow-6)',
            },
            backdropBlur: {
                xs: 'blur(5px)',
                sm: 'blur(8px)',
            },
        },
    },
    plugins: [],
}
