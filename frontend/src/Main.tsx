import React, { useCallback, useEffect, useState } from "react";
import {
  addSchedule,
  getState,
  logout,
  removeSchedule,
  startInstance,
  stopInstance,
} from "./api";
import { State } from "./types";

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

function Main() {
  const [state, setState] = useState<State>({ ec2State: [], ec2Schedules: [] });
  const [lastUpdate, setLastUpdate] = useState(0);
  const [instanceId, setInstanceId] = useState("");
  const [startupTime, setStartupTime] = useState("");
  const [shutdownTime, setShutdownTime] = useState("");

  const updateState = useCallback(async () => {
    const state = await getState();
    setState(state);
    setLastUpdate(Date.now());
  }, []);

  async function onLogout() {
    logout();
    window.location.href = "/";
  }

  async function onAddSchedule() {
    const schedule = {
      instanceId,
      startupTime: toUTC(startupTime),
      shutdownTime: toUTC(shutdownTime),
    };
    const success = await addSchedule(schedule);
    if (success) {
      updateState();
    }
  }

  async function onRemoveSchedule(instanceId: string) {
    const success = await removeSchedule(instanceId);
    if (success) {
      updateState();
    }
  }

  useEffect(() => {
    updateState();
  }, [updateState]);

  return (
    <div>
      <h1>EC2 Controller</h1>
      <button onClick={onLogout}>Logout</button>
      <button onClick={updateState}>Update</button>
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

          <button onClick={async () => startInstance(e.instanceId)}>
            Start
          </button>
          <button onClick={async () => stopInstance(e.instanceId)}>Stop</button>
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

export default Main;
