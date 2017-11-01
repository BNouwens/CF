/**
* A sample Lambda function that updates name servers based on ASG servers
* 
* Process:
* 

Test Parameters: - Needs tweeking (and updating for this code)
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

//NAME Server Params TEMP - to be moved into a lookup
var paramNameServers = {
    DomainName: 'bntest.local.', /* required */
    Nameservers: [ /* required */
        {
            Name: 'ns1.bntest.local.', /* required */
            GlueIps: [
                '10.10.10.10',
                /* more items */
            ]
        },
        /* more items */
    ],
    FIAuthKey: 'FIAuthKey'
};

var paramsUnlockDomain = {
    DomainName: 'bntest.local.' /* required */
};

var aws = require("aws-sdk");
// aws --region us-east-1 route53domains list-domains

exports.handler = function (event, context) {
    console.log("REQUEST RECEIVED:\n" + JSON.stringify(event));

    // For Delete requests, immediately send a SUCCESS response.
    if (event.RequestType == "Delete") {
        sendResponse(event, context, "SUCCESS");
        return;
    }

    var responseStatus = "FAILED";
    var responseData = {};

    // ----------------------         UPDATE R53 Name Servers      ---------------------
    var route53domains = new aws.Route53Domains({ region: 'us-east-1' });



    var requestR53unlock = route53domains.disableDomainTransferLock(paramsUnlockDomain);
    requestR53unlock.on('success', function (response) {
        console.log("Unlock Success");

    });
    requestR53unlock.on('error', function (error, response) {
        console.log("Unlock FAILED");
        console.log(error);
    });
    requestR53unlock.on('complete', function () {

        console.log("Request Unlocked - Starting Update");
        var requestUpdateNameServers = route53domains.updateDomainNameservers(paramNameServers);

        requestUpdateNameServers.on('success', function (response) {
            console.log("Update Success");
        });
        requestUpdateNameServers.on('error', function (error, response) {
            console.log("Update FAILED");
            console.log(error);
        });
        requestUpdateNameServers.on('complete', function () {
            console.log("All Done");
        });
        requestUpdateNameServers.send();
    });
    requestR53unlock.send();



};
