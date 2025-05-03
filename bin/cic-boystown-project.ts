#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CicBoystownProjectStack } from '../lib/cic-boystown-project-stack';

const app = new cdk.App();
new CicBoystownProjectStack(app, 'CicBoystownProjectStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1'
  },
});