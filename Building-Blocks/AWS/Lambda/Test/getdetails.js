'use strict';

function factory(configuredAwsSdk) {
    const cloudformation = new configuredAwsSdk.CloudFormation({apiVersion: '2010-05-15'});

    function getStackDescriptionForResource(PhysicalResourceId) {
        let stackResources, stackDescription, StackName;

        return cloudformation.describeStackResources({PhysicalResourceId}).promise().then(data => {
            stackResources = data.StackResources;

            if (stackResources.length === 0) {
                throw new Error(`Stack for resource [PhysicalResourceId=${PhysicalResourceId}] contains no resources...`);
            }

            StackName = stackResources[0]['StackName'];
            return cloudformation.describeStacks({StackName}).promise();
        }).then(data => {
            const stacks = data['Stacks'];

            if (stacks.length === 0) {
                throw new Error(`No stacks were found by name ${StackName}`);
            }

            stackDescription = stacks[0];
            return result(stackResources, stackDescription);
        });
    }

    return {
        getStackDescriptionForResource
    };
}

function result(stackResources, stackDescription) {

    function resources() {
        return stackResources;
    }

    function resourcesByType() {
        return stackResources.reduce((byType, resource) => {
            const type = resource['ResourceType'];

            if (!byType[type]) {
                byType[type] = [];
            }

            byType[type].push(resource);
            return byType;
        }, {});
    }

    function resourcesByLogicalId() {
        return stackResources.reduce((byId, resource) => {
            byId[resource.LogicalResourceId] = resource;
            return byId;
        }, {});
    }

    function stackParameters() {
        return stackDescription.Parameters.reduce((reduced, param) => {
            reduced[param.ParameterKey] = param.ParameterValue;
            return reduced;
        }, {});
    }

    function stackOutputs() {
        return stackDescription.Outputs.reduce((reduced, output) => {
            reduced[output.OutputKey] = output.OutputValue;
            return reduced;
        }, {});
    }

    return {
        resources,
        resourcesByType,
        resourcesByLogicalId,
        stackParameters,
        stackOutputs
    };
}

module.exports = factory;