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
        "php.syntax": {
            text: "Syntax",
            type: "Section"
        },
        "php.syntax.phpStrictMode": {
            text: "Strict Mode",
            description: "Generate PHP Strict Mode.",
            type: "Check",
            default: true
        },
        "php.syntax.phpReturnType": {
            text: "Return Type",
            description: "Generate PHP Return Type (e.q. PHP7).",
            type: "Check",
            default: true
        },
        "php.syntax.useTab": {
            text: "Use Tab",
            description: "Use Tab for indentation instead of spaces.",
            type: "Check",
            default: false
        },
        "php.syntax.indentSpaces": {
            text: "Indent Spaces",
            description: "Number of spaces for indentation.",
            type: "Number",
            default: 4
        },
        "php.syntax.classExtension": {
            text: "Append to class filename",
            description: "Insert value into class filename extensions (e.g. MyClass.class.php)",
            type: "String",
            default: ""
        },
        "php.syntax.interfaceExtension": {
            text: "Append to interface filename",
            description: "Insert value into interface filename extensions (e.g. MyInterface.interface.php)",
            type: "String",
            default: ""
        },
        "php.doc": {
            text: "Documentation",
            type: "Section"
        },
        "php.doc.phpDoc": {
            text: "PHPDoc",
            description: "Generate PHPDoc comments.",
            type: "Check",
            default: true
        },
        "php.doc.phpDoctrineAnnotations": {
            text: "Doctrine annotations",
            description: "Generate Doctrine 2 ORM docblock annotations.",
            type: "Dropdown",
            default: 0,
            options: [
                {value: 0, text: "None"},
                {value: 1, text: "Doctrine"},
                {value: 2, text: "Symfony (DoctrineBundle)"},
            ]
        },
    };

    function getId() {
        return preferenceId;
    }

    function getGenOptions() {
        return {
            phpStrictMode : PreferenceManager.get("php.syntax.phpStrictMode"),
            phpReturnType : PreferenceManager.get("php.syntax.phpReturnType"),
            useTab        : PreferenceManager.get("php.syntax.useTab"),
            indentSpaces  : PreferenceManager.get("php.syntax.indentSpaces"),
            classExtension : PreferenceManager.get("php.syntax.classExtension"),
            interfaceExtension : PreferenceManager.get("php.syntax.interfaceExtension"),

            phpDoc       : PreferenceManager.get("php.doc.phpDoc"),
            phpDoctrineAnnotations : parseInt(PreferenceManager.get("php.doc.phpDoctrineAnnotations"))
        };
    }

    AppInit.htmlReady(function () {
        PreferenceManager.register(preferenceId, "PHP", phpPreferences);
    });

    exports.getId         = getId;
    exports.getGenOptions = getGenOptions;

});
