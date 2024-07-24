import * as cdk from 'aws-cdk-lib';
import { Role, ServicePrincipal, ManagedPolicy, PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import { Function, Runtime, Code, LayerVersion } from 'aws-cdk-lib/aws-lambda';
import { RestApi, Cors, MethodLoggingLevel, LambdaIntegration } from 'aws-cdk-lib/aws-apigateway';
import { Duration } from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import path = require('path');
import * as dotenv from 'dotenv';



dotenv.config();

export class UtpcCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //Creacion del rol

    const utpcRole = new Role(this, 'utpcRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'), 
      roleName: 'utpcRole',
      description: 'role for utpc micro',
    });

    utpcRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AWSLambda_FullAccess'));
    utpcRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('CloudWatchLogsFullAccess'));
    utpcRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonSESFullAccess')); //permisos para mandar mails


    

    //   Contruccion de la capa mysqlConnector//

    const mysqlConnectorLayer = new LayerVersion(this, 'mysqlconnector', {
      code: Code.fromAsset(path.join(__dirname, './layers/mysqlConnector')), 
      compatibleRuntimes: [Runtime.PYTHON_3_9],
      description: 'mysqlConnector library layer',
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    //aqui contruire mi nuevas function lambdas///

    const utpcDepositMoney = new Function(this, 'utpcDepositMoney', {
      runtime: Runtime.PYTHON_3_9, 
      handler: 'main.lambda_handler',
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

    //Crear nuvas APIS/////

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


    //Crear metodos para las nuevas APIS//

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

  }
}
