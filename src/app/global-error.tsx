"use client";

// Last line of defence: error.tsx cannot catch a failure in the root layout itself.
// Styles are inline because the stylesheet may be part of what failed to load.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en-GB">
      <body style={{ margin: 0, background: "#fdf6f8", color: "#4a3b42", fontFamily: "system-ui, sans-serif" }}>
        <main style={{ display: "grid", minHeight: "100dvh", placeItems: "center", padding: 24, textAlign: "center" }}>
          <div style={{ maxWidth: 460 }}>
            <h1 style={{ fontSize: 30, fontWeight: 600, margin: 0 }}>We&apos;re having a wobble</h1>
            <p style={{ marginTop: 12, lineHeight: 1.6 }}>
              Something went wrong at our end. Please try again in a moment — your basket is safe.
            </p>
            {error.digest ? <p style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>Reference: {error.digest}</p> : null}
            <div style={{ marginTop: 24, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={reset}
                style={{ borderRadius: 999, border: 0, background: "#8f7aa6", color: "#fff", padding: "12px 22px", fontWeight: 700, cursor: "pointer" }}
              >
                Try again
              </button>
              {/* A plain link on purpose: the app shell itself failed, so a full reload is what we want. */}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a
                href="/"
                style={{ borderRadius: 999, border: "1px solid #e6d7df", background: "#fff", padding: "12px 22px", fontWeight: 700, color: "inherit", textDecoration: "none" }}
              >
                Back to the shop
              </a>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
