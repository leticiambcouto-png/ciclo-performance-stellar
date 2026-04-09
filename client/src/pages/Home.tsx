import { useStellarAuth } from "@/contexts/StellarAuthContext";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Home() {
  const { user, loading } = useStellarAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading) {
      if (user) {
        navigate("/ciclo");
      } else {
        navigate("/login");
      }
    }
  }, [loading, user, navigate]);

  return null;
}
