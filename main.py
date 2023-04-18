"""
This script is used to turn on EC2 instance at 04:55 PM and turn off EC2 instance at 00:10 AM
"""

import datetime
import time
import boto3
import config


def get_time_kr():
    """
    Get current time in timezone Asia/Korea
    """
    return datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=9)))


def get_ec2_client(access_key, secret_key, region):
    """
    Get EC2 client
    """
    return boto3.client(
        "ec2",
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        region_name=region,
    )


def turn_on_ec2():
    """
    Turn on EC2 instance
    """
    ec2 = get_ec2_client(
        config.AWS_ACCESS_KEY_ID, config.AWS_SECRET_ACCESS_KEY, config.AWS_REGION
    )
    ec2.instances.filter(InstanceIds=config.EC2_INSTANCE_IDS).start()


def turn_off_ec2():
    """
    Turn off EC2 instance
    """
    ec2 = get_ec2_client(
        config.AWS_ACCESS_KEY_ID, config.AWS_SECRET_ACCESS_KEY, config.AWS_REGION
    )
    ec2.instances.filter(InstanceIds=config.EC2_INSTANCE_IDS).stop()


def get_time_setting():
    """
    Get time setting

    Time setting is stored in `setting` file.
    Format:
    ```
    STARTUP_TIME=16:55
    SHUTDOWN_TIME=00:10
    ```

    Return: [
        startup_time_hour,
        startup_time_minute,
        shutdown_time_hour,
        shutdown_time_minute,
    ]
    """
    with open("setting", "r", encoding="utf-8") as f:
        lines = f.readlines()
        for line in lines:
            if line.startswith("STARTUP_TIME"):
                startup_time = line.split("=")[1].strip()
            elif line.startswith("SHUTDOWN_TIME"):
                shutdown_time = line.split("=")[1].strip()

    startup_time_parts = startup_time.split(":")
    shutdown_time_parts = shutdown_time.split(":")

    startup_time_hour = int(startup_time_parts[0])
    startup_time_minute = int(startup_time_parts[1])
    shutdown_time_hour = int(shutdown_time_parts[0])
    shutdown_time_minute = int(shutdown_time_parts[1])

    return [
        startup_time_hour,
        startup_time_minute,
        shutdown_time_hour,
        shutdown_time_minute,
    ]


def main():
    """
    Main function
    """

    previous_time_setting = None

    while True:
        [
            up_hour,
            up_minute,
            down_hour,
            down_minute,
        ] = get_time_setting()

        current_time_setting = f"{up_hour}:{up_minute} - {down_hour}:{down_minute}"
        if previous_time_setting != current_time_setting:
            print(f"Time setting set: {current_time_setting}")
            previous_time_setting = current_time_setting

        now = get_time_kr()

        if now.hour == up_hour and now.minute == up_minute:
            print(f"{now} - Turn on EC2")
            turn_on_ec2()
        elif now.hour == down_hour and now.minute == down_minute:
            print(f"{now} - Turn off EC2")
            for i in range(5):
                print(f"{now} - Count {i}")
                time.sleep(1)
            turn_off_ec2()
        time.sleep(25)


if __name__ == "__main__":
    main()
