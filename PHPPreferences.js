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
/*global define, $, _, window, appshell, staruml, app */

define(function (require, exports, module) {
    "use strict";

    var AppInit           = app.getModule("utils/AppInit"),
        Core              = app.getModule("core/Core"),
        PreferenceManager = app.getModule("core/PreferenceManager");

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
        "php.gen.phpStrictMode": {
            text: "Strict Mode",
            description: "Generate PHP Strict Mode.",
            type: "Check",
            default: true
        },
        "php.gen.phpReturnType": {
            text: "Return Type",
            description: "Generate PHP Return Type (e.q. PHP7).",
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
            default: ""
        },
        "php.gen.interfaceExtension": {
            text: "Append to interface filename",
            description: "Insert value into interface filename extensions (e.g. MyInterface.interface.php)",
            type: "String",
            default: ""
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
            interfaceExtension : PreferenceManager.get("php.gen.interfaceExtension"),
            phpStrictMode : PreferenceManager.get("php.gen.phpStrictMode"),
            phpReturnType : PreferenceManager.get("php.gen.phpReturnType")
        };
    }

    AppInit.htmlReady(function () {
        PreferenceManager.register(preferenceId, "PHP", phpPreferences);
    });

    exports.getId         = getId;
    exports.getGenOptions = getGenOptions;

});
