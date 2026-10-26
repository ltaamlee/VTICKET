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

export function register({ fullName, email, password, confirmPassword }) {
    return apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({
            fullName,
            email,
            password,
            confirmPassword,
        }),
    });
}

export function forgotPassword(email) {
    return apiRequest("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({
            email,
        }),
    });
}

export function resetPassword({ email, otp, password, confirmPassword }) {
    return apiRequest("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
            email,
            otp,
            password,
            confirmPassword,
        }),
    });
}

export function verifyOtp(email, otp) {
    return apiRequest("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({
            email,
            otp,
        }),
    });
}

export function resendOtp(email) {
    return apiRequest("/auth/resend-otp", {
        method: "POST",
        body: JSON.stringify({
            email,
        }),
    });
}

export function googleLogin(credential) {
    return apiRequest("/auth/google-login", {
        method: "POST",
        body: JSON.stringify({ credential }),
    });
}