// References:
// https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html
// https://aws.amazon.com/premiumsupport/knowledge-center/best-practices-custom-cf-lambda/

import { Route53 } from "aws-sdk";
import { CloudFormationCustomResourceHandler } from "aws-lambda";
import * as https from "https";
import * as url from "url";

export const handler: CloudFormationCustomResourceHandler = async (
  event,
  context
) => {
  // Validate inputs

  if (!event.ResourceProperties.HostedZone) {
    throw new Error("Parameter HostedZone is required");
  }

  // Main logic

  switch (event.RequestType) {
    case "Create":
    case "Update":
      try {
        const id = await getHostedZoneId(event.ResourceProperties.HostedZone);
        await sendResponse(event, context, "SUCCESS", {}, id);
      } catch (err) {
        await sendResponse(event, context, "SUCCESS", {}, "");
        // throw err;
      }
      break;

    default:
      try {
        await sendResponse(event, context, "SUCCESS", {}, "");
      } catch (err) {
        await sendResponse(event, context, "SUCCESS", {}, "");
      }
  }
};

async function getHostedZoneId(hostedZoneName) {
  const r53 = new Route53();
  let hostedZones: any;
  let hostedZoneId = "";

  try {
    hostedZones = await r53.listHostedZones().promise();
  } catch (err) {
    throw err;
  }

  const filteredZones = hostedZones.HostedZones.filter(
    hostedZone => hostedZone.Name === `${hostedZoneName}.`
  );

  if (filteredZones.length > 0) {
    const id = filteredZones[0].Id;
    hostedZoneId = id.replace(/\/hostedzone\//g, "");
  }

  return hostedZoneId;
}

async function sendResponse(
  event,
  context,
  responseStatus,
  responseData?,
  physicalResourceId?,
  noEcho?
) {
  const responseBody = JSON.stringify({
    Status: responseStatus,
    Reason:
      "See the details in CloudWatch Log Stream: " + context.logStreamName,
    PhysicalResourceId: physicalResourceId || context.logStreamName,
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
    NoEcho: noEcho || false,
    Data: responseData
  });

  const parsedUrl = url.parse(event.ResponseURL);

  const options = {
    hostname: parsedUrl.hostname,
    port: 443,
    path: parsedUrl.path,
    method: "PUT",
    headers: {
      "content-type": "",
      "content-length": responseBody.length
    }
  };

  const request = https.request(options, function(response) {
    console.log("Status code: " + response.statusCode);
    console.log("Status message: " + response.statusMessage);
  });

  request.on("error", function(error) {
    console.log("send(..) failed executing https.request(..): " + error);
    throw error;
  });

  request.write(responseBody);
  request.end();
}
