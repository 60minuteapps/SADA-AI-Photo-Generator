export const theme = {
  colors: {
    primary: '#0d1b2a',
    background: '#0d1b2a',
    text: '#e0e1dd',
    textSecondary: '#a8a8a8',
    card: '#1a2332',
    border: '#2a3441',
    accent: '#4a90e2',
    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336',
    white: '#ffffff',
    overlay: 'rgba(13, 27, 42, 0.9)',
  },
  fonts: {
    regular: 'Helvetica',
    medium: 'Helvetica-Medium',
    bold: 'Helvetica-Bold',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },
  touchTarget: {
    minHeight: 44,
    minWidth: 44,
  },
} as const;

export const globalStyles = {
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginVertical: theme.spacing.sm,
  },
  button: {
    minHeight: theme.touchTarget.minHeight,
    borderRadius: theme.borderRadius.sm,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: theme.spacing.lg,
  },
  buttonText: {
    fontFamily: theme.fonts.medium,
    fontSize: 16,
    color: theme.colors.white,
  },
  title: {
    fontFamily: theme.fonts.bold,
    fontSize: 24,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  subtitle: {
    fontFamily: theme.fonts.medium,
    fontSize: 18,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  body: {
    fontFamily: theme.fonts.regular,
    fontSize: 16,
    color: theme.colors.text,
    lineHeight: 24,
  },
  caption: {
    fontFamily: theme.fonts.regular,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
};
