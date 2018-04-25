var aws = require("aws-sdk");
// var ssm = new aws.SSM();
// var ec2 = new aws.EC2();
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

function sendSMS(message) {
    var sns = new aws.SNS();
    var topicArn = process.env.TopicArn;
    var params = {
        Message: JSON.stringify(message),
        Subject: 'TEST',
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
};
