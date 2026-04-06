const staticOrigins = [
  'http://localhost:8080',
  'http://localhost:8084',
  'http://localhost:5173',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:5173',
  'https://externothinkti.cl',
  'https://apizonaportatilpreprod.externothinkti.cl',
  'https://zonaportatil.ideainmotion.cl',
  'https://api-mercpago.ideainmotion.cl',
  'https://reparto.ideainmotion.cl',
];

const ngrokPatterns = [
  /^https:\/\/[a-z0-9-]+\.ngrok-free\.app$/i,
  /^https:\/\/[a-z0-9-]+\.ngrok\.app$/i,
  /^https:\/\/[a-z0-9-]+\.ngrok-free\.dev$/i,
];

function normalizeOrigin(value?: string) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

const dynamicOrigins = [
  normalizeOrigin(process.env.FRONTEND_PUBLIC_URL),
  ...(process.env.CORS_EXTRA_ORIGINS?.split(',').map((origin) =>
    normalizeOrigin(origin.trim()),
  ) ?? []),
].filter((origin): origin is string => Boolean(origin));

const allowedOrigins = new Set([...staticOrigins, ...dynamicOrigins]);

export const originAccept = (
  origin: string | undefined,
  callback: (error: Error | null, allow?: boolean) => void,
) => {
  if (!origin) {
    callback(null, true);
    return;
  }

  if (allowedOrigins.has(origin)) {
    callback(null, true);
    return;
  }

  const matchesNgrok = ngrokPatterns.some((pattern) => pattern.test(origin));

  if (matchesNgrok) {
    callback(null, true);
    return;
  }

  callback(new Error(`Origin not allowed by CORS: ${origin}`));
};
