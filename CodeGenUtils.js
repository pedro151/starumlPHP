/*
 * Copyright (c) 2014 MKLab. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true */
/*global define, _ */

define(function (require, exports, module) {
    "use strict";

    String.prototype.toSnakeCase = function() {
        var str = this.replace(/([A-Z])/g, function($1) {return '_' + $1.toLowerCase();});

        return '_' === str.substr(0, 1) ? str.substr(1) : str;
    };

    /**
     * DoctrineAnnotationGenerator
     * @constructor
     */
    function DoctrineAnnotationGenerator(type) {

        /** @member {integer} type */
        this.type = type;

        /** @member {Boolean} isBundle */
        this.isBundle = 2 === type ? true : false;
    }

    DoctrineAnnotationGenerator.prototype.getPrefix = function () {
        var prefix;

        switch (this.type) {
            case 1:
                prefix = '@';
                break;

            case 2:
                prefix = '@ORM\\';
                break;

            default:
                prefix = '';
                break;
        }

        return prefix;
    };

    DoctrineAnnotationGenerator.prototype.getSubfolder = function (format) {
        var level;

        switch (this.type) {
            case 2:
                level = 'Entity';

                switch (format) {
                    case 'namespace':
                        level = '\\' + level;
                        break;

                    default: // Folder style
                        level = '/' + level;
                        break;
                }
                break;

            default:
                level = '';
                break;
        }

        return level;
    };

    /**
     * @return {Array}     
     */
    DoctrineAnnotationGenerator.prototype.getImports = function () {
        return 2 === this.type ? ['Doctrine\\ORM\\Mapping as ORM'] : [];
    };

    /**
     * @see Annotations Reference http://docs.doctrine-project.org/projects/doctrine-orm/en/latest/reference/annotations-reference.html#annref-column
     * @see Schema-Representation http://docs.doctrine-project.org/projects/doctrine-dbal/en/latest/reference/schema-representation.html
     * 
     * @param {type.Model} elem
     * 
     * @return {string}     
     */
    DoctrineAnnotationGenerator.prototype.getClassAnnotations = function (elem) {
        return "\n" + this.getPrefix() + 'Table(name="' + elem.name.toSnakeCase() + '")' + "\n" + this.getPrefix() + 'Entity';
    };

    /**
     * Generate the simple annotations (integer, boolean...) for a member variable
     * 
     * @param {type.Model} elem
     * @param {string} type
     * 
     * @return {string}
     */
    DoctrineAnnotationGenerator.prototype.generateAnnotationsSimple = function (elem, type) {
        var annotations,
            attrs = [],
            attrOptions = [];

        // Main attributes
        attrs.push('name="' + elem.name.toSnakeCase() + '"');
        attrs.push('type="' + type + '"');
        if (elem.isUnique) {
            attrs.push('unique=true');
        }

        // Special options attribute
        if (elem.defaultValue.length > 0) {
            if ('string' === type || 'text' === type) { // Add "" around for string
                elem.defaultValue = '"' + elem.defaultValue + '"';
            }

            attrOptions.push('"default":' + elem.defaultValue);
        }
        if (attrOptions.length > 0) {
            attrs.push('options={' + attrOptions.join(', ') + '}');
        }

        // Create annotations
        annotations = "\n\n" + this.getPrefix() + 'Column(' + attrs.join(', ') + ')';

        if (elem.isID) {
            annotations += "\n" + this.getPrefix() + 'Id' + "\n" + this.getPrefix() + 'GeneratedValue(strategy="AUTO")';
        }

        return annotations;
    };

    /**
     * Generate reference annotations (OneToOne, OneToMany, ManyToOne, ManyToMany) for a member variable
     * 
     * @param {type.Model} aEndSource
     * @param {type.UMLAssociation} association
     * 
     * @return {string} 
     */
    DoctrineAnnotationGenerator.prototype.generateAnnotationsReference = function (aEndSource, association) {
        var aEndTarget = aEndSource === association.end1 ? association.end2 : association.end1,
            attrs = [],
            relation;

        relation = ('1' === aEndTarget.multiplicity.substr(-1) ? 'One' : 'Many');
        relation += 'To';
        relation += ('1' === aEndSource.multiplicity.substr(-1) ? 'One' : 'Many');

        attrs.push('targetEntity="' + aEndSource.reference.name + '"');
        if ('Many' === relation.substr(-4)) { // Ends with 'Many'
            attrs.push(('One' === relation.substr(0, 3) ? 'mappedBy' : 'invertedBy') + '="' + aEndTarget.name + '"');
        }

        // @TODO: add the @JoinTable annotation for ManyToMany

        return "\n\n" + this.getPrefix() + relation + '(' + attrs.join(', ') + ')';
    };


    /**
     * @see Annotations Reference http://docs.doctrine-project.org/projects/doctrine-orm/en/latest/reference/annotations-reference.html#annref-column
     * @see Schema-Representation http://docs.doctrine-project.org/projects/doctrine-dbal/en/latest/reference/schema-representation.html
     * 
     * @param {type.Model} elem
     * @param {string} type
     * @param {type.UMLAssociation} association
     * 
     * @return {string}   
     */
    DoctrineAnnotationGenerator.prototype.getMemberVariableAnnotations = function (elem, type, association) {
        var annotations = '';

        if (this.type > 0) {
            // It means that the element is not a simple type, but another object, so we will have special annotations like @OneToMany
            if ('undefined' === typeof(association)) {
                annotations = this.generateAnnotationsSimple(elem, type);
            } else {
                annotations = this.generateAnnotationsReference(elem, association);
            }
        }

        return annotations;
    };

    /**
     * CodeWriter
     * @constructor
     */
    function CodeWriter(indentString) {

        /** @member {Array.<string>} lines */
        this.lines = [];

        /** @member {string} indentString */
        this.indentString = indentString || "    "; // default 4 spaces

        /** @member {Array.<string>} indentations */
        this.indentations = [];

        /** @member {Array} section */
        this.sections = [];
    }

    /**
     * Indent
     */
    CodeWriter.prototype.indent = function () {
        this.indentations.push(this.indentString);
    };

    /**
     * Outdent
     */
    CodeWriter.prototype.outdent = function () {
        this.indentations.splice(this.indentations.length - 1, 1);
    };

    /**
     * Add named section to ba able to write lines in it
     * @param {string} line
     * @param {boolean} uniqueItems
     */
    CodeWriter.prototype.addSection = function (name, uniqueItems) {
        uniqueItems = uniqueItems || false;

        if (!_.contains(this.sections, {name: name})) {
            this.sections.push({
                name: name,
                line: this.lines.length,
                indentations: _.clone(this.indentations),
                insertEmptyLine: true,
                uniqueItems: uniqueItems,
                items: []
            });
        }
    };

    /**
     * Write a line in section
     * @param {string} line
     * @param {string} name
     */
    CodeWriter.prototype.writeLineInSection = function (line, name) {
        var section = _.findWhere(this.sections, {name: name});
        if (section) {
            if (line && (!section.uniqueItems || !_.contains(section.items, line))) {
                this.lines.splice(section.line, 0, section.indentations.join("") + line);
                section.items.push(line);
            } else {
                this.lines.splice(section.line, 0, "");
            }
            section.line++;
            if (section.insertEmptyLine) {
                this.lines.splice(section.line, 0, "");
                section.insertEmptyLine = false;
            }
        }
    };

    /**
     * Write a line
     * @param {string} line
     */
    CodeWriter.prototype.writeLine = function (line) {
        if (line) {
            this.lines.push(this.indentations.join("") + line);
        } else {
            this.lines.push("");
        }
    };

    /**
     * Return as all string data
     * @return {string}
     */
    CodeWriter.prototype.getData = function () {
        return this.lines.join("\n");
    };

    exports.CodeWriter = CodeWriter;
    exports.DoctrineAnnotationGenerator = DoctrineAnnotationGenerator;

});