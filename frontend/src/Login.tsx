import { useState } from "react";
import { login } from "./api";

export default function Login({
  checkLogin,
}: {
  checkLogin: () => Promise<void>;
}) {
  const [password, setPassword] = useState("");

  async function onLogin() {
    //  = await login(password);/
    const isLoggedIn = await login(password);
    if (isLoggedIn) {
      checkLogin();
    }
  }

  return (
    <div>
      <input
        type="password"
        onChange={(e) => setPassword(e.target.value)}
        value={password}
      />
      <button onClick={onLogin}>Login</button>
    </div>
  );
}
