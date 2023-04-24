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

function toUTC(timeString: string) {
  /**
   * This function will convert a time string in the format of "HH:MM" in the local timezone to the equivalent time in the UTC timezone.
   * And it will return converted date in same format.
   */
  const date = new Date();
  const [hours, minutes] = timeString.split(":");
  date.setHours(+hours, +minutes, 0, 0);
  return `${date.getUTCHours()}:${date.getUTCMinutes()}`;
}

function fromUTC(timeString: string) {
  /**
   * This function will convert a time string in the format of "HH:MM" in the UTC timezone to the equivalent time in the local timezone.
   * And it will return converted date in same format.
   */
  const date = new Date();
  const [hours, minutes] = timeString.split(":");
  date.setUTCHours(+hours, +minutes, 0, 0);
  return `${date.getHours()}:${date.getMinutes()}`;
}

function App() {
  const [password, setPassword] = useState("");
  const [session, setSession] = useState("");
  const [state, setState] = useState<State>({ ec2State: [], ec2Schedules: [] });
  const [lastUpdate, setLastUpdate] = useState(0);
  const isLoggedIn = session !== "";
  const [instanceId, setInstanceId] = useState("");
  const [startupTime, setStartupTime] = useState("");
  const [shutdownTime, setShutdownTime] = useState("");

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
    const schedule = {
      instanceId,
      startupTime: toUTC(startupTime),
      shutdownTime: toUTC(shutdownTime),
    };
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
            <button onClick={() => setInstanceId(e.instanceId)}>
              edit schedule
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
          {state.ec2State.find((e) => e.instanceId === instanceId) ? (
            <p>
              {
                state.ec2State.find((e) => e.instanceId === instanceId)
                  ?.instanceName
              }
            </p>
          ) : null}
          <p>
            {fromUTC(e.startupTime)}({e.startupTime} UTC)
          </p>
          <p>
            {fromUTC(e.shutdownTime)}({e.shutdownTime} UTC)
          </p>
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
          onChange={(e) => setInstanceId(e.target.value)}
          value={instanceId}
        />
        {state.ec2State.find((e) => e.instanceId === instanceId) ? (
          <p>
            {
              state.ec2State.find((e) => e.instanceId === instanceId)
                ?.instanceName
            }
          </p>
        ) : null}
      </div>
      <div>
        <label>StartupTime</label>
        <input
          type="text"
          onChange={(e) => setStartupTime(e.target.value)}
          value={startupTime}
        />
        <p>{toUTC(startupTime)}UTC</p>
      </div>
      <div>
        <label>ShutdownTime</label>
        <input
          type="text"
          onChange={(e) => setShutdownTime(e.target.value)}
          value={shutdownTime}
        />
        <p>{toUTC(shutdownTime)}UTC</p>
      </div>
      <button onClick={async () => await onAddSchedule()}>Add</button>
    </div>
  );
}

export default App;
