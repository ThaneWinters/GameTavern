import { useEffect, useRef, useCallback, forwardRef } from "react";

const TURNSTILE_SITE_KEY = "0x4AAAAAACMX7o8e260x6gzV";

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          size?: "normal" | "compact";
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export const TurnstileWidget = forwardRef<HTMLDivElement, TurnstileWidgetProps>(
  function TurnstileWidget({ onVerify, onExpire, onError }, _ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const renderAttemptedRef = useRef(false);

    const renderWidget = useCallback(() => {
      if (!containerRef.current || !window.turnstile) return;
      
      // Prevent double render
      if (widgetIdRef.current) {
        return;
      }

      // Mark that we've attempted to render
      renderAttemptedRef.current = true;

      try {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          callback: onVerify,
          "expired-callback": onExpire,
          "error-callback": onError,
          theme: "auto",
          size: "normal",
        });
        console.log("Turnstile widget rendered:", widgetIdRef.current);
      } catch (err) {
        console.error("Turnstile render error:", err);
      }
    }, [onVerify, onExpire, onError]);

    useEffect(() => {
      // Reset render state on mount
      renderAttemptedRef.current = false;

      const attemptRender = () => {
        if (window.turnstile && containerRef.current && !widgetIdRef.current) {
          renderWidget();
        }
      };

      // Check if script already loaded
      if (window.turnstile) {
        // Small delay to ensure container is in DOM
        setTimeout(attemptRender, 50);
        return;
      }

      // Check if script is already in DOM but not loaded yet
      const existingScript = document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]');
      if (existingScript) {
        const checkInterval = setInterval(() => {
          if (window.turnstile) {
            clearInterval(checkInterval);
            attemptRender();
          }
        }, 100);
        
        // Cleanup interval after 10 seconds
        const timeout = setTimeout(() => clearInterval(checkInterval), 10000);
        
        return () => {
          clearInterval(checkInterval);
          clearTimeout(timeout);
          if (widgetIdRef.current && window.turnstile) {
            try {
              window.turnstile.remove(widgetIdRef.current);
            } catch (e) {
              // Ignore removal errors
            }
            widgetIdRef.current = null;
          }
        };
      }

      // Load Turnstile script
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      
      script.onload = () => {
        console.log("Turnstile script loaded");
        // Give time for turnstile to initialize
        setTimeout(attemptRender, 100);
      };

      script.onerror = () => {
        console.error("Failed to load Turnstile script");
      };

      document.head.appendChild(script);

      return () => {
        if (widgetIdRef.current && window.turnstile) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch (e) {
            // Ignore removal errors
          }
          widgetIdRef.current = null;
        }
      };
    }, [renderWidget]);

    return (
      <div 
        ref={containerRef} 
        className="flex justify-center min-h-[65px]"
        data-turnstile-container="true"
      />
    );
  }
);
