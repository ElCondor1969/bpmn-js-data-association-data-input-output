import RuleProvider from 'diagram-js/lib/features/rules/RuleProvider';
import {add as addToCollection} from 'diagram-js/lib/util/Collections';
import inherits from 'inherits';


export default function UseDataInputOutput(eventBus, bpmnFactory, useDataInputOutputAssociation) {
  RuleProvider.call(this, eventBus);
  this.BpmnFactory=bpmnFactory;
  this.useDataInputOutputAssociation=useDataInputOutputAssociation || {};
}

inherits(UseDataInputOutput, RuleProvider);

UseDataInputOutput.$inject = [ 'eventBus','bpmnFactory','config.useDataInputOutputAssociation' ];

UseDataInputOutput.prototype.init = function() {
  var me=this;

  function isTask(bo) {
    var result=
          (bo.$instanceOf('bpmn:Task') || 
           bo.$instanceOf('bpmn:UserTask') || 
           bo.$instanceOf('bpmn:ScriptTask') || 
           bo.$instanceOf('bpmn:ServiceTask') || 
           bo.$instanceOf('bpmn:ReceiveTask') || 
           bo.$instanceOf('bpmn:SendTask') || 
           bo.$instanceOf('bpmn:BusinessRuleTask') || 
           bo.$instanceOf('bpmn:CallActivity') ||
           bo.$instanceOf('bpmn:SubProcess'));
     return result;
  }

  function isData(bo) {
    var result=
          (bo.$instanceOf('bpmn:DataObjectReference') || 
           bo.$instanceOf('bpmn:DataObject') || 
           bo.$instanceOf('bpmn:DataStoreReference') ||
           bo.$instanceOf('bpmn:DataStore'));
     return result;
  }

  me.postExecuted('connection.create',10000,function(data) {
    var context=data.context,
        source=context.source.businessObject,
        target=context.target.businessObject,
        connection,
        ioSpecification,
        dataInput;

    if (me.useDataInputOutputAssociation.enabled && context.connection && 
        (connection=context.connection.businessObject) && 
        isData(source) && isTask(target)) {
      if (connection.targetRef.$instanceOf('bpmn:Property')) {
        ioSpecification=target.ioSpecification;
        if (!ioSpecification) {
          ioSpecification=me.BpmnFactory.create('bpmn:InputOutputSpecification', {
            dataInputs: [],
            inputSets: []
          });
          target.ioSpecification=ioSpecification;
        }
        if (!ioSpecification.dataInputs) {
          ioSpecification.dataInputs=[];
        }
        if (ioSpecification.dataInputs.length>0) {
          connection.targetRef=ioSpecification.dataInputs[0];
        }
        else {
          dataInput=me.BpmnFactory.create('bpmn:DataInput');
          dataInput.$parent=ioSpecification;
          addToCollection(ioSpecification.dataInputs,dataInput);
          connection.targetRef=dataInput;
        }
      }
    }
  });
};
