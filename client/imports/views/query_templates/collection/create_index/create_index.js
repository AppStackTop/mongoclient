import {Template} from 'meteor/templating';
import {Meteor} from 'meteor/meteor';
import Helper from '/client/imports/helper';
import {Session} from 'meteor/session';
import Enums from '/lib/imports/enums';
import {initExecuteQuery} from '/client/imports/views/pages/browse_collection/browse_collection';
import {getOptions} from '/client/imports/views/query_templates_options/create_index_options/create_index_options';

import './create_index.html';

var toastr = require('toastr');
var Ladda = require('ladda');
/**
 * Created by RSercan on 2.1.2016.
 */
Template.createIndex.onRendered(function () {
    Helper.initializeCodeMirror($('#divFields'), 'txtFields');
    Helper.changeConvertOptionsVisibility(false);
    initializeOptions();
});

const initializeOptions = function () {
    var cmb = $('#cmbCreateIndexOptions');
    $.each(Helper.sortObjectByKey(Enums.CREATE_INDEX_OPTIONS), function (key, value) {
        cmb.append($("<option></option>")
            .attr("value", key)
            .text(value));
    });

    cmb.chosen();
    Helper.setOptionsComboboxChangeEvent(cmb);
};

Template.createIndex.executeQuery = function (historyParams) {
    initExecuteQuery();
    var selectedCollection = Session.get(Helper.strSessionSelectedCollection);
    var options = historyParams ? historyParams.options : getOptions();
    var fields = historyParams ? JSON.stringify(historyParams.fields) : Helper.getCodeMirrorValue($('#divFields'));

    fields = Helper.convertAndCheckJSON(fields);
    if (fields["ERROR"]) {
        toastr.error("Syntax error on index field: " + fields["ERROR"]);
        Ladda.stopAll();
        return;
    }

    if (options["ERROR"]) {
        toastr.error(options["ERROR"]);
        Ladda.stopAll();
        return;
    }

    var params = {
        fields: fields,
        options: options
    };

    Meteor.call("createIndex", selectedCollection, fields, options, function (err, result) {
        Helper.renderAfterQueryExecution(err, result, false, "createIndex", params, (historyParams ? false : true));
    });
};