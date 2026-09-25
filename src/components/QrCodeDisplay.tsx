import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import type { QRCodeData } from '@forgerock/journey-client/qr-code';

/**
 * Renders the QR code for an AM "OATH Registration" (or push-device
 * registration) step. `data` comes from `QRCode.getQRCodeData(step)` in
 * `@forgerock/journey-client/qr-code`, which pulls the `otpauth://`/
 * `pushauth://` URI out of the step's HiddenValueCallback - AM sends the URI,
 * not an image, so rendering the actual QR code is the app's responsibility.
 */
export function QrCodeDisplay({ data }: { data: QRCodeData }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !data.uri) return;
    QRCode.toCanvas(canvasRef.current, data.uri, { width: 220, margin: 1 }).catch(
      (err: Error) => setError(err.message),
    );
  }, [data.uri]);

  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
      {data.message && <p className="text-center text-sm text-slate-700">{data.message}</p>}
      {error ? (
        <p className="text-sm text-red-700">Không tạo được QR code: {error}</p>
      ) : (
        <canvas ref={canvasRef} />
      )}
      <p className="break-all text-center text-xs text-slate-400">{data.uri}</p>
    </div>
  );
}
