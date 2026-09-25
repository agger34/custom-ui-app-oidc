import { useState } from 'react';
import {
  callbackType,
  NameCallback,
  PasswordCallback,
  ChoiceCallback,
  TextOutputCallback,
  HiddenValueCallback,
  ReCaptchaCallback,
  ReCaptchaEnterpriseCallback,
} from '@forgerock/journey-client';
import type { BaseCallback } from '@forgerock/journey-client';
import { RecaptchaField, RecaptchaEnterpriseField } from './RecaptchaField';

interface CallbackFieldProps {
  callback: BaseCallback;
  autoFocus?: boolean;
}

const inputClasses =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm ' +
  'focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200';

/**
 * Renders one AM authentication-tree callback as a form field.
 *
 * Covers the callback types needed by a simple username/password tree
 * (NameCallback, PasswordCallback) plus ChoiceCallback, TextOutputCallback,
 * and reCAPTCHA (classic + Enterprise). Extend this switch to support
 * additional callback types (WebAuthn, social IdP, etc.) as your tree design
 * requires them.
 */
export function CallbackField({ callback, autoFocus }: CallbackFieldProps) {
  const [, forceRender] = useState(0);

  if (callback instanceof NameCallback) {
    return (
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">
          {callback.getPrompt() || 'Tên đăng nhập'}
        </span>
        <input
          type="text"
          autoFocus={autoFocus}
          autoComplete="username"
          className={inputClasses}
          onChange={(e) => callback.setName(e.target.value)}
        />
      </label>
    );
  }

  if (callback instanceof PasswordCallback) {
    return (
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">
          {callback.getPrompt() || 'Mật khẩu'}
        </span>
        <input
          type="password"
          autoComplete="current-password"
          className={inputClasses}
          onChange={(e) => callback.setPassword(e.target.value)}
        />
      </label>
    );
  }

  if (callback instanceof ChoiceCallback) {
    const choices = callback.getChoices();
    return (
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">
          {callback.getPrompt() || 'Lựa chọn'}
        </span>
        <select
          className={inputClasses}
          defaultValue={callback.getDefaultChoice()}
          onChange={(e) => {
            callback.setChoiceIndex(Number(e.target.value));
            forceRender((n) => n + 1);
          }}
        >
          {choices.map((choice, idx) => (
            <option key={choice} value={idx}>
              {choice}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (callback instanceof TextOutputCallback) {
    return <p className="text-sm text-slate-600">{callback.getMessage()}</p>;
  }

  if (callback instanceof ReCaptchaCallback) {
    return <RecaptchaField callback={callback} />;
  }

  if (callback instanceof ReCaptchaEnterpriseCallback) {
    return <RecaptchaEnterpriseField callback={callback} />;
  }

  if (callback instanceof HiddenValueCallback) {
    // Pass-through callback (e.g. device profile token, WebAuthn payload).
    // Nothing to render; the tree step that produced it is responsible for
    // populating its value before `next()` is called.
    return null;
  }

  // Generic fallback for callback types this renderer does not yet implement
  // (e.g. WebAuthn, SelectIdP, KBA). Wire these up explicitly if your tree
  // uses them.
  return (
    <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
      Loại callback chưa được hỗ trợ trong UI này: {callback.getType()}
    </p>
  );
}

// Re-exported so callers can gate rendering on supported types if desired.
export const SUPPORTED_CALLBACK_TYPES = [
  callbackType.NameCallback,
  callbackType.PasswordCallback,
  callbackType.ChoiceCallback,
  callbackType.TextOutputCallback,
  callbackType.HiddenValueCallback,
  callbackType.ReCaptchaCallback,
  callbackType.ReCaptchaEnterpriseCallback,
];
