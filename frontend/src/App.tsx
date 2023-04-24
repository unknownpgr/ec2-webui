import React, { useEffect, useState } from "react";

interface Ec2State {
  instanceType: string;
  instanceName: string;
  instanceId: string;
  publicIpAddress: string;
  state: {
    code: number;
    name: string;
  };
}

async function get(path: string, session: string) {
  const response = await fetch(path, {
    headers: {
      session,
    },
  });
  const data = await response.json();
  return data;
}

async function post(path: string, session: string, body: any) {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      session,
    },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  return data;
}

function App() {
  const [password, setPassword] = useState("");
  const [session, setSession] = useState("");
  const [ec2, setEc2] = useState<Ec2State[]>([]);
  const [lastUpdate, setLastUpdate] = useState(0);
  const isLoggedIn = session !== "";

  async function onLogin() {
    const res = await post("/api/login", "", { password });
    if (res.success) {
      localStorage.setItem("session", res.session);
      setSession(res.session);
    }
  }

  async function onLogout() {
    const res = await post("/api/logout", session, {});
    if (res.success) {
      localStorage.removeItem("session");
      setSession("");
    }
  }

  async function updateEc2() {
    const res = (await get("/api/ec2", session)) as Ec2State[];
    setEc2(res);
    setLastUpdate(Date.now());
  }

  useEffect(() => {
    (async () => {
      const session = localStorage.getItem("session");
      if (!session) return;
      const res = await get("/api/test", session);
      if (res.success) {
        setSession(session);
      } else {
        localStorage.removeItem("session");
      }
    })();
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    updateEc2();
  }, [isLoggedIn, session]);

  return (
    <div>
      <h1>EC2 Controller</h1>
      {!isLoggedIn ? (
        <div>
          <input
            type="password"
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={onLogin}>Login</button>
        </div>
      ) : (
        <div>
          <button onClick={onLogout}>Logout</button>
        </div>
      )}
      <button onClick={updateEc2}>Update</button>
      <p>Last update: {new Date(lastUpdate).toLocaleString()}</p>
      {ec2.map((e) => (
        <div key={e.instanceId}>
          <h2>{e.instanceName}</h2>
          <p>{e.instanceType}</p>
          <p>{e.publicIpAddress}</p>
          <p>{e.state.name}</p>

          <button
            onClick={async () => {
              await post("/api/ec2/start", session, {
                instanceId: e.instanceId,
              });
            }}
          >
            Start
          </button>
          <button
            onClick={async () => {
              await post("/api/ec2/stop", session, {
                instanceId: e.instanceId,
              });
            }}
          >
            Stop
          </button>
        </div>
      ))}
    </div>
  );
}

export default App;
