import { config, S3, SharedIniFileCredentials } from "aws-sdk";
import { handler } from "../get-hosted-zone-id";
import { CloudFormationCustomResourceCreateEvent, Context } from "aws-lambda";

const createEvent: CloudFormationCustomResourceCreateEvent = {
  // https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/crpg-ref-requesttypes-create.html
  RequestType: "Create",
  ServiceToken:
    "arn:aws:lambda:us-east-1:360017275348:function:cfnGetHostedZoneId",
  ResponseURL:
    "https://louislarry-foo.s3.amazonaws.com/foo?AWSAccessKeyId=AKIAJTGWHT4S2YZ5JWEA&Expires=1532893091&Signature=gzCfQNlWwinQnEyyuzkU5Fe1cTQ%3D",
  StackId:
    "arn:aws:cloudformation:us-east-1:360017275348:stack/custom-resources/0d215c50-9271-11e8-bc0f-50fae98974fd",
  RequestId: "226db51b-dcf7-4dad-aeb9-f8a55c527dae",
  LogicalResourceId: "GetHostedZoneId",
  ResourceType: "Custom::GetHostedZoneId",
  ResourceProperties: {
    HostedZone: "bakasang.com",
    ServiceToken:
      "arn:aws:lambda:us-east-1:360017275348:function:cfnGetHostedZoneId"
  }
};

const context: Context = {
  // https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html
  getRemainingTimeInMillis() {
    return 100;
  },
  callbackWaitsForEmptyEventLoop: true,
  functionName: "foo",
  functionVersion: "1.0",
  invokedFunctionArn: "xxx",
  memoryLimitInMB: 128,
  awsRequestId: "xxx",
  logGroupName: "xxx",
  logStreamName: "xxx",
  identity: null,
  clientContext: null,
  done() {},
  fail() {},
  succeed() {}
};

config.region = "us-east-1";
const credentials = new SharedIniFileCredentials();
const s3 = new S3({ credentials });

test.skip("create hostedZone", done => {
  jest.setTimeout(15000);
  expect.assertions(2);

  const params = { Bucket: "louislarry-foo", Key: "foo" };

  s3.getSignedUrl("putObject", params, async function(err, url) {
    expect(err).toBeNull();

    createEvent.ResponseURL = url;
    createEvent.RequestType = "Create";
    await handler(createEvent, context, () => {});
    const foo = await s3.getObject(params).promise();
    const fooJson = JSON.parse(foo.Body.toString());

    expect(fooJson.PhysicalResourceId).toEqual("Z334TN12A9PKAC");
    done();
  });
});

test("Parameter HostedZone is required", async () => {
  const event = { ...createEvent, ResourceProperties: { ServiceToken: "xxx" } };

  try {
    await handler(event, context, () => {});
  } catch (err) {
    expect(err).toBeDefined();
  }
});
