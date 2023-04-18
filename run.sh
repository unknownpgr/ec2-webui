docker build -t ec2-runner .
docker run\
    --rm\
    -it\
    -v `pwd`/config.py:/app/config.py\
    -v `pwd`/setting:/app/setting\
    ec2-runner