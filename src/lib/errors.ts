/**
 * Next signals redirect(), notFound() and dynamic-rendering bailouts by *throwing*.
 * A fallback that swallows those would break navigation and auth redirects, so every
 * `.catch()` around a data read has to let them through.
 */
export function isFrameworkError(error: unknown) {
  if (typeof error !== "object" || error === null) return false;
  if ((error as { $$typeof?: symbol }).$$typeof === Symbol.for("react.postpone")) return true;
  const digest = (error as { digest?: unknown }).digest;
  return typeof digest === "string" && (digest.startsWith("NEXT_") || digest === "DYNAMIC_SERVER_USAGE");
}

/**
 * Use as `.catch(fallback(value, "[where]"))` for data a page can live without:
 * logs the failure, keeps the page up, and never hides a framework signal.
 */
export function fallback<T>(value: T, label: string) {
  return (error: unknown): T => {
    if (isFrameworkError(error)) throw error;
    console.error(label, error);
    return value;
  };
}
