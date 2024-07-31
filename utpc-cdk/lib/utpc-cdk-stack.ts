// importacion y configuracion inicial
// importa clases y funciones de la libreria aws-cdk-lib para crear los recursos de AWS, 
//como IAM, Lambda, API Gateway, etc.//

import * as cdk from 'aws-cdk-lib';
import { Role, ServicePrincipal, ManagedPolicy, PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import { Function, Runtime, Code, LayerVersion } from 'aws-cdk-lib/aws-lambda';
import { RestApi, Cors, MethodLoggingLevel, LambdaIntegration } from 'aws-cdk-lib/aws-apigateway';
import { Duration } from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import path = require('path');
import * as dotenv from 'dotenv';

// carga las variables de entorno desde el archivo .env//

dotenv.config();
// define el constructor y se extiende de la clase cdk.Stack
export class UtpcCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //Creacion del rol IAM para la lambda
    
    const utpcRole = new Role(this, 'utpcRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'), 
      roleName: 'utpcRole',
      description: 'role for utpc micro',
    });
    // con los permisos necesarios para la lambda y los registros de CloudWatch
    // Policies: asigna politicas gestionadas al rol, dandole acceso completo a Lambda y CloudWatch.
    utpcRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AWSLambda_FullAccess'));
    utpcRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('CloudWatchLogsFullAccess'));
    utpcRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonSESFullAccess')); 
    
    // logs, y Amazon SES para poder enviar correos electronicos
    

    // Contruccion de la capa mysqlConnector layer contiene una libreria mysql para conectarse a una base de datos mysql//
    // LayerVersion: crea una version de la capa que puede ser referenciada por otras funciones lambda.
    const mysqlConnectorLayer = new LayerVersion(this, 'mysqlconnector', {
      code: Code.fromAsset(path.join(__dirname, './layers/mysqlConnector')), 
      compatibleRuntimes: [Runtime.PYTHON_3_9],
      description: 'mysqlConnector library layer',
      removalPolicy: cdk.RemovalPolicy.DESTROY
    }); // esta capa destruira si se elimina la pila removePolicy : cdk.RemovalPolicy.DESTROY

    //aqui contruire mi nuevas function lambdas///
    // cada funcion es asociada con el rol utpcRole y mysqlConnectorLayer para tener acceso a la capa
    const utpcDepositMoney = new Function(this, 'utpcDepositMoney', {
      runtime: Runtime.PYTHON_3_9, 
      handler: 'main.lambda_handler', // controlador ejecutara la funcion lambda dentro del archivo main.py
      code: Code.fromAsset(path.join(__dirname, './microservices/utpcDepositMoney')),
      functionName: 'utpcDepositMoney',
      timeout: Duration.minutes(1),
      layers: [mysqlConnectorLayer],
      role: utpcRole,
      environment: {
        ENV_HOST_MYSQL: process.env.ENV_HOST_MYSQL || 'default-value',
        ENV_USER_MYSQL: process.env.ENV_USER_MYSQL || 'default-value',
        ENV_PASSWORD_MYSQL: process.env.ENV_PASSWORD_MYSQL || 'default-value',
        ENV_DATABASE_MYSQL: process.env.ENV_DATABASE_MYSQL || 'default-value',
        ENV_PORT_MYSQL: process.env.ENV_PORT_MYSQL || 'default-value',
        ENV_SES_EMAIL_FROM: process.env.ENV_SES_EMAIL_FROM || 'default-value', //FROM process.env.ENV_SES_REGION || 'default-value',
      },
    });

    const utpcWithdrawMoney = new Function(this, 'utpcWithdrawMoney', {
      runtime: Runtime.PYTHON_3_9, 
      handler: 'main.lambda_handler',
      code: Code.fromAsset(path.join(__dirname, './microservices/utpcWithdrawMoney')),
      functionName: 'utpcWithdrawMoney',
      timeout: Duration.minutes(1),
      layers: [mysqlConnectorLayer],
      role: utpcRole,
      environment: {
        ENV_HOST_MYSQL: process.env.ENV_HOST_MYSQL || 'default-value',
        ENV_USER_MYSQL: process.env.ENV_USER_MYSQL || 'default-value',
        ENV_PASSWORD_MYSQL: process.env.ENV_PASSWORD_MYSQL || 'default-value',
        ENV_DATABASE_MYSQL: process.env.ENV_DATABASE_MYSQL || 'default-value',
        ENV_PORT_MYSQL: process.env.ENV_PORT_MYSQL || 'default-value',
        ENV_SES_EMAIL_FROM: process.env.ENV_SES_EMAIL_FROM || 'default-value', //FROM process.env.ENV_SES_REGION || 'default-value',
      },
    });
    // Environment: variables de entorno para la funcion lambda, que se utilizan para almacenar valores de configuracion
    const utpcChangeDCardKey = new Function(this, 'utpcChangeDCardKey', {
      runtime: Runtime.PYTHON_3_9, 
      handler: 'main.lambda_handler',
      code: Code.fromAsset(path.join(__dirname, './microservices/utpcChangeDCardKey')),
      functionName: 'utpcChangeDCardKey',
      timeout: Duration.minutes(1),
      layers: [mysqlConnectorLayer],
      role: utpcRole,
      environment: {
        ENV_HOST_MYSQL: process.env.ENV_HOST_MYSQL || 'default-value',
        ENV_USER_MYSQL: process.env.ENV_USER_MYSQL || 'default-value',
        ENV_PASSWORD_MYSQL: process.env.ENV_PASSWORD_MYSQL || 'default-value',
        ENV_DATABASE_MYSQL: process.env.ENV_DATABASE_MYSQL || 'default-value',
        ENV_PORT_MYSQL: process.env.ENV_PORT_MYSQL || 'default-value',
        ENV_SES_EMAIL_FROM: process.env.ENV_SES_EMAIL_FROM || 'default-value', //FROM process.env.ENV_SES_REGION || 'default-value',
      },
    });

    const verifyEmail = new Function(this, 'verifyEmail', {
      runtime: Runtime.PYTHON_3_9, 
      handler: 'main.lambda_handler',
      code: Code.fromAsset(path.join(__dirname, './microservices/verifyEmail')),
      functionName: 'verifyEmail',
      timeout: Duration.minutes(1),
      role: utpcRole,
      environment: {
        ENV_SES_EMAIL_FROM: process.env.ENV_SES_EMAIL_FROM || 'default-value', //FROM process.env.ENV_SES_REGION || 'default-value',
      },
    });

    const utpcCreateDDL = new Function(this, 'utpcCreateDDL', {
      runtime: Runtime.PYTHON_3_9, 
      handler: 'main.lambda_handler',
      code: Code.fromAsset(path.join(__dirname, './microservices/utpcCreateDDL')),
      functionName: 'utpcCreateDDL',
      timeout: Duration.minutes(1),
      layers: [mysqlConnectorLayer],
      role: utpcRole,
      environment: {
        ENV_HOST_MYSQL: process.env.ENV_HOST_MYSQL || 'default-value',
        ENV_USER_MYSQL: process.env.ENV_USER_MYSQL || 'default-value',
        ENV_PASSWORD_MYSQL: process.env.ENV_PASSWORD_MYSQL || 'default-value',
        ENV_DATABASE_MYSQL: process.env.ENV_DATABASE_MYSQL || 'default-value',
        ENV_PORT_MYSQL: process.env.ENV_PORT_MYSQL || 'default-value',
      },
    });

// Creacion de la API Gateway con configuracion de metricas y logs y habilitacion de trazabilidad de datos//

    const utpcApi = new RestApi(this, `utpcApi`, {
      restApiName: `utpc-api`,
      deployOptions: {
        metricsEnabled: true,
        loggingLevel: MethodLoggingLevel.INFO, 
        dataTraceEnabled: true,
      },
      cloudWatchRole: true,
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: ["OPTIONS", "GET", "POST", "PUT", "PATCH", "DELETE"],
        allowHeaders: Cors.DEFAULT_HEADERS, 
      },
    });

    //Crear recursos para las nuevas APIS//
    // Integracion de Lambda con la API Gateway//
    const createUtpcDepositMoney = new LambdaIntegration(utpcDepositMoney, 
      {allowTestInvoke: false,});

    const createUtpcWithdrawMoney = new LambdaIntegration(utpcWithdrawMoney,
      {allowTestInvoke: false,});

    const createUtpcChangeDCardKey = new LambdaIntegration(utpcChangeDCardKey,
      {allowTestInvoke: false,});

    const createUtpcCreateDDL = new LambdaIntegration(utpcCreateDDL,
      {allowTestInvoke: false,});

    const createVerifyEmail = new LambdaIntegration(verifyEmail,
      {allowTestInvoke: false,});
    // crea integraciones para cada funcion lambda se puedan invocar a traves de API Gateway

    //Crear metodos y recursos para las nuevas APIS Gateway//

    const resourceUtpcDepositMoney = utpcApi.root.addResource("utpcDepositMoney");
    resourceUtpcDepositMoney.addMethod("POST", createUtpcDepositMoney); 

    const resourceUtpcWithdrawMoney = utpcApi.root.addResource("utpcWithdrawMoney");
    resourceUtpcWithdrawMoney.addMethod("POST", createUtpcWithdrawMoney);

    const resourceUtpcChangeDCardKey = utpcApi.root.addResource("utpcChangeDCardKey");
    resourceUtpcChangeDCardKey.addMethod("POST", createUtpcChangeDCardKey);

    const resourceUtpcCreateDDL = utpcApi.root.addResource("utpcCreateDDL");
    resourceUtpcCreateDDL.addMethod("POST", createUtpcCreateDDL);

    const resourceVerifyEmail = utpcApi.root.addResource("verifyEmail");
    resourceVerifyEmail.addMethod("POST", createVerifyEmail);

  } // addMethod configura el metodo HTTP "POST" para cada recurso, asociado la integracion de Lambda
}
