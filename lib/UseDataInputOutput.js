import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor';
import inherits from 'inherits';
import {
  add as collectionAdd,
  remove as collectionRemove
} from 'diagram-js/lib/util/Collections';
import IdGenerator from 'diagram-js/lib/util/IdGenerator';
import {
  find,
  forEach
} from 'min-dash';
import {
  is
} from 'bpmn-js/lib/util/ModelUtil';

export default function UseDataInputOutput(eventBus,bpmnFactory,useDataInputOutputAssociation) {
  CommandInterceptor.call(this, eventBus);

  this.executed([
    'connection.create',
    'connection.delete',
    'connection.move',
    'connection.reconnectEnd'
  ], 100, ifDataInputOutputAssociation(updateTargetRef,updateSourceRef,useDataInputOutputAssociation.enabled));

  this.reverted([
    'connection.create',
    'connection.delete',
    'connection.move',
    'connection.reconnectEnd'
  ], 100, ifDataInputOutputAssociation(updateTargetRef,updateSourceRef,useDataInputOutputAssociation.enabled));

  function createDataInput(element) {
    var generator=new IdGenerator('DataInput'),
        ioSpecification = element.get('ioSpecification');

    var inputSet;

    if (!ioSpecification) {
      ioSpecification = bpmnFactory.create('bpmn:InputOutputSpecification', {
        dataInputs: [],
        inputSets: [],
        dataOutputs: [],
        outputSets: []
      });

      element.ioSpecification = ioSpecification;

      if (useDataInputOutputAssociation.useInputSets) {
        inputSet = bpmnFactory.create('bpmn:InputSet', {
          dataInputRefs: [],
          name: 'Inputs'
        });

        inputSet.$parent = ioSpecification;

        collectionAdd(ioSpecification.get('inputSets'), inputSet);
      }
    }

    if (!ioSpecification.dataInputs) {
      ioSpecification.dataInputs = [];
    }

    if (!ioSpecification.dataInputs.length) {
      var dataInput = bpmnFactory.create('bpmn:DataInput', {
        id: generator.next()
      });

      dataInput.$parent = ioSpecification;

      collectionAdd(ioSpecification.get('dataInputs'), dataInput);
    }
    else {
      dataInput = ioSpecification.dataInputs[0];
    }

    if (useDataInputOutputAssociation.useInputSets) {
      if (!ioSpecification.inputSets) {
        inputSet = bpmnFactory.create('bpmn:InputSet', {
          dataInputRefs: [],
          name: 'Inputs'
        });

        inputSet.$parent = ioSpecification;

        collectionAdd(ioSpecification.get('inputSets'), inputSet);
      }

      inputSet = ioSpecification.get('inputSets')[0];

      collectionAdd(inputSet.dataInputRefs, dataInput);
    }

    return dataInput;
  }

  function createDataOutput(element) {
    var generator=new IdGenerator('DataOutput'),
        ioSpecification = element.get('ioSpecification');

    var outputSet;

    if (!ioSpecification) {
      ioSpecification = bpmnFactory.create('bpmn:InputOutputSpecification', {
        dataInputs: [],
        inputSets: [],
        dataOutputs: [],
        outputSets: []
      });

      element.ioSpecification = ioSpecification;

      if (useDataInputOutputAssociation.useOutputSets) {
        outputSet = bpmnFactory.create('bpmn:OutputSet', {
          dataOutputRefs: [],
          name: 'Outputs'
        });

        outputSet.$parent = ioSpecification;

        collectionAdd(ioSpecification.get('outputSets'), outputSet);
      }
    }

    if (!ioSpecification.dataOutputs) {
      ioSpecification.dataOutputs = [];
    }

    if (!ioSpecification.dataOutputs.length) {
      var dataOutput = bpmnFactory.create('bpmn:DataOutput', {
        id: generator.next()
      });

      dataOutput.$parent = ioSpecification;

      collectionAdd(ioSpecification.get('dataOutputs'), dataOutput);
    }
    else {
      dataOutput = ioSpecification.dataOutputs[0];
    }

    if (useDataInputOutputAssociation.useOutputSets) {
      if (!ioSpecification.outputSets) {
        outputSet = bpmnFactory.create('bpmn:OutputSet', {
          dataOutputRefs: [],
          name: 'Outputs'
        });

        outputSet.$parent = ioSpecification;

        collectionAdd(ioSpecification.get('outputSets'), outputSet);
      }

      outputSet = ioSpecification.get('outputSets')[0];

      collectionAdd(outputSet.dataOutputRefs, dataOutput);
    }

    return dataOutput;
  }

  function removeDataInput(element, connection) {
    var dataInput = getDataInput(element, connection.targetRef);

    if (!dataInput) {
      return;
    }

    var ioSpecification = element.get('ioSpecification');

    if (ioSpecification &&
        ioSpecification.dataInputs) {

      collectionRemove(ioSpecification.dataInputs, dataInput);

      if (useDataInputOutputAssociation.useInputSets &&
          ioSpecification.inputSets && ioSpecification.inputSets.length) {
        collectionRemove(ioSpecification.inputSets[0].dataInputRefs, dataInput);
      }

      cleanUpIoSpecification(element);
    }
  }

  function removeDataOutput(element, connection) {
    var dataOutput = getDataOutput(element, connection.sourceRef);

    if (!dataOutput) {
      return;
    }

    var ioSpecification = element.get('ioSpecification');

    if (ioSpecification &&
        ioSpecification.dataOutputs) {

      collectionRemove(ioSpecification.dataOutputs, dataOutput);

      if (useDataInputOutputAssociation.useOutputSets &&
          ioSpecification.outputSets && ioSpecification.outputSets.length) {
        collectionRemove(ioSpecification.outputSets[0].dataOutputRefs, dataOutput);
      }

      cleanUpIoSpecification(element);
    }
  }

  function removeTargetPlaceHolderProperty(element) {
    var TARGET_REF_PLACEHOLDER_NAME = '__targetRef_placeholder',
        properties = element.get('properties');

    var targetRefProp = find(properties, function(p) {
      return p.name === TARGET_REF_PLACEHOLDER_NAME;
    });
    
    if (targetRefProp) {
      collectionRemove(properties, targetRefProp);
    }
  }

  function removeSourcePlaceHolderProperty(element) {
    var SOURCE_REF_PLACEHOLDER_NAME = '__sourceRef_placeholder',
        properties = element.get('properties');

    var sourceRefProp = find(properties, function(p) {
      return p.name === SOURCE_REF_PLACEHOLDER_NAME;
    });
    
    if (sourceRefProp) {
      collectionRemove(properties, sourceRefProp);
    }
  }

  function updateTargetRef(event) {
    var context = event.context || event,
        connection = context.connection,
        connectionBo = connection.businessObject,
        target = connection.target,
        targetBo = target && target.businessObject,
        newTarget = context.newTarget,
        newTargetBo = newTarget && newTarget.businessObject,
        oldTarget = context.oldTarget || context.target,
        oldTargetBo = oldTarget && oldTarget.businessObject;

    var dataAssociation = connection.businessObject,
        dataInput;

    if (oldTargetBo && oldTargetBo !== targetBo) {
      removeDataInput(oldTargetBo, connectionBo);
    }

    if (newTargetBo && newTargetBo !== targetBo) {
      removeDataInput(newTargetBo, connectionBo);
    }

    if (targetBo) {
      var targetRef=dataAssociation.targetRef;
      
      if (!targetRef || !is(targetRef, 'bpmn:DataInput')) {
        dataInput = createDataInput(targetBo, true);
        dataAssociation.targetRef = dataInput;
      }
      removeTargetPlaceHolderProperty(targetBo);
    } 
    else {
      dataAssociation.targetRef = null;
    }
  }

  function updateSourceRef(event) {
    var context = event.context || event,
        connection = context.connection,
        connectionBo = connection.businessObject,
        source = connection.source,
        sourceBo = source && source.businessObject,
        newSource = context.newSource,
        newSourceBo = newSource && newSource.businessObject,
        oldSource = context.oldSource || context.source,
        oldSourceBo = oldSource && oldSource.businessObject;

    var dataAssociation = connection.businessObject,
        dataOutput;

    if (oldSourceBo && oldSourceBo !== sourceBo) {
      removeDataOutput(oldSourceBo, connectionBo);
    }

    if (newSourceBo && newSourceBo !== sourceBo) {
      removeDataOutput(newSourceBo, connectionBo);
    }

    if (sourceBo) {
      var sourceRef=dataAssociation.get('sourceRef');

      if (!sourceRef || !sourceRef.length || !is(sourceRef[0], 'bpmn:DataOutput')) {
        dataOutput = createDataOutput(sourceBo, true);
        sourceRef[0] = dataOutput;
      }
      removeSourcePlaceHolderProperty(sourceBo);
    } 
    else {
      dataAssociation.sourceRef = null;
    }
  }
}

inherits(UseDataInputOutput, CommandInterceptor);

UseDataInputOutput.$inject = [ 'eventBus','bpmnFactory', 'config.useDataInputOutputAssociation' ];

function ifDataInputOutputAssociation(updateTargetRef,updateSourceRef,enabled) {
  return function(event) {
    var context,
        connection;

    if (enabled) {
      context = event.context || event,
      connection = context.connection;

      if (is(connection, 'bpmn:DataInputAssociation')) {
        return updateTargetRef(event);
      }
      else if (is(connection, 'bpmn:DataOutputAssociation')) {
        return updateSourceRef(event);
      }
    }
  };
}

export function getDataInput(element, targetRef) {
  var ioSpecification = element.get('ioSpecification');

  if (ioSpecification && ioSpecification.dataInputs) {
    return find(ioSpecification.dataInputs, function(dataInput) {
      return dataInput === targetRef;
    });
  }
}

export function getDataOutput(element, sourceRef) {
  var ioSpecification = element.get('ioSpecification');

  if (ioSpecification && ioSpecification.dataOutputs) {
    return find(ioSpecification.dataOutputs, function(dataOutput) {
      return dataOutput === sourceRef;
    });
  }
}

function cleanUpIoSpecification(element) {
  var ioSpecification = element.get('ioSpecification');

  var dataInputs,
      dataOutputs,
      inputSets,
      outputSets;

  if (ioSpecification) {
    dataInputs = ioSpecification.dataInputs;
    dataOutputs = ioSpecification.dataOutputs;
    inputSets = ioSpecification.inputSets;
    outputSets = ioSpecification.outputSets;

    if (dataInputs && !dataInputs.length) {
      delete ioSpecification.dataInputs;
    }

    if (dataOutputs && !dataOutputs.length) {
      delete ioSpecification.dataOutputs;
    }

    if ((!dataInputs || !dataInputs.length) &&
        (!dataOutputs || !dataOutputs.length) &&
        (!inputSets || !inputSets.length) &&
        (!outputSets || !outputSets.length)) {
      delete element.ioSpecification;
    }
  }
}
