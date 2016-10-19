var toastr = require('toastr');
var Ladda = require('ladda');
require('bootstrap-filestyle');
/**
 * Created by RSercan on 13.2.2016.
 */
Template.uploadFile.onRendered(function () {
    if (Session.get(Template.strSessionCollectionNames) == undefined) {
        Router.go('databaseStats');
    }

    // $(":file").filestyle({icon: false, buttonBefore: true});
});

Template.uploadFile.events({
    'click #btnUpload': function (e) {
        e.preventDefault();
        Template.warnDemoApp();
    }
});

Template.uploadFile.proceedUploading = function (blob, contentType, metaData, aliases) {

    var l = Ladda.create(document.querySelector('#btnUpload'));
    l.start();
    var fileReader = new FileReader();
    fileReader.onload = function (file) {
        Meteor.call('uploadFile', $('#txtBucketName').val(), new Uint8Array(file.target.result), blob.name, contentType, metaData, aliases, function (err, result) {
            if (err || result.error) {
                Template.showMeteorFuncError(err, result, "Couldn't upload file");
            }
            else {
                toastr.success('Successfuly uploaded file');
                Template.fileManagement.initFileInformations();

                Ladda.stopAll();
            }
        });
    };
    fileReader.readAsArrayBuffer(blob);
};
