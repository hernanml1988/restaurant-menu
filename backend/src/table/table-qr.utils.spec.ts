import { extractTableQrToken, matchesTableQrValue } from './table-qr.utils';

describe('table-qr.utils', () => {
  it('extracts the QR token from a public URL', () => {
    expect(
      extractTableQrToken(
        'http://localhost:8080/cliente/bienvenida?qr=table%3Arest-1%3A12%3Amesa-12%3Auuid-1',
      ),
    ).toBe('table:rest-1:12:mesa-12:uuid-1');
  });

  it('matches when the candidate QR token arrives double encoded', () => {
    const storedQrCode =
      'http://localhost:8080/cliente/bienvenida?qr=table%3Arest-1%3A12%3Amesa-12%3Auuid-1';
    const doubleEncodedToken =
      'table%253Arest-1%253A12%253Amesa-12%253Auuid-1';

    expect(matchesTableQrValue(storedQrCode, doubleEncodedToken)).toBe(true);
  });

  it('extracts the raw token when the QR arrives as table URI text', () => {
    expect(
      extractTableQrToken(
        'table:c8a5bcf5-7b89-4ee0-94cc-49b9165f7f0b:2:mesa-2:d349f346-6f76-491b-a522-cd8d4d227c7b',
      ),
    ).toBe(
      'table:c8a5bcf5-7b89-4ee0-94cc-49b9165f7f0b:2:mesa-2:d349f346-6f76-491b-a522-cd8d4d227c7b',
    );
  });
});
