import { Ec2Schedule, State } from "./types";

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

export async function checkSession() {
  const session = localStorage.getItem("session");
  if (!session) return false;
  const res = await get("/api/test", session);
  if (res.success) return true;
  localStorage.removeItem("session");
  return false;
}

export async function login(password: string) {
  const res = await post("/api/login", "", { password });
  if (res.success) {
    localStorage.setItem("session", res.session);
    return true;
  }
  return false;
}

export async function logout() {
  const session = localStorage.getItem("session");
  if (!session) return true;
  localStorage.removeItem("session");
  const res = await get("/api/logout", session);
  if (res.success) {
    return true;
  }
  return false;
}

export async function getState() {
  const session = localStorage.getItem("session");
  if (!session) throw new Error("No session");
  const res = (await get("/api/state", session)) as State;
  return res;
}

export async function addSchedule(schedule: Ec2Schedule): Promise<boolean> {
  const session = localStorage.getItem("session");
  if (!session) return false;
  const res = await post("/api/schedule/add", session, schedule);
  return res.success;
}

export async function removeSchedule(instanceId: string) {
  const session = localStorage.getItem("session");
  if (!session) return false;
  const res = await post("/api/schedule/delete", session, { instanceId });
  return res.success;
}

export async function startInstance(instanceId: string) {
  const session = localStorage.getItem("session");
  if (!session) return false;
  const res = await post("/api/ec2/start", session, { instanceId });
  return res.success;
}

export async function stopInstance(instanceId: string) {
  const session = localStorage.getItem("session");
  if (!session) return false;
  const res = await post("/api/ec2/stop", session, { instanceId });
  return res.success;
}
