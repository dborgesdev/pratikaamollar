import { useEffect, useLayoutEffect, useRef, useState } from "react";
interface Props {
  pending: boolean;
  error: string;
  retry: () => void;
}
export default function LoadingOverlay({ pending, error, retry }: Props) {
  const [visible, setVisible] = useState(true);
  const [timeoutError, setTimeoutError] = useState("");
  const message = error || timeoutError;
  const panel = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    document.getElementById("boot-screen")?.remove();
  }, []);
  useEffect(() => {
    if (!pending || error) return;
    const timer = setTimeout(
      () =>
        setTimeoutError(
          "A loja demorou para iniciar. Recarregue para tentar novamente.",
        ),
      22000,
    );
    return () => clearTimeout(timer);
  }, [pending, error]);
  useEffect(() => {
    if (message)
      (panel.current?.querySelector("button") as HTMLElement | null)?.focus();
  }, [message]);
  useEffect(() => {
    if (pending || message) return;
    const timer = setTimeout(
      () => setVisible(false),
      matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 420,
    );
    return () => clearTimeout(timer);
  }, [pending, message]);
  useEffect(() => {
    if (!visible) return;
    const previous = document.activeElement as HTMLElement | null;
    const shell = document.getElementById("application-shell");
    shell?.setAttribute("inert", "");
    shell?.setAttribute("aria-hidden", "true");
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    return () => {
      shell?.removeAttribute("inert");
      shell?.removeAttribute("aria-hidden");
      document.body.style.overflow = overflow;
      if (previous?.isConnected && previous !== document.body) previous.focus();
      else {
        const main = document.getElementById("content");
        main?.setAttribute("tabindex", "-1");
        main?.focus({ preventScroll: true });
      }
    };
  }, [visible]);
  if (!visible) return null;
  return (
    <div
      ref={panel}
      tabIndex={-1}
      onKeyDown={(event) => {
        if (event.key === "Tab") {
          event.preventDefault();
          (
            panel.current?.querySelector("button") as HTMLElement | null
          )?.focus();
        }
      }}
      className={
        "brand-loading " + (!pending && !message ? "brand-loading-ready" : "")
      }
      role="dialog"
      aria-modal="true"
      aria-label="Carregamento da loja Pratika Amollar"
    >
      <div className="brand-loading-inner">
        <div
          className={
            "brand-loading-logo " + (message ? "brand-loading-paused" : "")
          }
        >
          <img
            src="/brand/logo-pratika-amollar.png"
            width="742"
            height="318"
            alt="Pratika Amollar"
          />
          <img
            className="brand-loading-light"
            src="/brand/logo-pratika-amollar.png"
            width="742"
            height="318"
            alt=""
            aria-hidden="true"
          />
        </div>
        <p role={message ? "alert" : "status"}>
          {message ||
            (pending
              ? "Carregando o catálogo de produtos..."
              : "Tudo pronto para a sua bancada.")}
        </p>
        {message && (
          <button
            className="button"
            onClick={() => {
              if (timeoutError) window.location.reload();
              else retry();
            }}
          >
            Tentar novamente
          </button>
        )}
      </div>
    </div>
  );
}
