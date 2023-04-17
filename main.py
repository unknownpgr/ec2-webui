'''
This script is used to turn on EC2 instance at 04:55 PM and turn off EC2 instance at 00:10 AM
'''

import datetime
import time
import boto3
import config


def get_time():
    '''
    Get current time in timezone Asia/Korea
    '''
    return datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=9)))


def turn_on_ec2():
    '''
    Turn on EC2 instance
    '''
    ec2 = boto3.resource('ec2')
    ec2.instances.filter(InstanceIds=config.EC2_INSTANCE_IDS).start()


def turn_off_ec2():
    '''
    Turn off EC2 instance
    '''
    ec2 = boto3.resource('ec2')
    ec2.instances.filter(InstanceIds=config.EC2_INSTANCE_IDS).stop()


print("Start EC2 scheduler")

while True:
    # Turn on EC2 at 04:55 PM
    # Turn off EC2 at 00:10 AM

    now = get_time()
    if now.hour == 11 and now.minute == 45:
        print(f"{now} - Turn on EC2")
        turn_on_ec2()
    elif now.hour == 11 and now.minute == 43:
        print(f"{now} - Turn off EC2")
        for i in range(5):
            print(f"{now} - Count {i}")
            time.sleep(1)
        turn_off_ec2()
    time.sleep(25)
