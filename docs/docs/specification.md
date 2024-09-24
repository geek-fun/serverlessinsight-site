# ServerlessInsight Specification

This document outlines the specification of the ServerlessInsight, details the yaml definition for Iac(Infrastructure as
Code), and the runtime API for the ServerlessInsight.

## Sample of a ServerlessInsight Iac

> stack.yml

```yaml
version: 0.1
provider: aliyun

vars:
  region: cn-hangzhou
  account_id: 1234567890

stages:
  dev:
    region: ${vars:region}
    account_id: ${vars:account_id}

service: insight-poc

tags:
  owner: geek-fun

functions:
  insight_poc_fn:
    fc_name: insight-poc-fn
    runtime: nodejs14
    handler: index.handler
    code: artifact.zip
    memory: 128
    timeout: 10
    environment:
      NODE_ENV: production

gateway:
  insight_poc_api:
    type: api
    name: insight-poc-api
    description: insight poc api
    protocol: HTTP
    method: GET
events:
  sqs_event:
    type: sqs
    source: insight-poc-sqs
    function: insight_poc_fn
    batch_size: 10
    enabled: true
    target: insight-poc-fn
  apigateway_event:
    type: apigatewy
    source: insight-poc-api
    function: insight_poc_fn
    method: GET
    target: insight-poc-fn

```

## Concepts
Please use only lowercase letters, numbers and hyphens. Also, keep Service names short, since they are added into the name of each cloud resource the Serverless Framework creates, and some cloud resources have character length restrictions in their names.
### Version

The version of the ServerlessInsight Iac, the version is used to define the compatibility of the Iac with the
ServerlessInsight runtime.

### Vars
the vars section is used to define the variables that can be used in the Iac, the vars can be used in the service, tags,
functions, gateway, and events sections by ${vars:var_name}.
### Functions

The compute unit of serverless functions that code is deployed and executed in cloud providers.

Each function is an independent unit of execution and deployment, like a microservice. A function is merely code,
deployed in the cloud, that is most often written to perform a single job.

### Events

Events are triggers that cause a function to execute. Events can be anything from an HTTP request to a file upload to a
scheduled task.
