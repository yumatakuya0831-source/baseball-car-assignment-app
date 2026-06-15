import { useEffect } from "react";
import { auth } from "../../lib/firebase";
import { GoogleAuthProvider, getRedirectResult, signInWithRedirect } from "firebase/auth";

export default function LoginPage() {
  useEffect(() => {
    getRedirectResult(auth).catch((error) => {
      console.error("google redirect login error:", error);
      alert(`Googleログインに失敗しました。Firebase Authenticationの設定を確認してください。\n${error.code ?? ""}`);
    });
  }, []);

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithRedirect(auth, provider);
    } catch (error) {
      console.error("google login error:", error);
      alert(`Googleログインに失敗しました。Firebase Authenticationの設定を確認してください。\n${error.code ?? ""}`);
    }
  };

  return (
    <div className="app">
      <div className="phone-frame login-frame">
        <main className="login-content">
          <div className="login-brand">
            <div className="login-title">野球配車アプリ</div>
            <div className="login-subtitle">Googleアカウントでログイン</div>
          </div>

          <button type="button" className="google-login-btn" onClick={handleGoogleLogin}>
            <span className="google-mark">G</span>
            <span>Googleでログイン</span>
          </button>
        </main>
      </div>
    </div>
  );
}
