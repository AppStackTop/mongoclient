var JSONEditor = require('jsoneditor');
var toastr = require('toastr');
var Ladda = require('ladda');
/**
 * Created by sercan on 09.02.2016.
 */
Template.fileManagement.onRendered(function () {
    if (Session.get(Template.strSessionCollectionNames) == undefined) {
        Router.go('databaseStats');
        return;
    }

    Template.fileManagement.initFileInformations();
    Template.initiateDatatable($('#tblFiles'), Template.strSessionSelectedFile, true);
});

Template.fileManagement.events({
    'click #btnReloadFiles': function () {
        Template.fileManagement.initFileInformations();
    },

    'click .editor_download': function (e) {
        e.preventDefault();
        Template.warnDemoApp();
    },

    'click .editor_delete': function (e) {
        e.preventDefault();
        Template.warnDemoApp();
    },

    'click #btnUpdateMetadata': function (e) {
        e.preventDefault();
        Template.warnDemoApp();
    },

    'click .editor_show_metadata': function (e) {
        e.preventDefault();
        
        var l = Ladda.create(document.querySelector('#btnClose'));
        l.start();

        var fileRow = Session.get(Template.strSessionSelectedFile);
        if (fileRow) {
            var editorDiv = $('#jsonEditorOfMetadata');
            var jsonEditor = editorDiv.data('jsoneditor');
            if (!jsonEditor) {
                jsonEditor = new JSONEditor(document.getElementById('jsonEditorOfMetadata'), {
                    mode: 'tree',
                    modes: ['code', 'form', 'text', 'tree', 'view'],
                    search: true
                });

                editorDiv.data('jsoneditor', jsonEditor);
            }

            $('#metaDataModal').modal('show');
            Template.fileManagement.proceedShowingMetadata(fileRow._id, jsonEditor);
        }
    }

});

Template.fileManagement.proceedShowingMetadata = function (id, jsonEditor) {
    Meteor.call('getFile', $('#txtBucketName').val(), id, function (err, result) {
        if (err || result.error) {
            Template.showMeteorFuncError(err, result, "Couldn't find file");
        }
        else {
            jsonEditor.set(result.result);
        }
                     
        Ladda.stopAll();
    });
};

Template.fileManagement.initFileInformations = function () {
    var l = Ladda.create(document.querySelector('#btnReloadFiles'));
    l.start();

    var selector = Template.selector.getValue();

    selector = Template.convertAndCheckJSON(selector);
    if (selector["ERROR"]) {
        toastr.error("Syntax error on selector: " + selector["ERROR"]);
                     
        Ladda.stopAll();
        return;
    }

    Meteor.call('getFileInfos', $('#txtBucketName').val(), selector,$('#txtFileFetchLimit').val(), function (err, result) {
            if (err || result.error) {
                Template.showMeteorFuncError(err, result, "Couldn't get file informations");
                return;
            }

            var tblFiles = $('#tblFiles');
            // destroy jquery datatable to prevent reinitialization (https://datatables.net/manual/tech-notes/3)
            if ($.fn.dataTable.isDataTable('#tblFiles')) {
                tblFiles.DataTable().destroy();
            }
            tblFiles.DataTable({
                data: result.result,
                columns: [
                    {data: "_id", "width": "15%"},
                    {data: "filename", "width": "20%"},
                    {data: "chunkSize", "width": "15%"},
                    {data: "uploadDate", "width": "15%"},
                    {data: "length", "width": "15%"}
                ],
                columnDefs: [
                    {
                        targets: [5],
                        data: null,
                        width: "5%",
                        defaultContent: '<a href="" title="Edit Metadata" class="editor_show_metadata"><i class="fa fa-book text-navy"></i></a>'
                    },
                    {
                        targets: [6],
                        data: null,
                        width: "5%",
                        defaultContent: '<a href="" title="Download" class="editor_download"><i class="fa fa-download text-navy"></i></a>'
                    },
                    {
                        targets: [7],
                        data: null,
                        width: "5%",
                        defaultContent: '<a href="" title="Delete" class="editor_delete"><i class="fa fa-remove text-navy"></i></a>'
                    }
                ]
            });

            Ladda.stopAll();
        }
    );
};