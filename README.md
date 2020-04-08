# bpmn-js-data-association-data-input-output
BPMN-JS plugin to allow use task data inputs or data outputs for incoming/outgoing data association connections instead of Property entity.

## Usage

```javascript
import BpmnModeler from 'bpmn-js/lib/Modeler';

import useDataInputOutput from 'bpmn-js-data-association-data-input-output/lib';

var bpmnJS = new BpmnModeler({
  additionalModules: [
    useDataInputOutput
  ],
  useDataInputOutputAssociation: {
    enabled: true
  }
});
```

## Building

To build, run:

```
npm install
npm run bundle
```
