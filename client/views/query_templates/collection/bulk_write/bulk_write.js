/**
 * Created by RSercan on 15.10.2016.
 */

Template.bulkWrite.onRendered(function () {
    Template.initializeCodeMirror($('#divBulkWrite'), 'txtBulkWrite');
});

Template.bulkWrite.executeQuery = function (historyParams) {
    Template.warnDemoApp();
};