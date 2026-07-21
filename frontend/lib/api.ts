// Thin client for the backend API. All requests send cookies so the HttpOnly
// session token is included automatically.

export interface User {
  id: number;
  email: string;
}

export interface FieldSpec {
  key: string;
  label: string;
  description: string;
}

export interface DocumentType {
  id: string;
  name: string;
  description: string;
  fields: FieldSpec[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface FieldValue {
  key: string;
  value: string;
}

export interface ChatResult {
  reply: string;
  documentType: string;
  fields: FieldValue[];
  complete: boolean;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      detail = (await res.json()).detail ?? detail;
    } catch {
      // response had no JSON body; keep the status text
    }
    throw new ApiError(res.status, detail);
  }
  return res.json();
}

const body = (data: unknown) => JSON.stringify(data);

export const api = {
  me: () => request<User>("/api/auth/me"),
  signup: (email: string, password: string) =>
    request<User>("/api/auth/signup", { method: "POST", body: body({ email, password }) }),
  signin: (email: string, password: string) =>
    request<User>("/api/auth/signin", { method: "POST", body: body({ email, password }) }),
  signout: () => request<{ detail: string }>("/api/auth/signout", { method: "POST" }),
  catalog: () => request<DocumentType[]>("/api/catalog"),
  greeting: () => request<{ message: string }>("/api/chat/greeting"),
  chat: (messages: ChatMessage[], documentType: string, fields: FieldValue[]) =>
    request<ChatResult>("/api/chat/message", {
      method: "POST",
      body: body({ messages, documentType, fields }),
    }),
};

// Fields travel over the wire as a list; the UI works with a plain map.
export const fieldsToMap = (fields: FieldValue[]): Record<string, string> =>
  Object.fromEntries(fields.map((f) => [f.key, f.value]));

export const mapToFields = (map: Record<string, string>): FieldValue[] =>
  Object.entries(map).map(([key, value]) => ({ key, value }));
