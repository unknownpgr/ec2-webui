FROM python:3.9

RUN pip install boto3

WORKDIR /app

COPY . .

CMD ["python", "main.py"]