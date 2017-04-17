
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true */
/*global define */

define(function (require, exports, module) {
    "use strict";

    var SEPARATE_NAMESPACE = '\\';

    /**
     * DoctrineAnnotationsGenerator
     * @constructor
     */
    function DoctrineAnnotationsGenerator(type) {
        /** @member {integer} type */
        this.type = type;

        require('Utils');

        switch (this.type) {
            case 1:
                this.prefix = '@';
                break;

            case 2:
                this.prefix = '@ORM' + SEPARATE_NAMESPACE;
                break;

            default:
                this.prefix = '';
                break;
        }
    }

    /**
     * Get prefix
     * @return {string} 
     */
    DoctrineAnnotationsGenerator.prototype.getPrefix = function () {
        return this.prefix;
    };

    /**
     * Get type
     * @return {integer} 
     */
    DoctrineAnnotationsGenerator.prototype.getType = function () {
        return this.type;
    };

    /**
     * 
     * @return {string} 
     */
    DoctrineAnnotationsGenerator.prototype.getSubfolder = function (type) {
        var level = '';

        if (2 === this.getType()) {
            level = ('namespace' === type ? SEPARATE_NAMESPACE : '/') + 'Entity';
        }

        return level;
    };

    /**
     * @return {Array}     
     */
    DoctrineAnnotationsGenerator.prototype.getImports = function () {
        return 2 === this.getType() ? [['Doctrine', 'ORM', 'Mapping as ORM'].join(SEPARATE_NAMESPACE)] : [];
    };

    /**
     * @see Annotations Reference http://docs.doctrine-project.org/projects/doctrine-orm/en/latest/reference/annotations-reference.html#annref-column
     * @see Schema-Representation http://docs.doctrine-project.org/projects/doctrine-dbal/en/latest/reference/schema-representation.html
     * 
     * @param {type.Model} elem
     * 
     * @return {string}     
     */
    DoctrineAnnotationsGenerator.prototype.getClassAnnotations = function (elem) {
        return "\n" + this.getPrefix() + 'Table(name="' + elem.name.toSnakeCase() + '")' + "\n" + this.getPrefix() + 'Entity';
    };

    /**
     * Get the annotations for a basic property (integer, boolean...)
     * @see Basic Mapping http://docs.doctrine-project.org/projects/doctrine-orm/en/latest/reference/basic-mapping.html
     * 
     * @param {type.Model} elem
     * @param {string} type
     * 
     * @return {string}
     */
    DoctrineAnnotationsGenerator.prototype.getBasicPropertyAnnotations = function (elem, type) {
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
            if ('string' === type || 'text' === type) { // Add "" around for strings
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
     * Get the annotations of an association property (OneToOne, OneToMany, ManyToOne, ManyToMany) for a member variable
     * @see Association Mapping http://docs.doctrine-project.org/projects/doctrine-orm/en/latest/reference/association-mapping.html
     * 
     * @param {type.Model} aEndSource
     * @param {type.UMLAssociation} association
     * 
     * @return {string} 
     */
    DoctrineAnnotationsGenerator.prototype.getAssociationPropertyAnnotations = function (aEndSource, association) {
        var aEndTarget = aEndSource === association.end1 ? association.end2 : association.end1,
            attrs = [],
            associationType;

        associationType = ('1' === aEndTarget.multiplicity.substr(-1) ? 'One' : 'Many');
        associationType += 'To';
        associationType += ('1' === aEndSource.multiplicity.substr(-1) ? 'One' : 'Many');

        attrs.push('targetEntity="' + aEndSource.reference.name + '"');
        if ('Many' === associationType.substr(-4)) { // Ends with 'Many' (OneToMany or ManyToMany)
            attrs.push(('One' === associationType.substr(0, 3) ? 'mappedBy' : 'invertedBy') + '="' + aEndTarget.name + '"');
        }

        return "\n\n" + this.getPrefix() + associationType + '(' + attrs.join(', ') + ')';
    };

    /**
     * Get the annotations of a property
     * @see Annotations Reference http://docs.doctrine-project.org/projects/doctrine-orm/en/latest/reference/annotations-reference.html#annref-column
     * @see Schema-Representation http://docs.doctrine-project.org/projects/doctrine-dbal/en/latest/reference/schema-representation.html
     * 
     * @param {type.Model} elem
     * @param {string} type
     * @param {type.UMLAssociation} association
     * 
     * @return {string}   
     */
    DoctrineAnnotationsGenerator.prototype.getPropertyAnnotations = function (elem, type, association) {
        var annotations = '';

        if (this.getType() > 0) {
            // It means that the element is not a simple type, but another object, so we will have special annotations like @OneToMany
            if ('undefined' === typeof(association)) {
                annotations = this.getBasicPropertyAnnotations(elem, type);
            } else {
                annotations = this.getAssociationPropertyAnnotations(elem, association);
            }
        }

        return annotations;
    };

    exports.DoctrineAnnotationsGenerator = DoctrineAnnotationsGenerator;
});
