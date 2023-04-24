import React, { useCallback, useEffect, useState } from "react";
import { checkSession } from "./api";
import Main from "./Main";
import Login from "./Login";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  async function checkLogin() {
    const isLoggedIn = await checkSession();
    setIsLoggedIn(isLoggedIn);
  }

  useEffect(() => {
    checkLogin();
  }, []);

  if (isLoggedIn) {
    return <Main></Main>;
  } else {
    return <Login checkLogin={checkLogin}></Login>;
  }
}

export default App;
