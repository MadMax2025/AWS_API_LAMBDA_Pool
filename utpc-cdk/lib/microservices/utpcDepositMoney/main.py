import json, os, boto3
import mysql.connector

# importaciones y configuracion de variables, +
# modulos necesarios para AWS SES y conectarse a mysql

ENV_HOST_MYSQL = os.getenv("ENV_HOST_MYSQL")
ENV_USER_MYSQL = os.getenv("ENV_USER_MYSQL")
ENV_PASSWORD_MYSQL = os.getenv("ENV_PASSWORD_MYSQL")
ENV_DATABASE_MYSQL = os.getenv("ENV_DATABASE_MYSQL")
ENV_PORT_MYSQL = os.getenv("ENV_PORT_MYSQL")
ENV_SES_EMAIL_FROM = os.getenv("ENV_SES_EMAIL_FROM") # ses_eil_from = os.getenv("ENV_SES_MAIL_FROM")

# Cabeceras CORS se define cabeceras HTTP para permitir solicitudes desde cualquier origen (*)
# para asegurar que la API se puede consumir desde cualquier lugar distintos dominios url
headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "OPTIONS,GET,POST"
    }
# Funcion para enviar correo HTML a un destinatario 
def send_html_email(email_source,email_destination,subject):
    ses_client = boto3.client("ses")
    CHARSET = "UTF-8"
    HTML_EMAIL_CONTENT = f"""
      <html>
        <head></head>
        <h1 style='text-align:center'>{subject}</h1>
        <p>Se realizo el {subject}</p>
        </body>
      </html>
    """
    response = ses_client.send_email(
        Destination={
          "ToAddresses": [
            email_destination,
          ],
        },
        Message={
          "Body": {
            "Html": {
              "Charset": CHARSET,
              "Data": HTML_EMAIL_CONTENT,
            }
          },
          "Subject": {
            "Charset": CHARSET,
            "Data": subject,
          },
        },
        Source=email_source,
    )

    return response
# Funcion para realizar el deposito inserta una transaccion en la table transaccion actualiza el saldo de la cuenta
def depositMoney(idTarjetNumber, tipoDesposito, monto):
  try:
    conn = mysql.connector.connect(
      host=ENV_HOST_MYSQL,
      user=ENV_USER_MYSQL,
      password=ENV_PASSWORD_MYSQL,
      database=ENV_DATABASE_MYSQL,
      port=ENV_PORT_MYSQL
    )  
    cursor = conn.cursor()

    cursor.execute(f"""
      INSERT INTO Transaccion (tipo, monto, idCuenta)
      VALUES ('{tipoDesposito}', {monto}, {idTarjetNumber});     
    """)

    cursor.execute(f"""
      UPDATE CuentaBancaria
      SET saldo = saldo + {monto}
      WHERE id = '{idTarjetNumber}';
    """)

    conn.commit()
    print(f"Key updated successfully for idTarjetNumber: {idTarjetNumber}") # verifica el id de la tarjeta

  except mysql.connector.Error as e:
    print(f"Error connecting to MySQL: {e}")

  finally:
    if 'conn' in locals() and conn.is_connected():
      cursor.close()
      conn.close()
      print("MySQL connection is closed")
# Funcion lambda_handler es el punto de entrada de la funcion procesa el evento verifica tipo de deposito
# maneja  errores y retorna una respuesta
def lambda_handler(event, context):
  try:
    print(f"Event: {event} ")
    print(f"Context: {context}")
    body = event['body']
    body_dict = json.loads(body)
    print(f"body_dict: {body_dict}  [lambda_handler]")
    
    # body parametros jason
    idTarjetNumber = body_dict['idTarjetNumber']
    tipoDesposito = body_dict['tipoDesposito']
    monto = body_dict['monto']

    if tipoDesposito == 'Deposito':
      depositMoney(idTarjetNumber, tipoDesposito, monto)
      email_subject = f"Deposito de {monto} depositado, elaborado por Paul Ramos"
      
      response_email = send_html_email(ENV_SES_EMAIL_FROM,
                                 "plrmsr@gmail.com",
                                 
                                 email_subject)
      print(f"Email sent successfully: {response_email}")  
      
      return {
          "statusCode": 200,
          "headers": headers,
          "body": json.dumps({"message": "Success"})
      }
    else:
      return {
          "statusCode": 400,
          "headers": headers,
          "body": json.dumps({"message": "No es tipo Deposito"})
      }

  except Exception as e:
    print(f"Error [lambda_handler]: {e}")
    return {
        "statusCode": 500,
        "headers": headers,
        "body": json.dumps({"message": "Error"})
    }