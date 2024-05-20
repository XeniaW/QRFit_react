import React, { useContext } from "react";


interface Auth {
    loggedIn: boolean;
    userId?: string;
}
export const AuthContext = React.createContext({loggedIn: false });

export function useAuth() {
    return useContext(AuthContext);
}