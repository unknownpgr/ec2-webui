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
    Get time setting from config
    """
    up_hour, up_minute = config.TIME_SETTING["STARTUP_TIME"].split(":")
    down_hour, down_minute = config.TIME_SETTING["SHUTDOWN_TIME"].split(":")

    return [int(up_hour), int(up_minute), int(down_hour), int(down_minute)]


def main():
    """
    Main function
    """

    print("Start EC2 scheduler")
    print("Affected EC2 instance:", config.EC2_INSTANCE_IDS)

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
