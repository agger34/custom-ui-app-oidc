/**
 * Renders the one-time recovery codes from an AM "Recovery Code Display"
 * step. `codes`/`deviceName` come from `RecoveryCodes.getCodes(step)` /
 * `RecoveryCodes.getDeviceName(step)` in `@forgerock/journey-client/recovery-codes`,
 * which parse the codes out of the step's TextOutputCallback message.
 */
export function RecoveryCodesDisplay({
  codes,
  deviceName,
}: {
  codes: string[];
  deviceName?: string;
}) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <p className="mb-2 text-sm font-medium text-amber-900">
        Lưu lại các mã khôi phục này{deviceName ? ` cho thiết bị "${deviceName}"` : ''} — mỗi mã
        chỉ dùng được một lần, dùng khi mất quyền truy cập thiết bị xác thực.
      </p>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-sm text-amber-950">
        {codes.map((code) => (
          <li key={code}>{code}</li>
        ))}
      </ul>
    </div>
  );
}
