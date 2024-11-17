import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase';

export interface Auth {
    loggedIn: boolean;
    userId: string | null; // Allow null instead of undefined
    email?: string | null; // Optional email
  }
  
  export const AuthContext = React.createContext<Auth>({
    loggedIn: false,
    email: null,
    userId: null, // Default to null
  })

export const useAuth = () => useContext(AuthContext);
