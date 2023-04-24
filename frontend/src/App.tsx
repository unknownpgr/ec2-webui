import React, { useCallback, useEffect, useState } from "react";

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

interface Ec2Schedule {
  instanceId: string;
  startupTime: string;
  shutdownTime: string;
}

interface State {
  ec2State: Ec2State[];
  ec2Schedules: Ec2Schedule[];
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
  const [state, setState] = useState<State>({ ec2State: [], ec2Schedules: [] });
  const [schedule, setSchedule] = useState<Ec2Schedule>({
    instanceId: "",
    startupTime: "",
    shutdownTime: "",
  });
  const [lastUpdate, setLastUpdate] = useState(0);
  const isLoggedIn = session !== "";

  const updateEc2 = useCallback(async () => {
    const res = (await get("/api/state", session)) as State;
    setState(res);
    setLastUpdate(Date.now());
  }, [session]);

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

  async function onAddSchedule() {
    const res = await post("/api/schedule/add", session, schedule);
    if (res.success) {
      updateEc2();
    }
  }

  async function onRemoveSchedule(instanceId: string) {
    const res = await post("/api/schedule/remove", session, { instanceId });
    if (res.success) {
      updateEc2();
    }
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
  }, [isLoggedIn, updateEc2]);

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
      <h2>EC2</h2>
      {state.ec2State.map((e) => (
        <div key={e.instanceId}>
          <h2>{e.instanceName}</h2>
          <p>
            {e.instanceId}
            <button
              onClick={() =>
                setSchedule((schedule) => ({
                  ...schedule,
                  instanceId: e.instanceId,
                }))
              }
            >
              Set Schedule
            </button>
          </p>
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
      <h2>Schedule</h2>
      {state.ec2Schedules.map((e) => (
        <div key={e.instanceId}>
          <p>{e.instanceId}</p>
          <p>{e.startupTime}</p>
          <p>{e.shutdownTime}</p>
          <button onClick={async () => await onRemoveSchedule(e.instanceId)}>
            Remove
          </button>
        </div>
      ))}
      <h2>Add Schedule</h2>
      <div>
        <label>InstanceId</label>
        <input
          type="text"
          onChange={(e) =>
            setSchedule((schedule) => ({
              ...schedule,
              instanceId: e.target.value,
            }))
          }
          value={schedule.instanceId}
        />
      </div>
      <div>
        <label>StartupTime</label>
        <input
          type="text"
          onChange={(e) =>
            setSchedule((schedule) => ({
              ...schedule,
              startupTime: e.target.value,
            }))
          }
          value={schedule.startupTime}
        />
      </div>
      <div>
        <label>ShutdownTime</label>
        <input
          type="text"
          onChange={(e) =>
            setSchedule((schedule) => ({
              ...schedule,
              shutdownTime: e.target.value,
            }))
          }
          value={schedule.shutdownTime}
        />
      </div>
      <button onClick={async () => await onAddSchedule()}>Add</button>
    </div>
  );
}

export default App;
