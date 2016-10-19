var toastr = require('toastr');
var Ladda = require('ladda');
/**
 * Created by sercan on 14.04.2016.
 */
Template.manageRoles.onRendered(function () {
    Template.initiateDatatable($('#tblRoles'), Template.strSessionUsermanagementRole);
    Template.initiateDatatable($('#tblRolePrivileges'), Template.strSessionUsermanagementPrivilege);
    Template.initiateDatatable($('#tblRolesToInherit'));
});

Template.manageRoles.helpers({
    'getDB': function () {
        return Session.get(Template.strSessionUsermanagementManageSelection);
    },

    'getRole': function () {
        return Session.get(Template.strSessionUsermanagementRole);
    }
});

Template.manageRoles.events({
    'click .editor_delete_role': function (e) {
        e.preventDefault();

        if (!Session.get(Template.strSessionUsermanagementRole)) {
            return;
        }
        swal({
            title: "Are you sure ?",
            text: "You can NOT recover this role afterwards, are you sure ?",
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#DD6B55",
            confirmButtonText: "Yes!",
            cancelButtonText: "No"
        }, function (isConfirm) {
            if (isConfirm) {
                
                var l = Ladda.create(document.querySelector('#btnCloseUMRoles'));
                l.start();

                var command = {dropRole: Session.get(Template.strSessionUsermanagementRole).role};

                var runOnAdminDB = $('#aRunOnAdminDBToFetchUsers').iCheck('update')[0].checked;

                Meteor.call('command', command, false, false, runOnAdminDB, function (err, result) {
                    if (err || result.error) {
                        Template.showMeteorFuncError(err, result, "Couldn't drop role");
                    }
                    else {
                        Template.manageRoles.initRoles();
                        toastr.success('Successfuly dropped role !');
                    }
                });
            }
        });
    },

    'click .editor_edit': function (e) {
        e.preventDefault();
        Template.manageRoles.popEditRoleModal();
    },

    'click .editor_edit_privilege': function (e) {
        e.preventDefault();

        if (!Session.get(Template.strSessionUsermanagementPrivilege)) {
            return;
        }

        $('#addEditPrivilegeModalTitle').text('Edit Privilege');
        $('#addEditPrivilegeModalText').text('');

        
        var l = Ladda.create(document.querySelector('#btnApplyAddPrivilegeToRole'));
        l.start();

        var selectedResource = Session.get(Template.strSessionUsermanagementPrivilege).resource;
        var dbToSelect = '', collectionToSelect = '';
        if (selectedResource && selectedResource != 'anyResource' && selectedResource != 'cluster') {
            if (selectedResource.indexOf('@') != -1) {
                dbToSelect = selectedResource.substr(selectedResource.indexOf('@') + 1);
                collectionToSelect = selectedResource.substr(0, selectedResource.indexOf('@')).replace('<b>', '').replace('</b>', '');
            }
            else if (selectedResource.indexOf('<b>') != -1) {
                collectionToSelect = selectedResource.replace('<b>', '').replace('</b>', '');
            } else {
                dbToSelect = selectedResource;
            }
        }
        else {
            dbToSelect = selectedResource;
        }


        Template.manageRoles.initResourcesForPrivileges(dbToSelect, collectionToSelect);
        Template.manageRoles.initActionsForPrivilege(Session.get(Template.strSessionUsermanagementPrivilege).privilege);

        $('#addPrivilegeToRoleModal').modal('show');
    },

    'click #btnAddNewPrivilegeToRole': function (e) {
        e.preventDefault();
        if (Session.get(Template.strSessionUsermanagementRole) && Session.get(Template.strSessionUsermanagementRole).isBuiltin && $('#addEditRoleModalTitle').text() == 'Edit Role') {
            toastr.warning('Cannot add new privileges to builtin roles !');
            return;
        }

        $('#addEditPrivilegeModalTitle').text('Add Privilege');
        $('#addEditPrivilegeModalText').text('Role ' + (Session.get(Template.strSessionUsermanagementRole) ? Session.get(Template.strSessionUsermanagementRole).role : ''));

        
        var l = Ladda.create(document.querySelector('#btnApplyAddPrivilegeToRole'));
        l.start();

        Template.manageRoles.initResourcesForPrivileges();
        Template.manageRoles.initActionsForPrivilege();

        $('#addPrivilegeToRoleModal').modal('show');
    },

    'click #btnAddNewInheritRoleToRole': function (e) {
        e.preventDefault();
        if (Session.get(Template.strSessionUsermanagementRole) && Session.get(Template.strSessionUsermanagementRole).isBuiltin && $('#addEditRoleModalTitle').text() == 'Edit Role') {
            toastr.warning('Cannot add inherit roles to builtin roles !');
            return;
        }

        
        var l = Ladda.create(document.querySelector('#btnAddInheritRole'));
        l.start();

        Template.manageRoles.initDatabasesForInheritRole();
        $('#addRoleToInherit').modal('show');
    },

    'click #btnApplyAddEditRole': function (e) {
        e.preventDefault();
        var titleSelector = $('#addEditRoleModalTitle');
        var roleNameSelector = $('#inputRoleUM');

        if (Session.get(Template.strSessionUsermanagementRole) && Session.get(Template.strSessionUsermanagementRole).isBuiltin && titleSelector.text() == 'Edit Role') {
            toastr.warning('Cannot change builtin roles !');
            return;
        }

        if ($('#tblRolePrivileges').DataTable().rows().data().length == 0) {
            toastr.warning('At least one privilege is required !');
            return;
        }

        if (!roleNameSelector.val()) {
            toastr.warning('Role name is required !');
            return;
        }

        var command = {};
        if (titleSelector.text() == 'Edit Role') {
            command.updateRole = roleNameSelector.val();
        } else {
            command.createRole = roleNameSelector.val();
        }

        command.privileges = Template.manageRoles.populatePrivilegesToSave();
        command.roles = Template.manageRoles.populateInheritRolesToSave();

        
        var l = Ladda.create(document.querySelector('#btnApplyAddEditRole'));
        l.start();

        var runOnAdminDB = $('#aRunOnAdminDBToFetchUsers').iCheck('update')[0].checked;

        Meteor.call('command', command, false, false, runOnAdminDB, function (err, result) {
            if (err || result.error) {
                Template.showMeteorFuncError(err, result, "Couldn't update role");
            }
            else {
                Template.manageRoles.initRoles();
                if ($('#addEditRoleModalTitle').text() == 'Edit Role') {
                    toastr.success('Successfuly updated role !');
                }
                else {
                    toastr.success('Successfuly added role !');
                }
                $('#editRoleModal').modal('hide');
            }

            Ladda.stopAll();
        });
    },

    'click #btnAddNewRole': function (e) {
        e.preventDefault();

        var inputRoleSelector = $('#inputRoleUM');
        inputRoleSelector.val('');
        inputRoleSelector.prop('disabled', false);

        $('#addEditRoleModalTitle').text('Add Role');
        $('#tblRolePrivileges').DataTable().clear().draw();
        $('#tblRolesToInherit').DataTable().clear().draw();
    },

    'change #cmbPrivilegeResource': function () {
        var db = $('#cmbPrivilegeResource').find(":selected").text();
        if (db && db != 'anyResource' && db != 'cluster') {
            
            var l = Ladda.create(document.querySelector('#btnApplyAddPrivilegeToRole'));
            l.start();

            Template.manageRoles.initCollectionsForPrivilege(null, db, true);
        } else {
            var cmb = $('#cmbPrivilegeCollection');
            cmb.empty();
            cmb.val('').trigger('chosen:updated');
        }
    },

    'click #btnApplyAddPrivilegeToRole': function (e) {
        e.preventDefault();

        var cmbPrivilegeSelector = $('#cmbPrivilegeResource');
        var cmbPrivilegeCollection = $('#cmbPrivilegeCollection');

        var actions = $('#cmbActionsOfPrivilege').val();
        var resource = cmbPrivilegeSelector.val() ? cmbPrivilegeSelector.val() : '';
        if (cmbPrivilegeCollection.val() && resource != 'anyResource' && resource != 'cluster') {
            if (resource) {
                resource = '<b>' + cmbPrivilegeCollection.val() + '</b>@' + resource;
            } else {
                resource = '<b>' + cmbPrivilegeCollection.val() + '</b>';
            }
        }

        if (!actions) {
            toastr.warning('At least one action is required !');
            return;
        }

        var privilegesTableSelector = $('#tblRolePrivileges').DataTable();
        if ($('#addEditPrivilegeModalTitle').text() == 'Edit Privilege') {
            // edit existing privilege of role
            var selectedRowData = Session.get(Template.strSessionUsermanagementPrivilege);

            privilegesTableSelector.rows().every(function () {
                var privilegesData = this.data();
                if (_.isEqual(privilegesData.privilege, selectedRowData.privilege)
                    && privilegesData.resource == selectedRowData.resource) {

                    privilegesData.privilege = actions;
                    privilegesData.resource = resource;
                }

                this.invalidate();
            });

            privilegesTableSelector.draw();
        }
        else {
            var objectToAdd = {
                privilege: actions,
                resource: resource
            };

            if (privilegesTableSelector.rows().data().length == 0) {
                Template.manageRoles.populateRolePrivilegesTable(null, [objectToAdd]);
            }
            else {
                privilegesTableSelector.row.add(objectToAdd).draw();
            }
        }

        $('#addPrivilegeToRoleModal').modal('hide');
    },

    'click #btnAddInheritRole': function (e) {
        e.preventDefault();

        var db = $('#cmbDatabasesForInheritRole').val();
        var role = $('#cmbRolesForDBForInheritedRole').val();

        if (!db) {
            toastr.warning('Database is required !');
            return;
        }
        if (!role) {
            toastr.warning('Role is required !');
            return;
        }

        var table = $('#tblRolesToInherit').DataTable();
        var currentDatas = table.rows().data();
        for (var i = 0; i < currentDatas.length; i++) {
            if (currentDatas[i].db == db && currentDatas[i].role == role) {
                toastr.error('<b>' + role + '</b>@' + db + ' already exists !');
                return;
            }
        }

        var objectToAdd = {role: role, db: db};
        if (table.rows().data().length == 0) {
            Template.manageRoles.populateRolesToInheritTable(null, [objectToAdd]);
        }
        else {
            table.row.add(objectToAdd).draw();
        }

        toastr.success('<b>' + role + '</b>@' + db + ' successfuly added');
    }

});

Template.manageRoles.initRoles = function () {
    // loading button
    
    var l = Ladda.create(document.querySelector('#btnCloseUMRoles'));
    l.start();

    var command = {
        rolesInfo: 1,
        showBuiltinRoles: true
    };

    var runOnAdminDB = $('#aRunOnAdminDBToFetchUsers').iCheck('update')[0].checked;

    Meteor.call('command', command, false, false, runOnAdminDB, function (err, result) {
        if (err || result.error) {
            Template.showMeteorFuncError(err, result, "Couldn't fetch roles");
        }
        else {
            var tblRoles = $('#tblRoles');
            // destroy jquery datatable to prevent reinitialization (https://datatables.net/manual/tech-notes/3)
            if ($.fn.dataTable.isDataTable('#tblRoles')) {
                tblRoles.DataTable().destroy();
            }
            tblRoles.DataTable({
                data: result.result.roles,
                columns: [
                    {data: "role", "width": "35%"},
                    {data: "db", "width": "35%"},
                    {data: "isBuiltin", "width": "20%"}
                ],
                columnDefs: [
                    {
                        targets: [3],
                        data: null,
                        width: "5%",
                        render: function (data, type, full) {
                            if (!full.isBuiltin) {
                                return '<a href="" title="Edit" class="editor_edit"><i class="fa fa-edit text-navy"></i></a>';
                            }
                            return '<a href="" title="View" class="editor_edit"><i class="fa fa-eye text-navy"></i></a>';
                        }
                    },
                    {
                        targets: [4],
                        data: null,
                        width: "5%",
                        render: function (data, type, full) {
                            if (!full.isBuiltin) {
                                return '<a href="" title="Delete" class="editor_delete_role"><i class="fa fa-remove text-navy"></i></a>'
                            }
                            return '<a href="" title="Not Allowed"><i class="fa fa-ban text-navy"></i></a>';
                        }
                    }
                ]
            });
        }

                     
        Ladda.stopAll();
    });
};

Template.manageRoles.popEditRoleModal = function (role) {
    $('#addEditRoleModalTitle').text('Edit Role');
    
    var l = Ladda.create(document.querySelector('#btnCloseUMRoles'));
    l.start();

    var connection = Connections.findOne({_id: Session.get(Template.strSessionConnection)});
    var runOnAdminDB = $('#aRunOnAdminDBToFetchUsers').iCheck('update')[0].checked;
    var dbName = runOnAdminDB ? 'admin' : connection.databaseName;
    var roleName = role ? role : Session.get(Template.strSessionUsermanagementRole).role;

    var rolesInfoCommand = {
        rolesInfo: {role: roleName, db: dbName},
        showPrivileges: true
    };

    Meteor.call('command', rolesInfoCommand, false, false, runOnAdminDB, function (err, result) {
        if (err || result.error) {
            Template.showMeteorFuncError(err, result, "Couldn't fetch roleInfo");
        }
        else {
            var role = result.result.roles[0];
            Template.manageRoles.populateRolePrivilegesTable(role);
            Template.manageRoles.populateRolesToInheritTable(role);

            var inputRoleNameSelector = $('#inputRoleUM');
            inputRoleNameSelector.val(role.role);
            inputRoleNameSelector.prop('disabled', true);


            $('#editRoleModal').modal('show');
        }

        Ladda.stopAll();
    });
};

Template.manageRoles.populateRolesToInheritTable = function (role, dataArray) {
    var tblRolesToInherit = $('#tblRolesToInherit');
    // destroy jquery datatable to prevent reinitialization (https://datatables.net/manual/tech-notes/3)
    if ($.fn.dataTable.isDataTable('#tblRolesToInherit')) {
        tblRolesToInherit.DataTable().destroy();
    }
    tblRolesToInherit.DataTable({
        data: dataArray ? dataArray : role.inheritedRoles,
        columns: [
            {data: "role", "width": "50%"},
            {data: "db", "width": "45%"}
        ],
        columnDefs: [
            {
                targets: [2],
                data: null,
                width: "5%",
                render: function () {
                    if (role && role.isBuiltin) {
                        return '<a href="" title="Not Allowed"><i class="fa fa-ban text-navy"></i></a>';
                    }
                    return '<a href="" title="Delete" class="editor_delete"><i class="fa fa-remove text-navy"></i></a>';
                }
            }
        ]
    });
};

Template.manageRoles.populateRolePrivilegesTable = function (role, dataArray) {
    var tblRolePrivileges = $('#tblRolePrivileges');
    // destroy jquery datatable to prevent reinitialization (https://datatables.net/manual/tech-notes/3)
    if ($.fn.dataTable.isDataTable('#tblRolePrivileges')) {
        tblRolePrivileges.DataTable().destroy();
    }

    tblRolePrivileges.DataTable({
        data: dataArray ? dataArray : Template.manageRoles.populateTableDataForRole(role),
        columns: [
            {data: "privilege[, ]", "width": "50%"},
            {data: "resource", "width": "40%"}
        ],
        columnDefs: [
            {
                targets: [2],
                data: null,
                width: "5%",
                render: function () {
                    if (role && role.isBuiltin) {
                        return '<a href="" title="Not Allowed"><i class="fa fa-ban text-navy"></i></a>';
                    }

                    return '<a href="" title="Edit" class="editor_edit_privilege"><i class="fa fa-edit text-navy"></i></a>';
                }
            },
            {
                targets: [3],
                data: null,
                width: "5%",
                render: function () {
                    if (role && role.isBuiltin) {
                        return '<a href="" title="Not Allowed"><i class="fa fa-ban text-navy"></i></a>';
                    }
                    return '<a href="" title="Delete" class="editor_delete"><i class="fa fa-remove text-navy"></i></a>';
                }
            }
        ]
    });
};

Template.manageRoles.populateTableDataForRole = function (role) {
    var result = [];
    if (role.privileges) {
        for (var i = 0; i < role.privileges.length; i++) {
            result.push({
                privilege: role.privileges[i].actions,
                resource: Template.manageRoles.getResource(role.privileges[i].resource)
            });
        }
    }

    return result;
};

Template.manageRoles.getResource = function (resource) {
    if (!resource) {
        return "";
    }

    if (resource.anyResource) {
        return "anyResource";
    }

    if (resource.cluster) {
        return "cluster";
    }

    if (resource.db && resource.collection) {
        return '<b>' + resource.collection + '</b>@' + resource.db;
    }
    if (resource.db) {
        return resource.db;
    }
    if (resource.collection) {
        return '<b>' + resource.collection + '</b>';
    }

    return "";
};

Template.manageRoles.getResourceObject = function (resourceString) {
    if (resourceString != 'anyResource' && resourceString != 'cluster') {
        var result = {};

        if (resourceString.indexOf('@') != -1) {
            result.db = resourceString.substr(resourceString.indexOf('@') + 1);
            result.collection = resourceString.substr(0, resourceString.indexOf('@')).replace('<b>', '').replace('</b>', '');
        }
        else if (resourceString.indexOf('<b>') != -1) {
            result.collection = resourceString.replace('<b>', '').replace('</b>', '');
            result.db = '';
        }
        else {
            result.db = resourceString;
            result.collection = '';
        }

        return result;
    }
    else if (resourceString == 'anyResource') {
        return {anyResource: true};
    }
    else if (resourceString == 'cluster') {
        return {cluster: true};
    }
    else {
        return {db: resourceString};
    }
};

Template.manageRoles.initResourcesForPrivileges = function (dbToSelect, collectionToSelect) {
    var cmb = $('#cmbPrivilegeResource');
    cmb.empty();
    cmb.prepend("<option value=''></option>");

    cmb.append($("<optgroup id='optCluster' label='Cluster'></optgroup>"));

    cmb.find('#optCluster').append($("<option></option>")
        .attr("value", 'cluster')
        .text('cluster'));

    cmb.append($("<optgroup id='optAnyResource' label='Any Resource'></optgroup>"));

    cmb.find('#optAnyResource').append($("<option></option>")
        .attr("value", 'anyResource')
        .text('anyResource'));

    cmb.append($("<optgroup id='optDB' label='Databases'></optgroup>"));

    var cmbDBGroup = cmb.find('#optDB');

    Meteor.call('getDatabases', function (err, result) {
        if (err || result.error) {
            Template.showMeteorFuncError(err, result, "Couldn't fetch databases");
        }
        else {
            for (var i = 0; i < result.result.length; i++) {
                cmbDBGroup.append($("<option></option>")
                    .attr("value", result.result[i].name)
                    .text(result.result[i].name));
            }
        }

        cmb.chosen({
            create_option: true,
            allow_single_deselect: true,
            persistent_create_option: true,
            skip_no_results: true
        });

        if (dbToSelect) {
            if (dbToSelect != 'anyResource' && dbToSelect != 'cluster' &&
                cmbDBGroup.find("option[value = " + dbToSelect + "]").length == 0) {

                cmbDBGroup.append($("<option></option>")
                    .attr("value", dbToSelect)
                    .text(dbToSelect));
            }

            cmb.val(dbToSelect);
        }
        cmb.trigger("chosen:updated");

        // empty combobox first.
        Template.manageRoles.initCollectionsForPrivilege(collectionToSelect);
    });
};

Template.manageRoles.initCollectionsForPrivilege = function (collectionToSelect, db, stopLadda) {
    var cmb = $('#cmbPrivilegeCollection');
    cmb.empty();
    cmb.prepend("<option value=''></option>");

    cmb.append($("<optgroup id='optCollections' label='Collections'></optgroup>"));
    var cmbGroup = cmb.find('#optCollections');

    if (db) {
        Meteor.call('listCollectionNames', db, function (err, result) {
            if (err || result.error) {
                Template.showMeteorFuncError(err, result, "Couldn't fetch collection names");
            }
            else {
                for (var i = 0; i < result.result.length; i++) {
                    cmbGroup.append($("<option></option>")
                        .attr("value", result.result[i].name)
                        .text(result.result[i].name));
                }
            }

            cmb.chosen({
                create_option: true,
                allow_single_deselect: true,
                persistent_create_option: true,
                skip_no_results: true
            });

            if (collectionToSelect) {
                if (cmbGroup.find("option[value = " + collectionToSelect + "]").length == 0) {
                    cmbGroup.append($("<option></option>")
                        .attr("value", collectionToSelect)
                        .text(collectionToSelect));
                }
                cmb.val(collectionToSelect);
            }
            cmb.trigger("chosen:updated");

            if (stopLadda) {
                Ladda.stopAll();
            }
        });
    } else {
        cmb.chosen({
            create_option: true,
            allow_single_deselect: true,
            persistent_create_option: true,
            skip_no_results: true
        });

        if (collectionToSelect) {
            if (cmbGroup.find("option[value = " + collectionToSelect + "]").length == 0) {
                cmbGroup.append($("<option></option>")
                    .attr("value", collectionToSelect)
                    .text(collectionToSelect));
            }

            cmb.val(collectionToSelect);
        }
        cmb.trigger("chosen:updated");

        if (stopLadda) {
            Ladda.stopAll();
        }
    }
};

Template.manageRoles.initActionsForPrivilege = function (actions) {
    var cmb = $('#cmbActionsOfPrivilege');
    cmb.empty();

    Meteor.call('getAllActions', Session.get(Template.strSessionConnection), function (err, result) {
        if (err || result.error) {
            Template.showMeteorFuncError(err, result, "Couldn't fetch actions from docs.mongodb.org");
        }
        else {
            for (var i = 0; i < result.length; i++) {
                cmb.append($("<option></option>")
                    .attr("value", result[i])
                    .text(result[i]));
            }
        }

        cmb.chosen({
            create_option: true,
            persistent_create_option: true,
            skip_no_results: true
        });

        if (actions) {
            for (var j = 0; j < actions.length; j++) {
                if (cmb.find("option[value = " + actions[j] + "]").length == 0) {
                    cmb.append($("<option></option>")
                        .attr("value", actions[j])
                        .text(actions[j]));
                }
            }
            cmb.val(actions);
        }

        cmb.trigger("chosen:updated");
        Ladda.stopAll();
    });
};

Template.manageRoles.initDatabasesForInheritRole = function () {
    var cmb = $('#cmbDatabasesForInheritRole');
    cmb.empty();

    Meteor.call('getDatabases', function (err, result) {
        if (err || result.error) {
            Template.showMeteorFuncError(err, result, "Couldn't fetch databases");
        }
        else {
            for (var i = 0; i < result.result.length; i++) {
                cmb.append($("<option></option>")
                    .attr("value", result.result[i].name)
                    .text(result.result[i].name));
            }
        }

        cmb.chosen({
            create_option: true,
            persistent_create_option: true,
            skip_no_results: true
        });

        cmb.trigger("chosen:updated");
        Template.manageRoles.initRolesForDBForInheritRole();
    });

};

Template.manageRoles.initRolesForDBForInheritRole = function () {
    var cmb = $('#cmbRolesForDBForInheritedRole');
    cmb.empty();
    cmb.prepend("<option value=''></option>");

    var runOnAdminDB = $('#aRunOnAdminDBToFetchUsers').iCheck('update')[0].checked;
    Meteor.call('command', {
        rolesInfo: 1,
        showBuiltinRoles: true
    }, false, false, runOnAdminDB, function (err, result) {
        if (err || result.error) {
            Template.showMeteorFuncError(err, result, "Couldn't fetch roles, please enter one manually");
        }
        else {
            for (var i = 0; i < result.result.roles.length; i++) {
                cmb.append($("<option></option>")
                    .attr("value", result.result.roles[i].role)
                    .text(result.result.roles[i].role));
            }
        }

        cmb.chosen({
            create_option: true,
            persistent_create_option: true,
            skip_no_results: true
        });

        cmb.trigger("chosen:updated");
        Ladda.stopAll();
    });
};

Template.manageRoles.populatePrivilegesToSave = function () {
    var result = [];
    var privileges = $('#tblRolePrivileges').DataTable().rows().data();
    for (var i = 0; i < privileges.length; i++) {
        result.push({
            resource: Template.manageRoles.getResourceObject(privileges[i].resource),
            actions: privileges[i].privilege
        });
    }

    return result;
};

Template.manageRoles.populateInheritRolesToSave = function () {
    var result = [];
    var rolesToInherit = $('#tblRolesToInherit').DataTable().rows().data();
    for (var i = 0; i < rolesToInherit.length; i++) {
        result.push({
            role: rolesToInherit[i].role,
            db: rolesToInherit[i].db
        });
    }

    return result;
};