import json, os, boto3
# definicion de cabeceras HTTP para permitir solicitudes desde cualquier origen (*)
# especifica metodos y encabezados HTTP para asegurar que la API desde diferentes dominios

headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "OPTIONS,GET,POST"
}
# verificacion de Correo verify_email_identity utiliza el cliente de Amazon SES "boto3.client('ses')"
# para verificar la identidad de un correo electronico, la respuesta del servicio imprime para el registro

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
    
# body para hacer el request de verificacion de correo
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