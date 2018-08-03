"use strict";
// References:
// https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html
// https://aws.amazon.com/premiumsupport/knowledge-center/best-practices-custom-cf-lambda/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const aws_sdk_1 = require("aws-sdk");
const https = require("https");
const url = require("url");
exports.handler = (event, context) => __awaiter(this, void 0, void 0, function* () {
    // Validate inputs
    if (!event.ResourceProperties.HostedZone) {
        throw new Error("Parameter HostedZone is required");
    }
    // Main logic
    switch (event.RequestType) {
        case "Create":
        case "Update":
            try {
                const id = yield getHostedZoneId(event.ResourceProperties.HostedZone);
                yield sendResponse(event, context, "SUCCESS", {}, id);
            }
            catch (err) {
                yield sendResponse(event, context, "SUCCESS", {}, "");
                // throw err;
            }
            break;
        default:
            try {
                yield sendResponse(event, context, "SUCCESS", {}, "");
            }
            catch (err) {
                yield sendResponse(event, context, "SUCCESS", {}, "");
            }
    }
});
function getHostedZoneId(hostedZoneName) {
    return __awaiter(this, void 0, void 0, function* () {
        const r53 = new aws_sdk_1.Route53();
        let hostedZones;
        let hostedZoneId = "";
        try {
            hostedZones = yield r53.listHostedZones().promise();
        }
        catch (err) {
            throw err;
        }
        const filteredZones = hostedZones.HostedZones.filter(hostedZone => hostedZone.Name === `${hostedZoneName}.`);
        if (filteredZones.length > 0) {
            const id = filteredZones[0].Id;
            hostedZoneId = id.replace(/\/hostedzone\//g, "");
        }
        return hostedZoneId;
    });
}
function sendResponse(event, context, responseStatus, responseData, physicalResourceId, noEcho) {
    return __awaiter(this, void 0, void 0, function* () {
        const responseBody = JSON.stringify({
            Status: responseStatus,
            Reason: "See the details in CloudWatch Log Stream: " + context.logStreamName,
            // PhysicalResourceId: physicalResourceId || context.logStreamName,
            PhysicalResourceId: physicalResourceId,
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
        const request = https.request(options, function (response) {
            console.log("Status code: " + response.statusCode);
            console.log("Status message: " + response.statusMessage);
        });
        request.on("error", function (error) {
            console.log("send(..) failed executing https.request(..): " + error);
            throw error;
        });
        request.write(responseBody);
        request.end();
    });
}
