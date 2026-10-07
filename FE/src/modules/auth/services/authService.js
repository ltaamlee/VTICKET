import { apiRequest } from "../../../services/api";

export function login(email, password) {
  return apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
    }),
  });
}

