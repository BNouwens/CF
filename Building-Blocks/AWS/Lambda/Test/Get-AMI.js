/**
* A sample Lambda function that looks up the latest Windows AMI ID 
* for a given region and Windows AMI base name.
*
*   This Lambda script will only update Auto Scaling Groups deined via a CloudFormation stack
*   Also the CloudFormation Stack must have a paramater "AMI" as this script updates that paramater.
*
* Process:
*   Need to update OS patterns for operating systems in use
*   Need to update Cloud Formation To Update
*

Test Parameters: - Needs tweeking
{
  "RequestType": "Save",
  "ASG": "TEMP",
  "Stack": "BN-ASGWeb",
  "AccountID": "<account-id>",
  "Region": "<region>",
  "ResourceProperties": {
    "OSName": "DC Windows 2016"
  }
}
**/

// Map display OS names to AMI name patterns

var osNameToPattern = {
    "DC Windows 2016": "DC Windows 2016*",
    "DC Windows 2012R2": "DC Windows 2012R2*",
};

var cfToUpdate = "BN-ASGWeb";

var aws = require("aws-sdk");

exports.handler = function (event, context) {
    console.log("REQUEST RECEIVED:\n" + JSON.stringify(event));

    // For Delete requests, immediately send a SUCCESS response.
    if (event.RequestType == "Delete") {
        sendResponse(event, context, "SUCCESS");
        return;
    }

    var responseStatus = "FAILED";
    var responseData = {};
    var osBaseName = osNameToPattern[event.ResourceProperties.OSName];

    console.log("OS: " + event.ResourceProperties.OSName + " -> " + osBaseName);

    var ec2 = new aws.EC2({ region: event.ResourceProperties.Region });
    var describeImagesParams = {
        Filters: [{ Name: "name", Values: [osBaseName] }],
        Owners: [event.AccountID]
    };

    console.log("Calling describeImages...");

    // Get the available AMIs for the specified Windows version.

    // ---------------------        FIND AMI        -------------------------------
    var requestDescribeImages = ec2.describeImages(describeImagesParams)
    requestDescribeImages.on('success', function (describeImagesResult) {
        console.log("Got a response back from the server");
        var images = describeImagesResult.data.Images;

        console.log("Got " + images.length + " images back");

        // Sort the images by descending creation date order so the
        // most recent image is first in the array.
        images.sort(function (x, y) {
            return x.CreationDate < y.CreationDate;
        });

        for (var imageIndex = 0; imageIndex < images.length; imageIndex++) {
            responseStatus = "SUCCESS";
            responseData["Id"] = images[imageIndex].ImageId;
            responseData["Name"] = images[imageIndex].Name;
            console.log("Found: " + images[imageIndex].Name + ", " + images[imageIndex].ImageId);
            break;
        }
    });
    requestDescribeImages.on('error', function (error, response) {
        console.log(error);
    });
    requestDescribeImages.on('complete', function () {
        // Create Cloudfront API reference
        var cloudformation = new aws.CloudFormation({ apiVersion: '2010-05-15' });
        var stackParams = {
            StackName: cfToUpdate,
            UsePreviousTemplate: true,
            Parameters: [

            ]
        };
        //console.log(stackParams)
        console.log("Starting Stack Update")

        var params = {
            StackName: cfToUpdate
        };

        // ----------------------         DESCRIBE STACK         ---------------------
        var requestDescribeStack = cloudformation.describeStacks(params)
        requestDescribeStack.on('success', function (response) {

            console.log("Creating Array of Params in CF");
            console.log(response.data);
            const stacks = response.data['Stacks'];

            stackDescription = stacks[0];

            for (var paramsIndex = 0; paramsIndex < stackDescription.Parameters.length; paramsIndex++) {
                var objParam = new Object();
                if (stackDescription.Parameters[paramsIndex].ParameterKey == "AMI") {
                    objParam.ParameterKey = stackDescription.Parameters[paramsIndex].ParameterKey;
                    objParam.ParameterValue = responseData["Id"];
                }
                else {
                    objParam.ParameterKey = stackDescription.Parameters[paramsIndex].ParameterKey;
                    objParam.UsePreviousValue = true;
                    //objParam.ParameterValue = stackDescription.Parameters[paramsIndex].ParameterValue;
                }
                stackParams.Parameters.push(objParam);
            }
        });
        requestDescribeStack.on('error', function (error, response) {
            console.log(error);
        })
        requestDescribeStack.on('complete', function () {
            console.log("Completed Get Stack");
            console.log(stackParams);

            // ----------------------         UPDATE STACK      ---------------------
            var requestUpdateStack = cloudformation.updateStack(stackParams)
            requestUpdateStack.on('success', function (response) {


            });
            requestUpdateStack.on('error', function (error, response) {
                console.log(error);
            });
            requestUpdateStack.on('complete', function () {
                console.log("All Done");
            });
            requestUpdateStack.send();
        })
        requestDescribeStack.send();
    })
    requestDescribeImages.send()

};

    /*
    // Send response to the pre-signed S3 URL 
    function sendResponse(event, context, responseStatus, responseData) {
    
        var responseBody = JSON.stringify({
            Status: responseStatus,
            Reason: "See the details in CloudWatch Log Stream: " + context.logStreamName,
            PhysicalResourceId: context.logStreamName,
            StackId: event.StackId,
            RequestId: event.RequestId,
            LogicalResourceId: event.LogicalResourceId,
            Data: responseData
        });
    
        console.log("RESPONSE BODY:\n", responseBody);
    
        var https = require("https");
        var url = require("url");
    
        var parsedUrl = url.parse(event.ResponseURL);
        var options = {
            hostname: parsedUrl.hostname,
            port: 443,
            path: parsedUrl.path,
            method: "PUT",
            headers: {
                "content-type": "",
                "content-length": responseBody.length
            }
        };
    
        console.log("SENDING RESPONSE...\n");
    
        var request = https.request(options, function(response) {
            console.log("STATUS: " + response.statusCode);
            console.log("HEADERS: " + JSON.stringify(response.headers));
            // Tell AWS Lambda that the function execution is done  
            context.done();
        });
    
        request.on("error", function(error) {
            console.log("sendResponse Error:" + error);
            // Tell AWS Lambda that the function execution is done  
            context.done();
        });
    
        // write data to request body
        request.write(responseBody);
        request.end();
    }
    */