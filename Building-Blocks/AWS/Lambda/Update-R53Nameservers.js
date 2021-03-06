/**
* A sample Lambda function that updates name servers based on ASG servers - However this process itself is not an appropriate fix for Domain Controllers
* Instead need to develop a process to update dhcp scope options.
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

Second Test Scenario

{
    "Records": [
        {
            "EventSource": "aws:sns",
            "EventVersion": "1.0",
            "EventSubscriptionArn": "arn:aws:sns:ap-southeast-2:760584908251:BN-ASGWeb-NotificationTopic-DVTJWCPYO9O3:1722eb94-7428-4dfa-8831-e8dc2ae52bc7",
            "Sns": {
                "Type": "Notification",
                "MessageId": "ed0c706a-63ad-540a-85fe-221e069bff2e",
                "TopicArn": "arn:aws:sns:ap-southeast-2:760584908251:BN-ASGWeb-NotificationTopic-DVTJWCPYO9O3",
                "Subject": "Auto Scaling: termination for group \"BN-ASGWeb-WebServerGroup-1OJURPJHPWZ5Z\"",
                "Message": "{\"Progress\":50,\"AccountId\":\"760584908251\",\"Description\":\"Terminating EC2 instance: i-0a8a12a0d5e2163ea\",\"RequestId\":\"64ab47cb-8317-40ca-a916-125208fa39b0\",\"EndTime\":\"2017-11-02T00:12:38.343Z\",\"AutoScalingGroupARN\":\"arn:aws:autoscaling:ap-southeast-2:760584908251:autoScalingGroup:5b9a996c-5129-4fa2-9f3e-b6e2040e9ddc:autoScalingGroupName/BN-ASGWeb-WebServerGroup-1OJURPJHPWZ5Z\",\"ActivityId\":\"64ab47cb-8317-40ca-a916-125208fa39b0\",\"StartTime\":\"2017-11-02T00:11:28.761Z\",\"Service\":\"AWS Auto Scaling\",\"Time\":\"2017-11-02T00:12:38.343Z\",\"EC2InstanceId\":\"i-0a8a12a0d5e2163ea\",\"StatusCode\":\"InProgress\",\"StatusMessage\":\"\",\"Details\":{\"Subnet ID\":\"subnet-048a6460\",\"Availability Zone\":\"ap-southeast-2b\"},\"AutoScalingGroupName\":\"BN-ASGWeb-WebServerGroup-1OJURPJHPWZ5Z\",\"Cause\":\"At 2017-11-02T00:11:09Z a user request update of AutoScalingGroup constraints to min: 1, max: 1, desired: 1 changing the desired capacity from 4 to 1.  At 2017-11-02T00:11:28Z an instance was taken out of service in response to a difference between desired and actual capacity, shrinking the capacity from 4 to 1.  At 2017-11-02T00:11:28Z instance i-07bdd327dee78c4b9 was selected for termination.  At 2017-11-02T00:11:28Z instance i-0a8a12a0d5e2163ea was selected for termination.  At 2017-11-02T00:11:28Z instance i-00bc8fcdfe335ed63 was selected for termination.\",\"Event\":\"autoscaling:EC2_INSTANCE_TERMINATE\"}",
                "Timestamp": "2017-11-02T00:12:38.423Z",
                "SignatureVersion": "1",
                "Signature": "DDvF/GZlzyF3Ix7HsMDmuBasUlS6ccFDRMhsPSRtPeC1H5w5zb5BBgaoHV5wizqzlbGDQW2h834VUKO9z1rIXiFo74dE+ei5TDmhbbEnTHua4xd17P10KwNSPkl7Ez03TOw6vVD7Tb3eDqi96Kp3r9M7UoWv3z2Rsn9m8q/YXeru+J1n69owcSkLJYQif60s6O6CipW4jQYRwXUEZ4+TFsRkTmTWcv3PAcYpwD4Uatz2H5TxPssKoWOsOBhV9QmW7ndPFDV/N/zke+GMJSWn4/1ZTzOHFAmQ8/mv3t4n/+B0RpEDbtlYkqWb0qjFgtTUDwbGExXgDwmNwyuYSmdmjQ==",
                "SigningCertUrl": "https://sns.ap-southeast-2.amazonaws.com/SimpleNotificationService-433026a4050d206028891664da859041.pem",
                "UnsubscribeUrl": "https://sns.ap-southeast-2.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=arn:aws:sns:ap-southeast-2:760584908251:BN-ASGWeb-NotificationTopic-DVTJWCPYO9O3:1722eb94-7428-4dfa-8831-e8dc2ae52bc7",
                "MessageAttributes": {}
            }
        }
    ]
}
**/

//NAME Server Params TEMP - to be moved into a lookup
var varDomain = "bntest.local"
var varZoneId = "Z2Z4B9I5E0XMAB"

var aws = require("aws-sdk");
var autoscaling = new aws.AutoScaling({ apiVersion: '2011-01-01' });
var ec2 = new aws.EC2();
var route53 = new aws.Route53({ region: 'us-east-1' });

//Creating a function for finding Instance IP --------------------------------------------------
function getInstanceIP(instanceID) {
    return new Promise((resolve, reject) => {

        //if (err) return reject(err);
        var ec2 = new aws.EC2();

        ec2.describeInstances(instanceID, function (err, data) {
            if (err) {
                reject(err);
            } else {
                const instances = data.Reservations;
                describeInstancesIP = instances[0].Instances[0].PrivateIpAddress;
                var instanceIP = describeInstancesIP;
                resolve(instanceIP);
            }
        });
    })
}

exports.handler = function (event, context, callback) {
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
    console.log("REQUEST RECEIVED:\n" + JSON.stringify(event));

    // For Delete requests, immediately send a SUCCESS response.
    if (event.RequestType == "Delete") {
        sendResponse(event, context, "SUCCESS");
        return;
    }
    var responseStatus = "FAILED";
    var responseData = {};
    
    // --------- Building EVENT data ---------    
    var message = event['Records'][0]['Sns']['Message']  
       
    var asgName = JSON.parse(message);
    console.log(asgName.AutoScalingGroupName);
    //var asgName = message.AccountId;
    //console.log(asgName);

    //var asgName = event.Records[0].Sns;
    //console.log("ASG NAME TO BE UPDATED = " + asgName);
          
    
    var paramsASG = {
        AutoScalingGroupNames: [
            asgName.AutoScalingGroupName
            /* more items */
        ],
    };

    autoscaling.describeAutoScalingGroups(paramsASG).promise()
        .then((response) => {

            console.log(response);           // successful response
            const asgs = response['AutoScalingGroups'];
            // TO ADD LATER asgInstances.LifecycleState = "InService"
            asgInstances = asgs[0];
            console.log("List of Instances");
            const promises = [];
            asgInstances.Instances.forEach(instance => {
                console.log(instance.InstanceId);
                var paramsInstance = {
                    InstanceIds: [
                        instance.InstanceId
                    ],
                };
                // -----------------  DESCRIBE EC2 --------------------------
                promises.push(getInstanceIP(paramsInstance));
            })
            return Promise.all(promises)
        }).then(results => {
            results.forEach(value => {
                var objParam = new Object();
                objParam.Value = value;
                paramNameServers.ChangeBatch.Changes[0].ResourceRecordSet.ResourceRecords.push(objParam);
            })
            console.log(paramNameServers.ChangeBatch.Changes[0].ResourceRecordSet);
            return route53.changeResourceRecordSets(paramNameServers).promise();
        }).then(() => {
            console.log('Im all finished');
            callback(null);
        }).catch(err => {
            console.log('Something went really wrong')
            callback(err);
        })

    //.then(function (instanceIP) { return getInstanceIP(instanceIP, 'actualValue') })
    //.then(function (value) { console.log('Value from function = ' + value); })

    /*
    // ----------------------         UPDATE R53 Name Servers      ---------------------
    var route53 = new aws.Route53({ region: 'us-east-1' });

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
*/
    // ----------------------      END UPDATE R53 Name Servers      ---------------------

};
