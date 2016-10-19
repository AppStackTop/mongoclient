var toastr = require('toastr');
var Ladda = require('ladda');
/**
 * Created by RSercan on 3.1.2016.
 */
Template.mapReduce.onRendered(function () {
    Template.initializeCodeMirror($('#divMap'), 'txtMap');
    Template.initializeCodeMirror($('#divReduce'), 'txtReduce');
    Template.mapReduce.initializeOptions();
    Template.changeConvertOptionsVisibility(false);
});

Template.mapReduce.initializeOptions = function () {
    var cmb = $('#cmbMapReduceOptions');
    $.each(Template.sortObjectByKey(MAP_REDUCE_OPTIONS), function (key, value) {
        cmb.append($("<option></option>")
            .attr("value", key)
            .text(value));
    });

    cmb.chosen();
    Template.setOptionsComboboxChangeEvent(cmb);
};

Template.mapReduce.executeQuery = function (historyParams) {
    Template.browseCollection.initExecuteQuery();
    var selectedCollection = Session.get(Template.strSessionSelectedCollection);
    var options = historyParams ? historyParams.options : Template.mapReduceOptions.getOptions();
    var map = historyParams ? JSON.stringify(historyParams.map) : Template.getCodeMirrorValue($('#divMap'));
    var reduce = historyParams ? JSON.stringify(historyParams.reduce) : Template.getCodeMirrorValue($('#divReduce'));


    if (map.parseFunction() == null) {
        toastr.error("Syntax error on map, not a valid function ");
        Ladda.stopAll();
        return;
    }

    if (reduce.parseFunction() == null) {
        toastr.error("Syntax error on reduce, not a valid function ");
        Ladda.stopAll();
        return;
    }

    if (options["ERROR"]) {
        toastr.error(options["ERROR"]);
        Ladda.stopAll();
        return;
    }

    var params = {
        map: map,
        reduce: reduce,
        options: options
    };

    Meteor.call("mapReduce", selectedCollection, map, reduce, options, function (err, result) {
        Template.renderAfterQueryExecution(err, result, false, "mapReduce", params, (historyParams ? false : true));
    });
};