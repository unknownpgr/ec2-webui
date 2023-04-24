import dotenv from "dotenv";
import express from "express";
import {
  EC2Client,
  StartInstancesCommand,
  StopInstancesCommand,
  DescribeInstancesCommand,
} from "@aws-sdk/client-ec2";
import session from "express-session";

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

const ec2State: Ec2State[] = [];

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

async function main() {
  await updateEc2State();

  const app = express();
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "EXPRESS_SESSION_SECRET",
      resave: false,
      saveUninitialized: false,
    })
  );

  app.use(express.static("public"));
  app.use(express.json());

  app.post("/login", (req, res) => {
    if (req.body.password === WEBUI_PASSWORD) {
      req.session.isLoggedIn = true;
      res.json({
        success: true,
      });
    } else {
      req.session.destroy(() => {
        res.json({
          success: false,
        });
      });
    }
  });

  app.use((req, res, next) => {
    if (req.session.isLoggedIn) {
      next();
    } else {
      res.send({
        success: false,
      });
    }
  });

  app.get("/ec2", async (req, res) => {
    await updateEc2State();
    res.json(ec2State);
  });

  app.post("/ec2/start", async (req, res) => {
    const instanceId = req.body.instanceId;
    await startEc2(instanceId);
    res.json({
      success: true,
    });
  });

  app.post("/ec2/stop", async (req, res) => {
    const instanceId = req.body.instanceId;
    await stopEc2(instanceId);
    res.json({
      success: true,
    });
  });

  app.listen(80, () => {
    console.log("Listening on port 80");
  });
}

main();
