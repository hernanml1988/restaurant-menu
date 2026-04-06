function decodeQrValue(rawValue: string) {
  let decodedValue = rawValue;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const nextValue = decodeURIComponent(decodedValue);

      if (nextValue === decodedValue) {
        break;
      }

      decodedValue = nextValue;
    } catch {
      break;
    }
  }

  return decodedValue.trim();
}

export function extractTableQrToken(qrValue?: string | null) {
  const normalizedValue = qrValue?.trim();

  if (!normalizedValue) {
    return null;
  }

  const decodedValue = decodeQrValue(normalizedValue);

  try {
    const parsedUrl = new URL(normalizedValue);
    const qrToken = parsedUrl.searchParams.get('qr')?.trim();

    if (qrToken) {
      return decodeQrValue(qrToken);
    }

    if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
      return null;
    }

    return decodedValue;
  } catch {
    return decodedValue;
  }
}

export function matchesTableQrValue(
  storedQrCode: string,
  candidateQrValue?: string | null,
) {
  const normalizedCandidate = candidateQrValue?.trim();

  if (!normalizedCandidate) {
    return false;
  }

  if (storedQrCode === normalizedCandidate) {
    return true;
  }

  const storedToken = extractTableQrToken(storedQrCode);
  const candidateToken = extractTableQrToken(normalizedCandidate);

  return Boolean(
    storedToken &&
      candidateToken &&
      storedToken === candidateToken,
  );
}
