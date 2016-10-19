var toastr = require('toastr');
var Ladda = require('ladda');
var fbbkJson = require("fbbk-json");
var CodeMirror = require("codemirror");

require("/node_modules/codemirror/mode/javascript/javascript.js");
require("/node_modules/codemirror/addon/fold/brace-fold.js");
require("/node_modules/codemirror/addon/fold/comment-fold.js");
require("/node_modules/codemirror/addon/fold/foldcode.js");
require("/node_modules/codemirror/addon/fold/foldgutter.js");
require("/node_modules/codemirror/addon/fold/indent-fold.js");
require("/node_modules/codemirror/addon/fold/markdown-fold.js");
require("/node_modules/codemirror/addon/fold/xml-fold.js");
require("/node_modules/codemirror/addon/hint/javascript-hint.js");
require("/node_modules/codemirror/addon/hint/show-hint.js");

/**
 * Created by RSercan on 26.12.2015.
 */
Template.strSessionConnection = "connection";
Template.strSessionCollectionNames = "collectionNames";
Template.strSessionSelectedCollection = "selectedCollection";
Template.strSessionSelectedQuery = "selectedQuery";
Template.strSessionSelectedOptions = "selectedOptions";
Template.strSessionServerStatus = "serverStatus";
Template.strSessionDBStats = "dbStats";
Template.strSessionUsedTabIDs = "usedTabIDs";
Template.strSessionActiveTabID = "activeTabID";
Template.strSessionSelectedDump = "selectedDump";
Template.strSessionSelectedFile = "selectedFile";
Template.strSessionEasyEditID = "easyEditID";
Template.strSessionDistinctFields = "distinctFields";
Template.strSessionSelectedQueryHistory = "selectedQueryHistory";
Template.strSessionSelectorValue = "selectorValue";
Template.strSessionSelectionUserManagement = "userManagementValue";
Template.strSessionUsermanagementInfo = "userManagementInfo";
Template.strSessionUsermanagementManageSelection = "userManagementManageSelection";
Template.strSessionUsermanagementUser = "userManagementUser";
Template.strSessionUsermanagementRole = "userManagementRole";
Template.strSessionUsermanagementPrivilege = "userManagementPrivilege";

Template.clearSessions = function () {
    Object.keys(Session.keys).forEach(function (key) {
        Session.set(key, undefined);
    })
};

Template.initiateDatatable = function (selector, sessionKey, noDeleteEvent) {
    selector.find('tbody').on('click', 'tr', function () {
        var table = selector.DataTable();
        if ($(this).hasClass('selected')) {
            $(this).removeClass('selected');
        }
        else {
            table.$('tr.selected').removeClass('selected');
            $(this).addClass('selected');
        }

        if (table.row(this).data() && sessionKey) {
            Session.set(sessionKey, table.row(this).data());
        }
    });

    if (!noDeleteEvent) {
        selector.find('tbody').on('click', 'a.editor_delete', function () {
            selector.DataTable().row($(this).parents('tr')).remove().draw();
        });
    }
};

Template.renderAfterQueryExecution = function (err, result, isAdmin, queryInfo, queryParams, saveHistory) {
    if (err || result.error) {
        Template.showMeteorFuncError(err, result, "Couldn't execute query");
    }
    else {
        if (isAdmin) {
            Template.adminQueries.setResult(result.result);
        } else {
            Template.browseCollection.setResult(result.result, queryInfo, queryParams, saveHistory);
        }

        Ladda.stopAll();
    }

};

Template.showMeteorFuncError = function (err, result, message) {

    var errorMessage;
    if (err) {
        errorMessage = err.message;
    } else {
        errorMessage = result.error.message;
    }
    if (errorMessage) {
        toastr.error(message + ": " + errorMessage);
    } else {
        toastr.error(message);
    }


    Ladda.stopAll();
};

Template.sortObjectByKey = function (obj) {
    var keys = [];
    var sorted_obj = {};

    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            keys.push(key);
        }
    }

    keys.sort();
    jQuery.each(keys, function (i, key) {
        sorted_obj[key] = obj[key];
    });

    return sorted_obj;
};


Template.convertAndCheckJSON = function (json) {
    if (json == "") return {};
    var result = {};
    try {
        if (!json.startsWith('{') && !json.startsWith(']')) {
            json = '{' + json;
        }

        if ((!json.endsWith('}') && !json.endsWith(']')) ||
            (json.split('\{').length - 1) > (json.split('\}').length - 1)) {
            json = json + '}';
        }

        result = fbbkJson.parse(json);
    }
    catch (err) {
        result["ERROR"] = err.message;
    }

    return result;
};


Template.convertAndCheckJSONAsArray = function (json) {
    if (json == "") return [];
    var result = [];
    try {
        result = fbbkJson.parse(json);
    }
    catch (err) {
        throw err.message;
    }

    if (!$.isArray(result)) {
        var res = [];
        res.push(result);
        return res;
    }

    return result;
};

Template.checkCodeMirrorSelectorForOption = function (option, result, optionEnum) {
    if ($.inArray(option, Session.get(Template.strSessionSelectedOptions)) != -1) {
        var val = Template.selector.getValue();

        if (val == "") result[optionEnum[option]] = {};
        else {
            try {
                val = JSON.parse(val);
                result[optionEnum[option]] = val;
            }
            catch (err) {
                result["ERROR"] = "Syntax Error on " + optionEnum[option] + ": " + err.message;
            }
        }
    }
};

Template.checkAndAddOption = function (option, divSelector, result, optionEnum) {
    if ($.inArray(option, Session.get(Template.strSessionSelectedOptions)) != -1) {
        var val = Template.getCodeMirrorValue(divSelector);

        if (val == "") result[optionEnum[option]] = {};
        else {
            try {
                val = JSON.parse(val);
                result[optionEnum[option]] = val;
            }
            catch (err) {
                result["ERROR"] = "Syntax Error on " + optionEnum[option] + ": " + err.message;
            }
        }
    }
};

Template.setOptionsComboboxChangeEvent = function (cmb) {
    cmb.on('change', function (evt, params) {
        var array = Session.get(Template.strSessionSelectedOptions);
        if (params.deselected) {
            array.remove(params.deselected);
        }
        else {
            array.push(params.selected);
        }
        Session.set(Template.strSessionSelectedOptions, array);
    });
};

Template.getParentTemplateName = function (levels) {
    var view = Blaze.currentView;
    if (typeof levels === "undefined") {
        levels = 1;
    }
    while (view) {
        if (view.name.indexOf("Template.") != -1 && !(levels--)) {
            return view.name.substring(view.name.indexOf('.') + 1);
        }
        view = view.parentView;
    }
};

Template.changeRunOnAdminOptionVisibility = function (show) {
    if (show) {
        $('#aRunOnAdminDB').show();
    } else {
        $('#aRunOnAdminDB').hide();
    }

};
Template.changeConvertOptionsVisibility = function (show) {
    if (show) {
        $('#aConvertIsoDates').show();
        $('#aConvertObjectIds').show();
    } else {
        $('#aConvertIsoDates').hide();
        $('#aConvertObjectIds').hide();
    }
};

Template.warnDemoApp = function () {
    toastr.info('This feature is not usable in demo application !');
};

Template.getDistinctKeysForAutoComplete = function (selectedCollection) {
    var settings = Settings.findOne();
    if (!settings.autoCompleteFields) {
        return;
    }
    if (selectedCollection.endsWith('.chunks')) {
        // ignore chunks
        return;
    }

    var mapFunc = "function () {for (var key in this) {emit(key, null);}};";
    var reduceFunc = "function (key, stuff) {return null;};";
    var options = {
        out: {inline: 1}
    };

    Meteor.call("mapReduce", selectedCollection, mapFunc, reduceFunc, options, function (err, result) {
        if (err || result.error) {
            Template.showMeteorFuncError(err, result, "Couldn't fetch distinct fields for autocomplete");
        }
        else {
            var nameArray = [];
            result.result.forEach(function (entry) {
                nameArray.push(entry._id);
            });
            Session.set(Template.strSessionDistinctFields, nameArray);

            Ladda.stopAll();
        }

    });
};

Template.registerHelper('isOptionSelected', function (option) {
    return $.inArray(option, Session.get(Template.strSessionSelectedOptions)) != -1;
});

Template.registerHelper('getConnection', function () {
    if (Session.get(Template.strSessionConnection)) {
        return Connections.findOne({_id: Session.get(Template.strSessionConnection)});
    }
});

Template.registerHelper('getSelectedCollection', function () {
    return Session.get(Template.strSessionSelectedCollection);
});

Template.registerHelper('isConnected', function () {
    return (Session.get(Template.strSessionCollectionNames) != undefined);
});

/**
 * Adds remove by value functionality to arrays. e.x. myArray.remove('myValue');
 * */
Array.prototype.remove = function () {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};

/**
 * JS functions can be generated from strings.
 * */
String.prototype.parseFunction = function () {
    var funcReg = /function *\(([^()]*)\)[ \n\t]*{(.*)}/gmi;
    var match = funcReg.exec(this.replace(/\n/g, ' '));
    if (match) {
        return new Function(match[1].split(','), match[2]);
    }

    return null;
};

Template.initializeCodeMirror = function (divSelector, txtAreaId, keepValue) {
    var codeMirror;
    if (!divSelector.data('editor')) {
        codeMirror = CodeMirror.fromTextArea(document.getElementById(txtAreaId), {
            mode: "javascript",
            theme: "neat",
            styleActiveLine: true,
            lineNumbers: true,
            lineWrapping: false,
            extraKeys: {
                "Ctrl-Q": function (cm) {
                    cm.foldCode(cm.getCursor());
                },
                "Ctrl-Space": "autocomplete"
            },
            foldGutter: true,
            gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"]
        });


        if (keepValue) {
            codeMirror.on("change", function () {
                Session.set(Template.strSessionSelectorValue, codeMirror.getValue());
            });
        }

        codeMirror.setSize('%100', 100);

        CodeMirror.hint.javascript = function (editor) {
            var list = Session.get(Template.strSessionDistinctFields) || [];
            var cursor = editor.getCursor();
            var currentLine = editor.getLine(cursor.line);
            var start = cursor.ch;
            var end = start;
            while (end < currentLine.length && /[\w$]+/.test(currentLine.charAt(end))) ++end;
            while (start && /[\w$]+/.test(currentLine.charAt(start - 1))) --start;
            var curWord = start != end && currentLine.slice(start, end);
            var regex = new RegExp('^' + curWord, 'i');
            return {
                list: (!curWord ? list : list.filter(function (item) {
                    return item.match(regex);
                })).sort(),
                from: CodeMirror.Pos(cursor.line, start),
                to: CodeMirror.Pos(cursor.line, end)
            };
        };

        divSelector.data('editor', codeMirror);

        $('.CodeMirror').resizable({
            resize: function () {
                codeMirror.setSize($(this).width(), $(this).height());
            }
        });
    }
    else {
        codeMirror = divSelector.data('editor');
    }

    if (keepValue && Session.get(Template.strSessionSelectorValue)) {
        codeMirror.setValue(Session.get(Template.strSessionSelectorValue));
    }
};

Template.setCodeMirrorValue = function (divSelector, val) {
    if (divSelector.data('editor')) {
        divSelector.data('editor').setValue(val);
    }
};

Template.getCodeMirrorValue = function (divSelector) {
    if (divSelector.data('editor')) {
        return divSelector.data('editor').getValue();
    }
    throw 'Unexpected state, codemirror could not be found';
};
