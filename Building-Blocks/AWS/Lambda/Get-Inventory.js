// This is missing parts just cleaning up main compliance check file
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

var paramsInv = {
    MaxResults: 10,
    ResultAttributes: [
        {
            TypeName: 'AWS:InstanceInformation'
        }
    ]
};

getInventory([])
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



  /* patchGroups([])
        .then(function (data) {
            var allGroups = []
            var objGroups = new Object();
 
            data.forEach(value => {
                objGroups.PatchGroup = value;
 
                // console.log(objGroups.PatchGroup);
                // Looking to try and send through to the function the Patch Group
                // allGroups.concat(objGroups.PatchGroup);
                // console.log(allGroups);
 
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
                        console.log(allDetail);
                    }).catch(function (err) { console.log(err) });
            });
            return objGroups;
        }).catch(function (err) { console.log(err) });
 */