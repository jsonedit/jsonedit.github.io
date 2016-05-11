'use strict'; // use mode "use strict"

var app = angular.module('JSONedit', ['ui.sortable', 'angularFileUpload', 'ngRoute']);

app.config(['$compileProvider', function ($compileProvider) {
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(|blob|):/);
}]);

app.config(function ($routeProvider) {
    $routeProvider
		.when("/", {
		    templateUrl: "views/home.html",
		    controller: "MainViewCtrl"
		})
		.when("/example", {
		    templateUrl: "views/example.html"
		    
		})
        .when("/about", {
            templateUrl: "views/about.html"
           
        })
        .otherwise({
            redirectTo: "/"
        })
});

app.directive('ngModelOnblur', function () {
    // override the default input to update on blur
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function (scope, elm, attr, ngModelCtrl) {
            if (attr.type === 'radio' || attr.type === 'checkbox') return;

            elm.unbind('input').unbind('keydown').unbind('change');
            elm.bind('blur', function () {
                scope.$apply(function () {
                    ngModelCtrl.$setViewValue(elm.val());
                });
            });
        }
    };
});
app.directive('json', ["$compile", function ($compile) {
    return {
        restrict: 'E', // for Element name <json></json>
        scope: {  // init scope
            child: '=',
            type: '@',
            defaultCollapsed: '='
        },
        link: function (scope, element, attributes) {
            var stringName = "Text";
            var objectName = "Object";
            var arrayName = "Array";
            var boolName = "Boolean";
            var numberName = "Number";

            scope.valueTypes = [stringName, objectName, arrayName, boolName, numberName];
            scope.sortableOptions = {
                axis: 'y' //sort with axis y, more https://api.jqueryui.com/sortable/
            };
            //check defaultCollapsed in html, default false
            if (scope.$parent.defaultCollapsed === undefined) {
                scope.collapsed = false;
            } else {
                scope.collapsed = scope.defaultCollapsed;
            }

            // if collapsed close (as true) show glyphicon-chevron-right 
            if (scope.collapsed) {
                scope.chevron = "glyphicon-chevron-right";
            } else {
                scope.chevron = "glyphicon-chevron-down";
            }

            //function

            //functions getType return type of obj
            var getType = function (obj) {
                var type = Object.prototype.toString.call(obj);
                if (type === "[object Object]") {
                    return "Object";
                } else if (type === "[object Array]") {
                    return "Array";
                } else if (type === "[object Boolean]") {
                    return "Boolean";
                } else if (type === "[object Number]") {
                    return "Number";
                } else {
                    return "Literal";
                }
            };

            var isNumber = function (n) {
                return !isNaN(parseFloat(n)) && isFinite(n);
            };

            scope.getType = function (obj) {
                return getType(obj);
            };

            //event when click toggleCollapse,if collapsed=true change it to false and icon to down
            scope.toggleCollapse = function () {
                if (scope.collapsed) {
                    scope.collapsed = false;
                    scope.chevron = "glyphicon-chevron-down";
                } else {
                    scope.collapsed = true;
                    scope.chevron = "glyphicon-chevron-right";
                }
            };

            //move key,replace old key by new key
            scope.moveKey = function (obj, key, newkey) {
                //moves key to newkey in obj
                if (key !== newkey) {
                    obj[newkey] = obj[key];
                    delete obj[key];
                }
            };

            //delete obj
            scope.deleteKey = function (obj, key) {
                if (getType(obj) == "Object") {
                    if (confirm('Delete "' + key + '" and all it contains?')) {
                        delete obj[key];
                    }
                } else if (getType(obj) == "Array") {
                    if (confirm('Delete it?')) {
                        obj.splice(key, 1);
                    }
                } else {
                    console.error("object to delete from was " + obj);
                }
            };

            //add item
            scope.addItem = function (obj) {
                if (getType(obj) == "Object") {
                    // check input for key
                    if (scope.keyName == undefined || scope.keyName.length == 0) {
                        alert("Please fill in a name !");

                    } else if (scope.keyName.indexOf("$") == 0) {
                        alert("The name may not start with '$' !");
                    } else if (scope.keyName.indexOf("_") == 0) {
                        alert("The name may not start with '_' !");
                    } else {
                        if (obj[scope.keyName]) {
                            if (!confirm('An item with the name "' + scope.keyName
                                + '" exists already. Do you really want to replace it?')) {
                                return;// if is false not do esle is true do it
                            }
                        }
                        if (scope.valueType == numberName && !isNumber(scope.valueName)) {
                            alert("Please fill in a number");
                            return;
                        }
                        // add item to object
                        switch (scope.valueType) {
                            case stringName: obj[scope.keyName] = scope.valueName ? scope.valueName : ""; //(condition) ? valTrue : valFalse
                                break;
                            case numberName: obj[scope.keyName] = scope.possibleNumber(scope.valueName);
                                break;
                            case objectName: obj[scope.keyName] = {};
                                break;
                            case arrayName: obj[scope.keyName] = [];
                                break;

                            case boolName: obj[scope.keyName] = true;
                                break;
                        }
                        //clean-up when add object item done
                        scope.keyName = "";
                        scope.valueName = "";
                        scope.showAddKey = false;
                    }
                } else if (getType(obj) == "Array") {
                    if (scope.valueType == numberName && !isNumber(scope.valueName)) {
                        alert("Please fill in a number");
                        return;
                    }
                    // add item to array
                    switch (scope.valueType) {
                        case stringName: obj.push(scope.valueName ? scope.valueName : "");
                            break;
                        case numberName: obj.push(scope.possibleNumber(scope.valueName));
                            break;
                        case objectName: obj.push({});
                            break;
                        case arrayName: obj.push([]);
                            break;
                        case boolName: obj.push(true);
                            break;

                    }
                    //clean-up when add array item done
                    scope.valueName = "";
                    scope.showAddKey = false;
                } else {
                    console.error("object to add to was " + obj);
                }
            };

            scope.possibleNumber = function (val) {
                return isNumber(val) ? parseFloat(val) : val;
            };


            var switchTemplate =
                '<span ng-switch on="getType(val)" >'
                    + '<json ng-switch-when="Object" child="val" type="object" default-collapsed="defaultCollapsed"></json>'
                    + '<json ng-switch-when="Array" child="val" type="array" default-collapsed="defaultCollapsed"></json>'
                    + '<span ng-switch-when="Boolean" type="boolean">'
                        + '<input type="checkbox" ng-model="val" ng-model-onblur ng-change="child[key] = val">'
                    + '</span>'
                    + '<span ng-switch-when="Number" type="number"><input type="text" ng-model="val" '
                        + 'placeholder="Empty Number ..." ng-model-onblur ng-change="child[key] = possibleNumber(val)"/>'
                    + '</span>'
                    + '<span ng-switch-default class="jsonLiteral"><input type="text" ng-model="val" '
                        + 'placeholder="Empty Text ..." ng-model-onblur ng-change="child[key] = val"/>'
                    + '</span>'
                + '</span>';

            // display either "plus button" or "key-value inputs"
            var addItemTemplate =
            '<div ng-switch on="showAddKey" class="block" >'
                + '<span ng-switch-when="true">';
            if (scope.type == "object") {
                // input key
                addItemTemplate += '<input placeholder="Key ..." type="text" ui-keyup="{\'enter\':\'addItem(child)\'}" '
                    + 'class="form-control input-sm addItemKeyInput" ng-model="$parent.keyName" /> ';
            }
            addItemTemplate +=
            // value type dropdown
            '<select ng-model="$parent.valueType" ng-options="option for option in valueTypes" class="form-control input-sm"'
                + 'ng-init="$parent.valueType=\'' + stringName + '\'" ui-keydown="{\'enter\':\'addItem(child)\'}"></select>'
            // input value
            + '<span ng-show="$parent.valueType == \'' + stringName + '\'"> : <input type="text" placeholder="Text Value ..." '
                + 'class="form-control input-sm addItemValueInput" ng-model="$parent.valueName" ui-keyup="{\'enter\':\'addItem(child)\'}"/></span> '
            + '<span ng-show="$parent.valueType == \'' + numberName + '\'"> : <input type="text" placeholder="Number Value ..." '
                + 'class="form-control input-sm addItemValueInput" ng-model="$parent.valueName" ui-keyup="{\'enter\':\'addItem(child)\'}"/></span> '
            // Add button add and cancel
            + '<button type="button" class="btn btn-success btn-sm" ng-click="addItem(child)">Add</button> '
            + '<button type="button" class="btn btn-danger btn-sm" ng-click="$parent.showAddKey=false">Cancel</button>'
        + '</span>'
        + '<span ng-switch-default>'
            // plus button add +
            + '<button type="button" class="addObjectItemBtn" ng-click="$parent.showAddKey = true"><i class="glyphicon glyphicon-plus addbtn"></i></button>'
        + '</span>'
    + '</div>';

            // start template
            if (scope.type == "object") {
                var template = '<i ng-click="toggleCollapse()" class="glyphicon" ng-class="chevron"></i>'
                + '<span class="jsonItemDesc">' + objectName + '</span>'
                + '<div class="jsonContents" ng-hide="collapsed">'
                    // repeat
                    + '<span class="block" ng-hide="key.indexOf(\'_\') == 0" ng-repeat="(key, val) in child">'
                        // object key
                        + '<span class="jsonObjectKey">'
                            + '<input class="keyinput" type="text" ng-model="newkey" ng-init="newkey=key" '
                                + 'ng-blur="moveKey(child, key, newkey)"/>'
                            // delete button
                            + '<i class="deleteKeyBtn glyphicon glyphicon-trash deletebtn" ng-click="deleteKey(child, key)"></i>'
                        + '</span>'
                        // object value
                        + '<span class="jsonObjectValue">' + switchTemplate + '</span>'
                    + '</span>'
                    // repeat end
                    + addItemTemplate
                + '</div>';
            } else if (scope.type == "array") {
                var template = '<i ng-click="toggleCollapse()" class="glyphicon"'
                + 'ng-class="chevron"></i>'
                + '<span class="jsonItemDesc">' + arrayName + '</span>'
                + '<div class="jsonContents" ng-hide="collapsed">'
                    + '<ol class="arrayOl" ui-sortable="sortableOptions" ng-model="child">'
                        // repeat
                        + '<li class="arrayItem" ng-repeat="(key, val) in child track by $index">'
                            // delete button
                            + '<i class="deleteKeyBtn glyphicon glyphicon-trash deletebtn" ng-click="deleteKey(child, $index)"></i>'
                            + '<i class="moveArrayItemBtn glyphicon glyphicon-align-justify"></i>'
                            + '<span>' + switchTemplate + '</span>'
                        + '</li>'
                        // repeat end
                    + '</ol>'
                    + addItemTemplate
                + '</div>';
            } else {
                console.error("scope.type was " + scope.type);
            }

            var newElement = angular.element(template);
            $compile(newElement)(scope);
            element.replaceWith(newElement);
        }
    };
}]);

app.controller('HeaderCtrl', function ($scope, $location) {
    $scope.isActive = function (viewLocation) {
        return viewLocation === $location.path();
    };
});
app.controller('HomeCtrl', function ($scope) {
    $scope.appTitle = "JSON Editor";
});

app.controller('MainViewCtrl', ["$scope", "$routeParams", "$filter", "$window", function ($scope, $routeParams, $filter, $window) {
    $scope.showMess = false;
    $scope.jsonData = {};

    //function isValidJson 
    $scope.isValidJson = function (json) {
        try {
            JSON.parse(json);
            return true;
        } catch (e) {
            return false;
        }
    };
    //upload file
    $scope.$watch('uploadedFile', function () {
        if ($scope.uploadedFile != null) { //check null
            var file = $scope.uploadedFile[0];
            var reader = new FileReader();
            reader.onload = function (event) {
                var uploadedFile = this.result;
                if ($scope.isValidJson(uploadedFile) == true) {
                    $scope.showMess = false;

                    $("#jsonTextarea").empty();
                    $scope.jsonData = JSON.parse(uploadedFile);

                    $('#element').empty();

                    $('#element').jsonView(JSON.stringify(
                         JSON.parse(uploadedFile)
                   ));

                }
                else {
                    $scope.showMess = true;
                    $scope.jsonData = {};
                    $('#element').empty();
                    $("#jsonTextarea").empty();
                }
            };
            reader.readAsText(file);
        }
    }, true);
    //save File


    $scope.checkName = function () {
        $scope.showErrName = false;
        $scope.validFileName = true;
        var name = $scope.fileName;
        var notisvalid = /:|\||<|>|"|\?|\*|\\|\//g;
        if (name.length != 0) {
            if (name.match(notisvalid)) {
                $scope.showErrName = true;
            }
            else {

                $scope.validFileName = false;
            }
        } else {
            $scope.validFileName = true;
        }
    };
  
    $scope.savefile = function () {
        var format = $scope.fileFormat,
            name = $scope.fileName,
            data = $scope.jsonString;

        if (format == "txt") {
            var blob = new Blob([data], { type: 'text/plain' });
        } else {
            var blob = new Blob([data], { type: 'application/json' });
        }
        var url = $window.URL || $window.webkitURL;
        $scope.fileName1 = name + "." + format;
        $scope.fileUrl1 = url.createObjectURL(blob);
        $('#myModal').modal('toggle');
    };

    //json data ui
    $scope.$watch('jsonData', function (json) {
        $scope.jsonString = $filter('json')(json);
        $("#element").empty();
        $('#element').jsonView(JSON.stringify(
                            JSON.parse($scope.jsonString)));
           
    }, true);
    //jsonstring textarea
    $scope.$watch('jsonString', function (json) {
        try {
            $scope.jsonData = JSON.parse(json);
            $scope.wellFormed = true;

        } catch (e) {
            $scope.wellFormed = false;

        }
    }, true);
}]);