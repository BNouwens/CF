var aws = require("aws-sdk");
// var ssm = new aws.SSM();
// var ec2 = new aws.EC2();

function getInventory(results, token) {
    return new Promise((resolve, reject) => {
        var ssm = new aws.SSM();
        var listInventory = [];

        var paramsInv = {
            MaxResults: 2,
            ResultAttributes: [
                {
                    TypeName: 'AWS:InstanceInformation' /* required */
                }
            ]
        };

        if (token) {
            paramsInv.NextToken = token
        }
        ssm.getInventory(paramsInv, function (err, data) {
            if (err) {
                if (err.code === 'ThrottlingException' || err.code === 'TooManyRequestsException') {
                    setTimeout(() => {
                        resolve(getInventory(results, token));
                    }, 1000);
                } else {
                    reject(err);
                }

            }
            else {

                if (data.NextToken) {
                    resolve(getInventory(results.concat(data.Entities), data.NextToken))
                }
                else {
                    resolve(results.concat(data.Entities))
                }
            }
        });
    })
}

function getInstanceCompliance(instanceID) {
    return new Promise((resolve, reject) => {
        var ssm = new aws.SSM();

        var params = {
            Filters: [
                {
                    Key: 'ComplianceType',
                    Type: 'EQUAL',
                    Values: [
                        'Patch',
                    ]
                },
                {
                    Key: 'InstanceId',
                    Type: 'EQUAL',
                    Values: [
                        instanceID,
                    ]
                }
            ],
            MaxResults: 50,
        };

        ssm.listResourceComplianceSummaries(params, function (err, data) {
            if (err) {
                reject(err)
            }
            else {
                const instanceSummary = data['ResourceComplianceSummaryItems'];
                summaryData = instanceSummary[0];
                resolve(summaryData);
                // console.log(summaryData);
            }
        });
    })
}




function describeInstancePatchForGroup(results, token) {
    return new Promise((resolve, reject) => {
        var ssm = new aws.SSM();
        var PatchGroup = process.env.PatchGroup;
        var params = {
            PatchGroup: PatchGroup,
            MaxResults: 1
        };
        if (token) {
            params.NextToken = token
        }
        ssm.describeInstancePatchStatesForPatchGroup(params, function (err, data) {
            if (err) {
                if (err.code === 'ThrottlingException' || err.code === 'TooManyRequestsException') {
                    setTimeout(() => {
                        resolve(describeInstancePatchForGroup(results, token));
                    }, 1000);
                } else {
                    reject(err);
                }
            }
            else {
                if (data.NextToken) {
                    resolve(describeInstancePatchForGroup(results.concat(data.InstancePatchStates), data.NextToken))
                }
                else {
                    resolve(results.concat(data.InstancePatchStates))
                }
            }
        });
    })
}

function patchGroups(results, token) {
    return new Promise((resolve, reject) => {
        var ssm = new aws.SSM();
        var params = {
            MaxResults: 50,
        };
        if (token) {
            params.NextToken = token
        }
        ssm.describePatchGroups(params, function (err, data) {
            if (err) {
                if (err.code === 'ThrottlingException' || err.code === 'TooManyRequestsException') {
                    setTimeout(() => {
                        resolve(patchGroups(results, token));
                    }, 1000);
                } else {
                    reject(err);
                }

            }
            else {
                if (data.NextToken) {
                    resolve(patchGroups(results.concat(data.Mappings[0].PatchGroup), data.NextToken))
                }
                else {
                    resolve(results.concat(data.Mappings[0].PatchGroup))
                }
            }
        });
    })
}

function sendSNS(message) {
    var sns = new aws.SNS();
    var topicArn = process.env.TopicArn;

    // var subject = accountId + " - Patch Details"
    var params = {
        Message: JSON.stringify(message),
        Subject: 'Patch Details',
        TopicArn: topicArn
    };
    sns.publish(params, function (err, data) {
        if (err) console.log(err, err.stack);
        else console.log(data);
    });
}

exports.handler = function (event, context, callback) {
    var invData;


    var err = function (err) {
        console.log(err);
    }
    var promises = [];
    // Query AWS Account ID for report
    ACCOUNT_ID = context.invokedFunctionArn.split(":")[4];
    const accountNumber = ACCOUNT_ID;
    instanceId = "i-0a5f610c359a70d3f";

    /*    getInventory([])
              .then(function (data) {
                  data.forEach(value => {
                      // console.log(JSON.stringify(value));
                      if (value.Data['AWS:InstanceInformation'].Content[0].InstanceStatus != "Terminated") {
                          promises.push(value.Data['AWS:InstanceInformation'].Content[0].InstanceId);
                          promises.push(getInstanceCompliance(value.Data['AWS:InstanceInformation'].Content[0].InstanceId));
      
                      }
                  });
                  Promise.all(promises)
                      .then(function (data) {
                          console.log(data);
                      })
              }).catch(function (err) { console.log(err) });
       */



    getInventory([])
        .then(function (data) {
            data.forEach(value => {
                if (value.Data['AWS:InstanceInformation'].Content[0].InstanceStatus != "Terminated") {
                    promises.push(getInstanceCompliance(value.Id));
                }
            });
            Promise.all(promises)
                .then(function (data) {
                    // console.log(data);
                    allDetail = [];
                    data.forEach(value => {
                        var objDetail = new Object();
                        objDetail.Account = accountNumber;
                        objDetail.instanceId = value.ResourceId;
                        objDetail.Status = value.Status;
                        objDetail.InstalledCount = value.CompliantSummary.CompliantCount;
                        objDetail.MissingCount = value.NonCompliantSummary.NonCompliantCount;
                        allDetail.push(objDetail);
                    });
                    console.log(allDetail);
                    sendSNS(allDetail);

                })
        }).catch(function (err) { console.log(err) });


    /*     
getInstanceCompliance(instanceId)
    .then(function (data) {
        var allDetail = []

        var objDetail = new Object();
        objDetail.Account = accountNumber;
        objDetail.instanceId = data.ResourceId;
        objDetail.Status = data.Status;
        objDetail.InstalledCount = data.CompliantSummary.CompliantCount;
        objDetail.MissingCount = data.NonCompliantSummary.NonCompliantCount;
        allDetail.push(objDetail);
        promises.push(objDetail);
        Promise.all(promises);
        console.log(promises);
        // sendSMS(promises);
    }).catch(function (err) { console.log(err) });

*/
    /* 
    
        describeInstancePatchForGroup([])
            .then(function (data) {
                var allDetail = []
    
                data.forEach(value => {
                    var objDetail = new Object();
                    objDetail.Account = accountNumber;
                    objDetail.InstanceId = value.InstanceId;
                    objDetail.PatchGroup = value.PatchGroup;
                    objDetail.InstalledCount = value.InstalledCount;
                    objDetail.MissingCount = value.MissingCount;
    
                    if (value.MissingCount > 0) {
                        objDetail.Compliant = "False";
                    }
                    else { objDetail.Compliant = "True"; }
                    allDetail.push(objDetail);
                    promises.push(objDetail);
                });
                Promise.all(promises);
                console.log(promises);
                sendSMS(promises);
            }).catch(function (err) { console.log(err) });
    
     */


};
