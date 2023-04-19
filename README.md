# EC2 Scheduler

- 군대에서 개발을 진행하기 위해, 개발 환경을 Windows 2019 t2.large EC2 인스턴스 위에 구성하였다.
- 그런데 이 인스턴스를 항상 켜놓다 보니 비용이 꽤 들었다. 매번 켜고 끄고 하기 귀찮았기 때문이다.
- 이번에 개발환경 성능 향상을 위해 t2.xlarge로 사양을 올리기로 결정했다.
- 그러자니 비용이 너무 많이 들 듯하여, 컴퓨터를 사용할 수 있는 시간에 맞추어 EC2를 켜고 끌 수 있는 간단한 스케줄러를 만들었다.

## Usage

- 아래 포맷에 따라 config.py 파일을 만든다.
    ```python
    AWS_ACCESS_KEY_ID = "AWSACCESSKEYID"
    AWS_SECRET_ACCESS_KEY = "aWsSeCrEtAcCeSsKeY"
    AWS_REGION = "ap-northeast-2"
    EC2_INSTANCE_IDS = ["i-0a1b2c3d4e5f6g7h8"]
    TIME_SETTING = {
        "STARTUP_TIME": "16:55",
        "SHUTDOWN_TIME": "00:10",
    }
    ```
- 도커파일을 실행한다. `run.sh` 참고.

## Note

시간은 한국 시간(KST/UTC+9) 기준이다.