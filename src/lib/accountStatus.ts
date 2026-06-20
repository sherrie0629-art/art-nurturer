export const ACCOUNT_SUSPENDED_MESSAGE = "你的账号已被暂停使用，如有疑问请联系管理员。";

export function isAccountSuspendedPayload(payload: unknown): boolean {
  if (!payload || typeof payload !== "object") return false;
  return (payload as { error?: string }).error === "account_suspended";
}

export function messageFromApiError(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object") {
    const msg = (payload as { message?: string }).message;
    if (msg) return msg;
    const err = (payload as { error?: string }).error;
    if (err === "account_suspended") return ACCOUNT_SUSPENDED_MESSAGE;
  }
  return fallback;
}
