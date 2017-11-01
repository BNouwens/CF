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
var varDomain = "bntest.local"
var varZoneId = "Z2Z4B9I5E0XMAB"

var paramNameServers = {
    ChangeBatch: {
        Changes: [
            {
                Action: "UPSERT",
                ResourceRecordSet: {
                    Name: varDomain,
                    ResourceRecords: [

                    ],
                    TTL: 60,
                    Type: "NS"
                }
            }
        ],
        Comment: "Name Servers"
    },
    HostedZoneId: varZoneId
};
// FROM ABOVE in ResourceRecords
// {
//Value: ""
//}

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

    var paramsASG = {
        AutoScalingGroupNames: [
            'BN-ASGWeb-WebServerGroup-1OJURPJHPWZ5Z',
            /* more items */
        ],
    };

    //Creating a function for finding Instance IP --------------------------------------------------
    function getInstanceIP(instanceID) {
        return new Promise((resolve, reject) => {
            console.log("I HAVE MADE IT TO THE FUNCTION");
            //if (err) return reject(err);
            var ec2 = new aws.EC2();
            //var objParam = new Object();
            //var instanceIP = "10.1.1.1";
            ec2.describeInstances(instanceID, function (err, data) {
                if (err) console.log(err, err.stack); // an error occurred
                else {
                    const instances = data.Reservations;
                    describeInstancesIP = instances[0].Instances[0].PrivateIpAddress;
                    //console.log(describeInstancesIP);
                    //objParam.Value = describeInstancesIP;
                    var instanceIP = describeInstancesIP;
                    //paramNameServers.ChangeBatch.Changes[0].ResourceRecordSet.ResourceRecords.push(objParam);
                    //const instances = instanceresponse.data['Reservations'];
                    //describeInstancesIP = instances[0].Instances[0].PrivateIpAddress;
                    //console.log(describeInstancesIP);
                    //objParam.Value = describeInstancesIP;
                    //paramNameServers.ChangeBatch.Changes[0].ResourceRecordSet.ResourceRecords.push(objParam);
                    //console.log(paramNameServers.ChangeBatch.Changes[0].ResourceRecordSet);
                    //console.log(paramNameServers);
                    resolve(instanceIP);
                }

                //console.log(data);           // successful response
            });

            //console.log(instanceIP);
            //resolve(instanceIP);
        })

    }

    var autoscaling = new aws.AutoScaling({ apiVersion: '2011-01-01' });

    var requestDescribeScale = autoscaling.describeAutoScalingGroups(paramsASG)
    requestDescribeScale.on('success', function (response) {

        console.log(response.data);           // successful response
        const asgs = response.data['AutoScalingGroups'];
        // TO ADD LATER asgInstances.LifecycleState = "InService"
        asgInstances = asgs[0];
        console.log("List of Instances");

        for (var i = 0; i < asgInstances.Instances.length; i++) {
            console.log(asgInstances.Instances[i].InstanceId);
            //var objParam = new Object();
            var ec2 = new aws.EC2();

            var paramsInstance = {
                InstanceIds: [
                    asgInstances.Instances[i].InstanceId,
                    /* more items */
                ],
            };

            // -----------------  DESCRIBE EC2 --------------------------

            /* OLD PROMISE ATTEMPT
                        var requestDescribeInstance = ec2.describeInstances(paramsInstance)
                        var result = requestDescribeInstance.promise();
                        result.then(function (instanceresponse) {
            
                            const instances = instanceresponse.Reservations;
                            describeInstancesIP = instances[0].Instances[0].PrivateIpAddress;
                            console.log(describeInstancesIP);
                            objParam.Value = describeInstancesIP;
                            paramNameServers.ChangeBatch.Changes[0].ResourceRecordSet.ResourceRecords.push(objParam);
                            //const instances = instanceresponse.data['Reservations'];
                            //describeInstancesIP = instances[0].Instances[0].PrivateIpAddress;
                            //console.log(describeInstancesIP);
                            //objParam.Value = describeInstancesIP;
                            //paramNameServers.ChangeBatch.Changes[0].ResourceRecordSet.ResourceRecords.push(objParam);
                            console.log(paramNameServers.ChangeBatch.Changes[0].ResourceRecordSet);
            
                        }, function (error) { });
            */
            // NEW PROMISE ATTEMPT
            getInstanceIP(paramsInstance)
                //.then(function (instanceIP) { return getInstanceIP(instanceIP, 'actualValue') })
                //.then(function (value) { console.log('Value from function = ' + value); })
                .then(function (value) {
                    var objParam = new Object();
                    objParam.Value = value;                    
                    paramNameServers.ChangeBatch.Changes[0].ResourceRecordSet.ResourceRecords.push(objParam);
                    console.log(paramNameServers.ChangeBatch.Changes[0].ResourceRecordSet);
                })






            /*
            requestDescribeInstance.on('success', function (instanceresponse) {
                const instances = instanceresponse.data['Reservations'];
                describeInstancesIP = instances[0].Instances[0].PrivateIpAddress;
                console.log(describeInstancesIP);
                objParam.Value = describeInstancesIP;
                paramNameServers.ChangeBatch.Changes[0].ResourceRecordSet.ResourceRecords.push(objParam);
                console.log(paramNameServers.ChangeBatch.Changes[0].ResourceRecordSet);
            }).on('error', function (error, instanceresponse) {
                console.log("------------ DESCRIBE INSTANCE FAILED ------------");
                console.log(error);
            }).on('complete', function () {
                console.log("DESCRIBE Instance Done");
            }).send();
            */

            // --------------- END DESCRIBE EC2 ------------------

            //Add entry to the parameters for updating R53
            //paramNameServers.ChangeBatch.Changes[0].ResourceRecordSet.ResourceRecords.push(objParam)


        }
        // ----------------------         UPDATE R53 Name Servers      ---------------------
        var route53 = new aws.Route53({ region: 'us-east-1' });

        //console.log(paramNameServers.ChangeBatch.Changes[0].ResourceRecordSet);

        console.log("------------ START UPDATE ------------");
        var requestUpdateNameServers = route53.changeResourceRecordSets(paramNameServers);

        requestUpdateNameServers.on('success', function (response) {
            console.log("------------ UPDATE SUCCESS ------------");
        }).on('error', function (error, response) {
            console.log("------------ UPDATE FAILED ------------");
            console.log(error);
        }).on('complete', function () {
            console.log("All Done");
        }).send();

        //console.log(instanceresponse.data.Instances);
        // ----------------------      END UPDATE R53 Name Servers      ---------------------

    }).on('error', function (error, response) {
        console.log("------------ DESCRIBE FAILED ------------");
        console.log(error);
    }).on('complete', function () {
        console.log("DESCRIBE Done");
    }).send();




    /*

    // ----------------------         UPDATE R53 Name Servers      ---------------------
    var route53 = new aws.Route53({ region: 'us-east-1' });

    //route53.changeResourceRecordSets(params, function (err, data) {

    console.log("------------ START UPDATE ------------");
    var requestUpdateNameServers = route53.changeResourceRecordSets(paramNameServers);

    requestUpdateNameServers.on('success', function (response) {
        console.log("------------ UPDATE SUCCESS ------------");
    });
    requestUpdateNameServers.on('error', function (error, response) {
        console.log("------------ UPDATE FAILED ------------");
        console.log(error);
    });
    requestUpdateNameServers.on('complete', function () {
        console.log("All Done");
    });
    requestUpdateNameServers.send();

    */

};
