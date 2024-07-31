import json, os, boto3
import mysql.connector

ENV_HOST_MYSQL = os.getenv("ENV_HOST_MYSQL")
ENV_USER_MYSQL = os.getenv("ENV_USER_MYSQL")
ENV_PASSWORD_MYSQL = os.getenv("ENV_PASSWORD_MYSQL")
ENV_DATABASE_MYSQL = os.getenv("ENV_DATABASE_MYSQL")
ENV_PORT_MYSQL = os.getenv("ENV_PORT_MYSQL")
ENV_SES_EMAIL_FROM = os.getenv("ENV_SES_EMAIL_FROM")

headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "OPTIONS,GET,POST"
    }

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
def connect_to_db():
  try:
    conn = mysql.connector.connect(
      host=ENV_HOST_MYSQL,
      user=ENV_USER_MYSQL,
      password=ENV_PASSWORD_MYSQL,
      database=ENV_DATABASE_MYSQL,
      port=ENV_PORT_MYSQL
    )  
    cursor = conn.cursor()

    cursor.execute("""
      CREATE TABLE IF NOT EXISTS CuentaBancaria (
        id INT AUTO_INCREMENT PRIMARY KEY,
        numeroCuenta VARCHAR(20) UNIQUE NOT NULL,
        saldo DECIMAL(10, 2) NOT NULL,
        titular VARCHAR(100) NOT NULL,
        tarjetaDebito VARCHAR(20) UNIQUE NOT NULL,
        claveTarjeta VARCHAR(255) NOT NULL,
        correoElectronico VARCHAR(255)
      )
    """)

    cursor.execute("""
      CREATE TABLE IF NOT EXISTS Transaccion (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tipo ENUM('Deposito', 'Retiro', 'Cambio de Clave') NOT NULL,
        monto DECIMAL(10, 2) NOT NULL,
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        idCuenta INT,
        FOREIGN KEY (idCuenta) REFERENCES CuentaBancaria(id)
      )
    """)

    cuentas_data = [
      ('1001', 5000.00, 'John Doe', '1234-5678-9012-3456', '123456', 'john.doe@example.com'),
      ('1002', 8000.00, 'Jane Smith', '9876-5432-1098-7654', '654321', 'jane.smith@example.com')
    ]
    cursor.executemany("""
      INSERT INTO CuentaBancaria (numeroCuenta, saldo, titular, tarjetaDebito, claveTarjeta, correoElectronico)
      VALUES (%s, %s, %s, %s, %s, %s)
    """, cuentas_data)

    conn.commit()
    print("Tables created successfully and initial data inserted.")

  except mysql.connector.Error as e:
    print(f"Error connecting to MySQL: {e}")

  finally:
    if 'conn' in locals() and conn.is_connected():
      cursor.close()
      conn.close()
      print("MySQL connection is closed")



def lambda_handler(event, context):
  try:
    print("holla")
    connect_to_db()
    
    email_subject = "Cuenta de Tablas" 
    
    response_email = send_html_email(ENV_SES_EMAIL_FROM, 
                               "plrmsr@gmail.com", 
                                email_subject)
    
    print(f"Email sent successfully: {response_email}") 
    return {
        "statusCode": 200,
        "headers": headers,
        "body": json.dumps({"message": "Success"})
    }

  except Exception as e:
    print(f"Error [lambda_handler]: {e}")
    return {
        "statusCode": 500,
        "headers": headers,
        "body": json.dumps({"message": "Error"})
    }