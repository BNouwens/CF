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

var aws = require("aws-sdk");
var ssm = new aws.SSM();
var ec2 = new aws.EC2();

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
                // console.log(summaryType);
            }
        });
    })
}


function getInventory(paramsInv) {
    return new Promise((resolve, reject) => {
        var ssm = new aws.SSM();

        ssm.getInventory(paramsInv, function (err, data) {
            if (err) {
                reject(err)
            }
            else {
                // promises.push(listComplianceSummary(paramsSummary));


                /* console.log("Length - ")
                console.log(data['Entities'].length);
                console.log(data.NextToken);
                 */
                const invData = data['Entities'];
                // allInv = invData[1];
                resolve(invData);
                // console.log(summaryType);
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


    //GET INVENTORY

    var paramsInv = {
        MaxResults: 10,
        ResultAttributes: [
            {
                TypeName: 'AWS:InstanceInformation' /* required */
            }
        ]
    };

    const promises = [];

    //promises.push(listComplianceSummary(paramsSummary));
    // allInventory = getInventory(paramsInv);
    // promises.push(getInventory(paramsInv));
    // console.log(Promise.all(promises));

    var initializePromiseSummary = listComplianceSummary(paramsSummary);
    initializePromiseSummary.then(function (result) {
        return new Promise((resolve, reject) => {
            details = result;
            // console.log("Initialized Promise");
            // console.log(details)
            callback(null, details);
        })
    }, function (err) {
        console.log(err);
    })
    var summary = initializePromiseSummary.result;
    promises.push(summary);
    results = Promise.all(promises);
    console.log(results);

    var initializePromiseInventory = getInventory(paramsInv);
    initializePromiseInventory.then(function (result) {
        inventory = result;
        console.log("Initialized Promise");
        // Use user details from here

        // return inventory;
        callback(null, inventory);
    }, function (err) {
        console.log(err);
    })
    var inventory = initializePromiseInventory.result;
    // console.log(inventory);
    promises.push(inventory)




    results = Promise.all(promises);
    console.log(results);

    /* 
        listComplianceSummary(paramsSummary)
            .then((response) => {
    
                return Promise.all(promises);
            }).then(results => {
                results.forEach(value => {
                    var objParam = new Object();
                    objParam.Value = value;
                    console.log(objParam.Value);
                })
            }).then(() => {
                console.log('Im all finished');
                callback(null);
            }).catch(err => {
                console.log('Something went really wrong')
                callback(err);
            })
     */
    // results = Promise.all(promises);
    // console.log(results);
    // console.log(allInventory)



    /*     
        ssm.getInventory(paramsInv).promise()
            .then((response) => {
    
                const promises = [];
                // promises.push(console.log("Compliance Summary"));
                promises.push(listComplianceSummary(paramsSummary));
    
    
                console.log("Length - ")
                console.log(response['Entities'].length);
                console.log(response.NextToken);
                response['Entities'].forEach(value => {
                    // console.log(value.Data['AWS:InstanceInformation'].Content[0].InstanceStatus);
                    // console.log(value.Data['AWS:InstanceInformation'].Content[0].InstanceId);
    
                    // var instanceID = value.Data['AWS:InstanceInformation'].Content[0].InstanceId;
    
                    if (value.Data['AWS:InstanceInformation'].Content[0].InstanceStatus != "Terminated") {
                        promises.push(value.Data['AWS:InstanceInformation'].Content[0]);
                        promises.push(getInstanceCompliance(value.Data['AWS:InstanceInformation'].Content[0].InstanceId));
    
                    }
    
                })
     */
    // paramsInv.NextToken = response.NextToken;
    // console.log(paramsInv);

    /* 
    do {
        paramsInv.NextToken = response.NextToken;
        console.log(paramsInv);

        ssm.getInventory(paramsInv, function (err, response) {
            if (err) {
                reject(err)
            }
            else {
                // const summary = data['ComplianceSummaryItems'];
                // summaryType = summary[1];
                // resolve(summaryType);
                // console.log(summaryType);

                console.log("Length - ")
                console.log(response['Entities'].length);
                console.log(response.NextToken);
                response['Entities'].forEach(value => {
                    if (value.Data['AWS:InstanceInformation'].Content[0].InstanceStatus != "Terminated") {
                        promises.push(value.Data['AWS:InstanceInformation'].Content[0]);
                        promises.push(getInstanceCompliance(value.Data['AWS:InstanceInformation'].Content[0].InstanceId));

                    }

                });
            };
            paramsInv.NextToken = response.NextToken;
            console.log(paramsInv);
        });
    } while (paramsInv.NextToken == undefined);

*/

    /* 
                // }
                return Promise.all(promises)
            }).then(results => {
                results.forEach(value => {
                    var objParam = new Object();
                    objParam.Value = value;
                    console.log(objParam.Value);
                })
            }).then(() => {
                console.log('Im all finished');
                callback(null);
            }).catch(err => {
                console.log('Something went really wrong')
                callback(err);
            })
     */
};
