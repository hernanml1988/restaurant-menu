const SESSION_RESET_PATTERNS = [
  'la sesion ya no esta disponible para esta mesa',
  'dining session not found',
];

export function isClientSessionResetError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const normalizedMessage = error.message.trim().toLowerCase();
  return SESSION_RESET_PATTERNS.some((pattern) =>
    normalizedMessage.includes(pattern),
  );
}

export function buildClientWelcomePath(qrCode?: string | null) {
  const normalizedQrCode = qrCode?.trim();
  if (!normalizedQrCode) {
    return '/cliente/bienvenida';
  }

  return `/cliente/bienvenida?qr=${encodeURIComponent(normalizedQrCode)}`;
}
