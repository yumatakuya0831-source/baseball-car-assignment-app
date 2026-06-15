import { useEffect, useState } from "react";
import { auth } from "../../lib/firebase";
import { browserLocalPersistence, getRedirectResult, onAuthStateChanged, setPersistence } from "firebase/auth";
import LoginPage from "./LoginPage";

export default function AuthGate({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let authChecked = false;
    let redirectChecked = false;

    const finishLoading = () => {
      if (isMounted && authChecked && redirectChecked) {
        setLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!isMounted) return;
      setUser(currentUser);
      authChecked = true;
      finishLoading();
    });

    setPersistence(auth, browserLocalPersistence)
      .then(() => getRedirectResult(auth))
      .then((result) => {
        if (!isMounted) return;
        if (result?.user) {
          setUser(result.user);
        }
      })
      .catch((error) => {
        console.error("google redirect result error:", error);
        alert(`Googleログインに失敗しました。\n${error.code ?? ""}`);
      })
      .finally(() => {
        redirectChecked = true;
        finishLoading();
      });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="app">
        <div className="phone-frame">
          <div className="card empty-card auth-loading">ログイン状態を確認中です...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return children;
}
