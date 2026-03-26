const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3015';

interface UserApiResponse<T> {
  message?: string;
  data?: T;
}

export interface UserRoleRecord {
  id: string;
  name: string;
  description: string;
  state: boolean;
  status: string;
}

export interface UserRecord {
  id: string;
  username: string;
  email: string;
  fullName: string;
  state: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
  profile: {
    id: string;
    name: string;
    lastname: string;
    secondLastname: string;
  } | null;
  role: {
    id: string;
    name: string;
  } | null;
  roles: string[];
}

export interface CreateUserPayload {
  username: string;
  password: string;
  name: string;
  lastname: string;
  secondLastname?: string;
  roleId?: string;
  state?: boolean;
}

export interface UpdateUserPayload {
  username?: string;
  password?: string;
  name?: string;
  lastname?: string;
  secondLastname?: string;
  roleId?: string;
  state?: boolean;
}

async function parseResponseBody<T>(response: Response) {
  try {
    return (await response.json()) as UserApiResponse<T>;
  } catch {
    return {};
  }
}

async function requestUserApi<T>(input: string, init?: RequestInit) {
  const response = await fetch(`${API_BASE_URL}${input}`, {
    credentials: 'include',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const body = await parseResponseBody<T>(response);

  if (!response.ok || body.data === undefined) {
    throw new Error(body.message || 'No se pudo completar la solicitud de usuarios.');
  }

  return body.data;
}

export async function getUsersRequest() {
  return requestUserApi<UserRecord[]>('/user', {
    method: 'GET',
  });
}

export async function createUserRequest(payload: CreateUserPayload) {
  return requestUserApi<UserRecord>('/user', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateUserRequest(
  userId: string,
  payload: UpdateUserPayload,
) {
  return requestUserApi<UserRecord>(`/user/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deactivateUserRequest(userId: string) {
  return requestUserApi<UserRecord>(`/user/${userId}`, {
    method: 'DELETE',
  });
}

export async function getUserRolesRequest() {
  return requestUserApi<UserRoleRecord[]>('/role', {
    method: 'GET',
  });
}
