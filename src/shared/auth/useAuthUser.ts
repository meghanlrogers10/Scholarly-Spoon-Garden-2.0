import { useContext } from "react";
import { AuthContext } from "./authContext";

export function useAuthUser() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuthUser must be used inside AuthProvider.");
  }

  return context;
}
