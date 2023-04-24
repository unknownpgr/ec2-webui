import { useCallback, useEffect, useState } from "react";
import {
  addSchedule,
  getState,
  logout,
  removeSchedule,
  startInstance,
  stopInstance,
} from "./api";
import { State } from "./types";
import style from "./Main.module.css";

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
  const [showScheduleForm, setShowScheduleForm] = useState(false);

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

  function getScheduleComponent(instanceId: string) {
    const schedule = state.ec2Schedules.find(
      (e) => e.instanceId === instanceId
    );
    if (!schedule) {
      return (
        <span>
          <strong>Schedule:</strong> unset&nbsp;
          <button
            onClick={() => {
              setInstanceId(instanceId);
              setStartupTime("00:00");
              setShutdownTime("00:00");
              setShowScheduleForm(true);
            }}
          >
            edit
          </button>
        </span>
      );
    }
    return (
      <div>
        <strong>Schedule: </strong>
        {fromUTC(schedule.startupTime)}({schedule.startupTime} UTC) -{" "}
        {fromUTC(schedule.shutdownTime)}({schedule.shutdownTime} UTC)&nbsp;
        <button
          onClick={() => {
            setInstanceId(instanceId);
            setStartupTime(fromUTC(schedule.startupTime));
            setShutdownTime(fromUTC(schedule.shutdownTime));
            setShowScheduleForm(true);
          }}
        >
          edit
        </button>
        &nbsp;
        <button
          onClick={async () => await onRemoveSchedule(schedule.instanceId)}
        >
          remove
        </button>
      </div>
    );
  }

  return (
    <div className={style.container}>
      <h1>EC2 Controller</h1>
      <button onClick={onLogout}>Logout</button>
      &nbsp;&nbsp;
      <button onClick={updateState}>Update</button>
      <p>Last update: {new Date(lastUpdate).toLocaleString()}</p>
      {state.ec2State.map((e) => (
        <div key={e.instanceId} className={style.instanceCard}>
          <div className={style.instanceTitleFrame}>
            <span className={style.instanceTitle}>{e.instanceName}</span>
          </div>
          <strong>ID:</strong> {e.instanceId}
          <br />
          <strong>Type: </strong>
          {e.instanceType}
          <br />
          <strong>Public IP: </strong>
          {e.publicIpAddress}
          <br />
          <strong>State: </strong>
          {e.state.name}&nbsp;
          {e.state.name !== "running" ? (
            <button onClick={async () => startInstance(e.instanceId)}>
              start
            </button>
          ) : null}
          {e.state.name !== "stopped" ? (
            <button onClick={async () => stopInstance(e.instanceId)}>
              stop
            </button>
          ) : null}
          <br />
          {getScheduleComponent(e.instanceId)}
        </div>
      ))}
      <div
        className={style.scheduleFormFrame}
        style={{ top: showScheduleForm ? "0" : "-100%" }}
      >
        <div className={style.scheduleForm}>
          <h2>
            Add Schedule&nbsp;
            <button onClick={() => setShowScheduleForm(false)}>[ X ]</button>
          </h2>
          <div>
            <strong>Instance Name:</strong>
            {state.ec2State.find((e) => e.instanceId === instanceId)
              ? state.ec2State.find((e) => e.instanceId === instanceId)
                  ?.instanceName
              : "Not found"}
            <br />
            <strong>InstanceId: </strong>
            <input
              type="text"
              onChange={(e) => setInstanceId(e.target.value)}
              value={instanceId}
            />
          </div>
          <div>
            <strong>StartupTime: </strong>
            <input
              type="text"
              onChange={(e) => setStartupTime(e.target.value)}
              value={startupTime}
            />
            ({toUTC(startupTime)}UTC)
          </div>
          <div>
            <strong>ShutdownTime: </strong>
            <input
              type="text"
              onChange={(e) => setShutdownTime(e.target.value)}
              value={shutdownTime}
            />
            ({toUTC(shutdownTime)}UTC)
          </div>
          <button
            onClick={async () => {
              await onAddSchedule();
              setShowScheduleForm(false);
            }}
          >
            set
          </button>
        </div>
      </div>
    </div>
  );
}

export default Main;
