import dotenv from "dotenv";
import express from "express";
import {
  EC2Client,
  StartInstancesCommand,
  StopInstancesCommand,
  DescribeInstancesCommand,
} from "@aws-sdk/client-ec2";
import fs from "fs/promises";
import crypto from "crypto";

declare module "express-session" {
  interface SessionData {
    isLoggedIn: boolean;
  }
}

dotenv.config();

const WEBUI_PASSWORD = process.env.WEBUI_PASSWORD || "WEBUI_PASSWORD";

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

interface Config {
  sessions: string[];
  ec2Schedules: Ec2Schedule[];
}

const ec2State: Ec2State[] = [];
const config: Config = {
  sessions: [],
  ec2Schedules: [],
};

const ec2Client = new EC2Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

async function updateEc2State() {
  const command = new DescribeInstancesCommand({});
  const response = await ec2Client.send(command);
  const reservations = response.Reservations;
  if (reservations) {
    ec2State.length = 0;
    reservations.forEach((reservation) => {
      const instances = reservation.Instances;
      if (instances) {
        instances.forEach((instance) => {
          const instanceType = instance.InstanceType || "";
          const instanceName = instance.KeyName || "";
          const instanceId = instance.InstanceId || "";
          const publicIpAddress = instance.PublicIpAddress || "";
          const stateCode = instance.State?.Code || 0;
          const stateName = instance.State?.Name || "";
          ec2State.push({
            instanceType,
            instanceName,
            instanceId,
            publicIpAddress,
            state: {
              code: stateCode,
              name: stateName,
            },
          });
        });
      }
    });
  }
}

async function startEc2(instanceId: string) {
  const command = new StartInstancesCommand({
    InstanceIds: [instanceId],
  });
  await ec2Client.send(command);
}

async function stopEc2(instanceId: string) {
  const command = new StopInstancesCommand({
    InstanceIds: [instanceId],
  });
  await ec2Client.send(command);
}

async function getSession() {
  const session = crypto.randomBytes(16).toString("hex");
  config.sessions.push(session);
  await saveConfig();
  return session;
}

async function loadConfig() {
  const data = await fs.readFile("config.json", "utf-8");
  try {
    const json = JSON.parse(data);
    config.sessions = json.sessions || [];
    config.ec2Schedules = json.ec2Schedules || [];
  } catch (e) {}
}

async function saveConfig() {
  const json = JSON.stringify(config);
  await fs.writeFile("config.json", json);
}

async function main() {
  await updateEc2State();
  await loadConfig();

  const app = express();

  app.use(express.static("public"));
  app.use(express.json());

  app.post("/api/login", async (req, res) => {
    if (req.body.password === WEBUI_PASSWORD) {
      const session = await getSession();
      res.json({
        success: true,
        session,
      });
    } else {
      res.status(401).json({
        success: false,
      });
    }
  });

  app.use((req, res, next) => {
    const session = (req.headers.session as string) || "";
    if (config.sessions.includes(session)) {
      next();
    } else {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }
  });

  app.get("/api/test", async (req, res) => {
    res.json({
      success: true,
    });
  });

  app.get("/api/logout", async (req, res) => {
    const session = (req.headers.session as string) || "";
    const index = config.sessions.indexOf(session);
    if (index >= 0) {
      config.sessions.splice(index, 1);
      await saveConfig();
    }
    res.json({
      success: true,
    });
  });

  app.get("/api/state", async (req, res) => {
    await updateEc2State();
    res.json({
      success: true,
      ec2State,
      ec2Schedules: config.ec2Schedules,
    });
  });

  app.post("/api/ec2/start", async (req, res) => {
    const instanceId = req.body.instanceId;
    await startEc2(instanceId);
    res.json({
      success: true,
    });
  });

  app.post("/api/ec2/stop", async (req, res) => {
    const instanceId = req.body.instanceId;
    await stopEc2(instanceId);
    res.json({
      success: true,
    });
  });

  app.post("/api/schedule/add", async (req, res) => {
    const instanceId = req.body.instanceId;

    // Check if schedule already exists
    const index = config.ec2Schedules.findIndex(
      (schedule) => schedule.instanceId === instanceId
    );
    if (index >= 0) {
      // Remove existing schedule
      config.ec2Schedules.splice(index, 1);
    }

    const startupTime = req.body.startupTime;
    const shutdownTime = req.body.shutdownTime;
    config.ec2Schedules.push({
      instanceId,
      startupTime,
      shutdownTime,
    });
    await saveConfig();
    res.json({
      success: true,
    });
  });

  app.post("/api/schedule/remove", async (req, res) => {
    const instanceId = req.body.instanceId;
    const index = config.ec2Schedules.findIndex(
      (schedule) => schedule.instanceId === instanceId
    );
    if (index >= 0) {
      config.ec2Schedules.splice(index, 1);
      await saveConfig();
    }
    res.json({
      success: true,
    });
  });

  app.listen(8080, () => {
    console.log("Listening on port 8080");
  });
}

main();
