FROM python:3.9

RUN pip install boto3

WORKDIR /app

COPY main.py .

CMD ["python", "main.py"]