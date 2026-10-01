import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  User, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { auth } from "../firebase/config";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  accessToken: string | null;
  signInWithGoogle: () => Promise<User>;
  connectGoogleClassroom: () => Promise<string>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define classroom and gmail scopes
const CLASSROOM_SCOPES = [
  "https://www.googleapis.com/auth/classroom.courses.readonly",
  "https://www.googleapis.com/auth/classroom.coursework.me.readonly",
  "https://www.googleapis.com/auth/gmail.readonly"
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(() => {
    return localStorage.getItem("kku_lifeos_google_access_token");
  });
  const [loading, setLoading] = useState(true);

  const setAccessToken = (token: string | null) => {
    setAccessTokenState(token);
    if (token) {
      localStorage.setItem("kku_lifeos_google_access_token", token);
    } else {
      localStorage.removeItem("kku_lifeos_google_access_token");
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      
      // If user signs out, clear cached token
      if (!currentUser) {
        setAccessToken(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    // Add classroom scopes by default so they might get authenticated in one go
    CLASSROOM_SCOPES.forEach(scope => provider.addScope(scope));
    
    // Force select account so user can easily switch profiles if needed
    provider.setCustomParameters({
      prompt: "select_account"
    });
    
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, provider);
      
      // Cache Google Auth access token in memory
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setAccessToken(credential.accessToken);
      }
      
      return result.user;
    } catch (error) {
      console.error("Error signing in with Google:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const connectGoogleClassroom = async () => {
    const provider = new GoogleAuthProvider();
    CLASSROOM_SCOPES.forEach(scope => provider.addScope(scope));
    provider.setCustomParameters({
      prompt: "select_account"
    });

    try {
      setLoading(true);
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      
      if (!credential?.accessToken) {
        throw new Error("Failed to get Google Classroom access token.");
      }

      setAccessToken(credential.accessToken);
      return credential.accessToken;
    } catch (error) {
      console.error("Error connecting to Google Classroom:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await signOut(auth);
      setAccessToken(null);
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, accessToken, signInWithGoogle, connectGoogleClassroom, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
