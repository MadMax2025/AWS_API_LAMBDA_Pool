import json, os
import mysql.connector

ENV_HOST_MYSQL = os.getenv("ENV_HOST_MYSQL")
ENV_USER_MYSQL = os.getenv("ENV_USER_MYSQL")
ENV_PASSWORD_MYSQL = os.getenv("ENV_PASSWORD_MYSQL")
ENV_DATABASE_MYSQL = os.getenv("ENV_DATABASE_MYSQL")
ENV_PORT_MYSQL = os.getenv("ENV_PORT_MYSQL")

headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "OPTIONS,GET,POST"
    }

def withdrawMoney( idTarjetNumber, tipoDesposito, monto):
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
      SET saldo = saldo - {monto}
      WHERE id = '{idTarjetNumber}';
    """)

    conn.commit()
    print(f"Key updated successfully for idTarjetNumber: {idTarjetNumber}")

  except mysql.connector.Error as e:
    print(f"Error connecting to MySQL: {e}")

  finally:
    if 'conn' in locals() and conn.is_connected():
      cursor.close()
      conn.close()
      print("MySQL connection is closed")

def lambda_handler(event, context):
  try:
    print(f"Event: {event} ")
    print(f"Context: {context}")
    body = event['body']
    body_dict = json.loads(body)
    print(f"body_dict: {body_dict}  [lambda_handler]")

    idTarjetNumber = body_dict['idTarjetNumber']
    tipoDesposito = body_dict['tipoDesposito']
    monto = body_dict['monto']

    if tipoDesposito == 'Retiro':
      withdrawMoney(idTarjetNumber, tipoDesposito, monto)

      return {
          "statusCode": 200,
          "headers": headers,
          "body": json.dumps({"message": "Success"})
      }

    else:
      return {
          "statusCode": 200,
          "headers": headers,
          "body": json.dumps({"message": "No es un retiro de dinero"})
      }
  except Exception as e:
    print(f"Error [lambda_handler]: {e}")
    return {
        "statusCode": 500,
        "headers": headers,
        "body": json.dumps({"message": "Error"})
    }