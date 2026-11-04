import { createContext, useContext, useState, useCallback } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try {
            const savedUser = localStorage.getItem("user");
            return savedUser ? JSON.parse(savedUser) : null;
        } catch {
            localStorage.removeItem("user");
            return null;
        }
    });

    const [token, setToken] = useState(
        () => localStorage.getItem("token") || null
    );

    const login = useCallback((data) => {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        setToken(data.token);
        setUser(data.user);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        setToken(null);
        setUser(null);
    }, []);

    const updateUser = useCallback((updatedFields) => {
        const updated = { ...user, ...updatedFields };
        localStorage.setItem("user", JSON.stringify(updated));
        return updated;
    }, []);

    const value = useMemo(() => ({
        user,
        token,
        isAuthenticated: Boolean(token),
        login,
        logout,
        updateUser,
    }), [user, token, login, logout, updateUser]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used within AuthProvider");
    }

    return context;
}