import json, os, boto3


headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "OPTIONS,GET,POST"
}

def verify_email_identity(email):
    ses_client = boto3.client("ses")
    response = ses_client.verify_email_identity(
        EmailAddress=email
    )
    print(response)


def lambda_handler(event, context):
  try:
    print(f"Event: {event} ")
    print(f"Context: {context}")
    body = event['body']
    body_dict = json.loads(body)
    print(f"body_dict: {body_dict}  [lambda_handler]")

    email = body_dict['email']

    verify_email_identity(email)

    return {
        "statusCode": 200,
        "headers": headers,
        "body": json.dumps({"message": "Email verified"})
    }

  except Exception as e:
    print(f"Error [lambda_handler]: {e}")
    return {
        "statusCode": 500,
        "headers": headers,
        "body": json.dumps({"message": "Error"})
    }