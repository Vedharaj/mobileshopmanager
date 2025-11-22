// context/AuthContext.js
import { createContext } from "react";

const AuthContext = createContext({
  userToken: null,
  signIn: async (token) => {},
  signOut: async () => {},
});

export default AuthContext;
