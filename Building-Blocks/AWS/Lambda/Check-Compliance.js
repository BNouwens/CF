var aws = require("aws-sdk");

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
            }
        });
    })
}

function sendSNS(message) {
    var sns = new aws.SNS();
    var topicArn = process.env.TopicArn;
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
    ACCOUNT_ID = context.invokedFunctionArn.split(":")[4];
    const accountNumber = ACCOUNT_ID;
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
                        if (value != undefined) {
                            var objDetail = new Object();
                            objDetail.Account = accountNumber;
                            objDetail.instanceId = value.ResourceId;
                            objDetail.Status = value.Status;
                            objDetail.InstalledCount = value.CompliantSummary.CompliantCount;
                            objDetail.MissingCount = value.NonCompliantSummary.NonCompliantCount;
                            allDetail.push(objDetail);
                        }
                    });
                    console.log(allDetail);
                    sendSNS(allDetail);
                })
        }).catch(function (err) { console.log(err) });
};
