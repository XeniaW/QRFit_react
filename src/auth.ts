import React, { useContext } from 'react';

export interface Auth {
  loggedIn: boolean;
  userId: string | null; // Allow null instead of undefined
  email?: string | null; // Optional email
}

export const AuthContext = React.createContext<Auth>({
  loggedIn: false,
  email: null,
  userId: null, // Default to null
});

export const useAuth = () => useContext(AuthContext);
