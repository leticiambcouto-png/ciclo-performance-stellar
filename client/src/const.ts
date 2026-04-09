export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Custom auth: always redirect to the internal login page (not Manus OAuth)
export const getLoginUrl = (returnPath?: string) => {
  const base = "/login";
  if (returnPath && returnPath !== "/" && returnPath !== "/login") {
    return `${base}?redirect=${encodeURIComponent(returnPath)}`;
  }
  return base;
};
