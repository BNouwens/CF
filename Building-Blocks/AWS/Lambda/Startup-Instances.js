var aws = require("aws-sdk");

function startEc2Instance(instanceParams) {
    var ec2 = new aws.EC2();
    ec2.startInstances(instanceParams, function (err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else console.log(data);           // successful response
    });
}

exports.handler = function (event, context, callback) {
    var ec2 = new aws.EC2();
    var instanceSearch = {
        Filters: [
            {
                Name: 'tag:AutoOnOff',
                Values: [
                    'yes'
                ]
            },
        ],
        DryRun: false,
        MaxResults: 50,
    };
    ec2.describeInstances(instanceSearch).promise()
        .then((response) => {
            const promises = [];
            response.Reservations.forEach(value => {
                var params = {
                    InstanceIds: [
                        value.Instances[0].InstanceId
                    ],
                    DryRun: false
                };
                promises.push(startEc2Instance(params));
            })
            return Promise.all(promises)
        }).then(() => {
            console.log('Im all finished');
            callback(null);
        }).catch(err => {
            console.log('Something went really wrong')
            callback(err);
        })

};
