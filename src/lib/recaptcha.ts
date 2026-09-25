declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      render: (container: HTMLElement, params: Record<string, unknown>) => number;
      reset: (widgetId?: number) => void;
      enterprise?: {
        ready: (callback: () => void) => void;
        render: (container: HTMLElement, params: Record<string, unknown>) => number;
        reset: (widgetId?: number) => void;
      };
    };
  }
}

const loadedScripts = new Map<string, Promise<void>>();

/** Loads a `<script>` tag once per `src`, reusing the same promise for concurrent callers. */
export function loadScriptOnce(src: string): Promise<void> {
  const existing = loadedScripts.get(src);
  if (existing) return existing;

  const promise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Không tải được script: ${src}`));
    document.head.appendChild(script);
  });

  loadedScripts.set(src, promise);
  return promise;
}
