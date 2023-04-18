docker build -t ec2-runner .
docker run\
    --rm\
    -it\
    -v `pwd`/config.py:/app/config.py\
    ec2-runner