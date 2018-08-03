# AWS Cfn Custom Resources

This repo contain sources for Bagubagu's made AWS Custom Resources.

| Custom Resource         | Arn                                                                         |
| ----------------------- | --------------------------------------------------------------------------- |
| Custom::GetHostedZoneId | arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:function:cfnGetHostedZoneId |
| please::add::more       | see::develop                                                                |

## Usage

First, you need to publish these custom resources into your AWS project account. Use the following launch button:

[![Launch Button](assets/cloudformation-launch-stack-button.png)](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/new?stackName=custom-resources&templateURL=https://s3.amazonaws.com/bagubagu-cfn-templates/aws-cfn-custom-resources.template)

Then use the custom resources from cloudformation template.

```bash
Conditions:
  HostedZoneDoesNotExist: !Equals [!Ref GetHostedZoneId, ""]

Resources:
  GetHostedZoneId:
    Type: Custom::GetHostedZoneId
    Properties:
      HostedZone: monyet.com
      ServiceToken: !Sub "arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:function:cfnGetHostedZoneId"

  MyHostedZone:
    Type: AWS::Route53::HostedZone
    Condition: HostedZoneDoesNotExist
    Properties:
      Name: !Ref monyet.com
```

## Develop

### Requirements

- AWS CLI already configured with at least PowerUser permission
- [NodeJS 8.10+ installed](https://nodejs.org/en/download/)
- [Docker installed](https://www.docker.com/community-edition)

### Scripts

```
# deploy the lambdas into the account using cloudformation
npm run deploy

# remove the cloudformation stack
npm run delete

# develop with tdd
npm test
```

### Directory structure:

```bash
.
├── README.md                   <-- This instructions file
├── package.json                <-- NodeJS dependencies
├── tsconfig.json               <-- Typescript configuration file
├── jest.config.js              <-- Jest configuration file
├── template.yml                <-- SAM template
├── src                         <-- Source codes in Typescript
│   └── get-hosted-zone-id
│       ├── get-hosted-zone-id.ts
│       └── __tests__
│           └── get-hosted-zone-id.spec.ts
├── dist                        <-- Autogenerated distribution codes
│   └── get-hosted-zone-id
│       └── get-hosted-zone-id.js
```

## References:

- https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-lambda-function-code.html
- https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/template-custom-resources-lambda.html
- https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html
