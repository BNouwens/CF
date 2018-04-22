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


**/

// var request = require('request-promise');

var aws = require("aws-sdk");
var ssm = new aws.SSM();
var ec2 = new aws.EC2();

function describeInstancePatchForGroup(results, token) {
    return new Promise((resolve, reject) => {
        var ssm = new aws.SSM();
        PatchGroup = "Development";

        // console.log(objGroups.PatchGroup);

        var params = {
            PatchGroup: PatchGroup,
            MaxResults: 2
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
                // resolve(data);
            }

        });


    })
}





/* describePatchGroups(params = {}, callback) ⇒ AWS.Request
Lists all patch groups that have been registered with patch baselines. */

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
                // resolve(data);
            }

        });


    })
}





/*describePatchGroupState(params = {}, callback) ⇒ AWS.Request
Returns high-level aggregated patch compliance state for a patch group. */


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
                var objDetail = new Object();

                summaryData = instanceSummary[0];

                objDetail.Status = summaryData.Status;
                objDetail.CompliantSummary = summaryData.CompliantSummary.CompliantCount;
                objDetail.NonCompliantSummary = summaryData.NonCompliantSummary.NonCompliantCount;
                objDetail.SeveritySummary = summaryData.NonCompliantSummary.SeveritySummary;

                // console.log(objDetail);

                // console.log(instanceSummary);

                resolve(objDetail);
                // console.log(summaryData);
            }
        });
    })
}

function listComplianceSummary(paramsSummary) {
    return new Promise((resolve, reject) => {
        var ssm = new aws.SSM();

        ssm.listComplianceSummaries(paramsSummary, function (err, data) {
            if (err) {
                reject(err)
            }
            else {
                const summary = data['ComplianceSummaryItems'];
                summaryType = summary[1];
                resolve(summaryType);

            }
        });
    })
}



exports.handler = function (event, context, callback) {
    var paramsSummary = {
        Filters: [
            {
                Key: 'ComplianceType',
                Type: 'EQUAL',
                Values: [
                    'Patch',
                ]
            },
        ],
        MaxResults: 50,
    };

    var invData;

    // global.invNextInvetory = "B";

    //GET INVENTORY

    var paramsInv = {
        MaxResults: 10,
        ResultAttributes: [
            {
                TypeName: 'AWS:InstanceInformation' /* required */
            }
        ]
    };

    var err = function (err) {
        console.log(err);
    }
    var promises = [];
    var sum = [];

    // promises.push(console.log("TEST"));
    promises.push(listComplianceSummary(paramsSummary));

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


    patchGroups([])
        .then(function (data) {
            var allGroups = []
            var objGroups = new Object();       

            data.forEach(value => {
                objGroups.PatchGroup = value;

                // Looking to try and send through to the function the Patch Group
                describeInstancePatchForGroup([])
                    .then(function (data) {
                        var allDetail = []

                        data.forEach(value => {
                            var objDetail = new Object();

                            objDetail.InstanceId = value.InstanceId;
                            objDetail.PatchGroup = value.PatchGroup;
                            objDetail.InstalledCount = value.InstalledCount;
                            objDetail.MissingCount = value.MissingCount;

                            if (value.MissingCount > 0) {
                                objDetail.Compliant = "False";
                            }
                            else { objDetail.Compliant = "True"; }
                            allDetail.push(objDetail);
                        });

                        // console.log(data);
                        console.log(allDetail);
                        // console.log(data.InstancePatchStates);
                        // console.log(data.MissingCount);
                        // if(data.InstancePatchStates.MissingCount > 0) {
                        //     console.log("NON COMPLIANT")
                        // }
                    }).catch(function (err) { console.log(err) });

            });

            // console.log(objGroups);
            return objGroups;
        }).catch(function (err) { console.log(err) });

 /*    describeInstancePatchForGroup([])
        .then(function (data) {
            var allDetail = []

            data.forEach(value => {
                var objDetail = new Object();

                objDetail.InstanceId = value.InstanceId;
                objDetail.PatchGroup = value.PatchGroup;
                objDetail.InstalledCount = value.InstalledCount;
                objDetail.MissingCount = value.MissingCount;

                if (value.MissingCount > 0) {
                    objDetail.Compliant = "False";
                }
                else { objDetail.Compliant = "True"; }
                allDetail.push(objDetail);
            });

            // console.log(data);
            console.log(allDetail);
            // console.log(data.InstancePatchStates);
            // console.log(data.MissingCount);
            // if(data.InstancePatchStates.MissingCount > 0) {
            //     console.log("NON COMPLIANT")
            // }
        }).catch(function (err) { console.log(err) });
 */


};
