/*
 * Copyright (c) 2013-2014 Minkyu Lee. All rights reserved.
 *
 * NOTICE:  All information contained herein is, and remains the
 * property of Minkyu Lee. The intellectual and technical concepts
 * contained herein are proprietary to Minkyu Lee and may be covered
 * by Republic of Korea and Foreign Patents, patents in process,
 * and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Minkyu Lee (niklaus.lee@gmail.com).
 *
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true */
/*global define, $, _, window, appshell, staruml */

define(function (require, exports, module) {
    "use strict";

    var AppInit           = staruml.getModule("utils/AppInit"),
        Core              = staruml.getModule("core/Core"),
        PreferenceManager = staruml.getModule("core/PreferenceManager");

    var preferenceId = "php";
    
    var phpPreferences = {
        "php.gen": {
            text: "PHP Code Generation",
            type: "Section"
        },
        "php.gen.phpDoc": {
            text: "PHPDoc",
            description: "Generate PHPDoc comments.",
            type: "Check",
            default: true
        },
        "php.gen.useTab": {
            text: "Use Tab",
            description: "Use Tab for indentation instead of spaces.",
            type: "Check",
            default: false
        },
        "php.gen.indentSpaces": {
            text: "Indent Spaces",
            description: "Number of spaces for indentation.",
            type: "Number",
            default: 4
        },
        "php.gen.classExtension": {
            text: "Append to class filename",
            description: "Insert value into class filename extensions (e.g. MyClass.class.php)",
            type: "String",
            default: ".class"
        },
        "php.gen.interfaceExtension": {
            text: "Append to interface filename",
            description: "Insert value into interface filename extensions (e.g. MyInterface.interface.php)",
            type: "String",
            default: ".interface"
        },
        "php.rev": {
            text: "PHP Reverse Engineering",
            type: "Section"
        },
        "php.rev.association": {
            text: "Use Association",
            description: "Reverse PHP Fields as UML Associations.",
            type: "Check",
            default: true
        },
        "php.rev.publicOnly": {
            text: "Public Only",
            description: "Reverse public members only.",
            type: "Check",
            default: false
        },
        "php.rev.typeHierarchy": {
            text: "Type Hierarchy Diagram",
            description: "Create a type hierarchy diagram for all classes and interfaces",
            type: "Check",
            default: true
        },
        "php.rev.packageOverview": {
            text: "Package Overview Diagram",
            description: "Create overview diagram for each package",
            type: "Check",
            default: true
        },
        "php.rev.packageStructure": {
            text: "Package Structure Diagram",
            description: "Create a package structure diagram for all packages",
            type: "Check",
            default: true
        }
    };
    
    function getId() {
        return preferenceId;
    }

    function getGenOptions() {
        return {
            phpDoc       : PreferenceManager.get("php.gen.phpDoc"),
            useTab        : PreferenceManager.get("php.gen.useTab"),
            indentSpaces  : PreferenceManager.get("php.gen.indentSpaces"),
            classExtension : PreferenceManager.get("php.gen.classExtension"),
            interfaceExtension : PreferenceManager.get("php.gen.interfaceExtension")
        };
    }

    function getRevOptions() {
        return {
            association      : PreferenceManager.get("php.rev.association"),
            publicOnly       : PreferenceManager.get("php.rev.publicOnly"),
            typeHierarchy    : PreferenceManager.get("php.rev.typeHierarchy"),
            packageOverview  : PreferenceManager.get("php.rev.packageOverview"),
            packageStructure : PreferenceManager.get("php.rev.packageStructure")
        };
    }

    AppInit.htmlReady(function () {
        PreferenceManager.register(preferenceId, "PHP", phpPreferences);
    });

    exports.getId         = getId;
    exports.getGenOptions = getGenOptions;
    exports.getRevOptions = getRevOptions;

});
