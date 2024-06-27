#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { UtpcCdkStack } from '../lib/utpc-cdk-stack';

const app = new cdk.App();
new UtpcCdkStack(app, 'UtpcCdkStack', {

});