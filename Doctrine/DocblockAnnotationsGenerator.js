/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true */
/*global define */

define(function (require, exports, module) {
    "use strict";

    require('Utils/String');

    var Doctrine = require('./Doctrine');
    
    /** @constant {string} */
    var NAMESPACE_SEPARATOR = '\\';

    /**
     * DocblockAnnotationsGenerator
     * @constructor
     */
    function DocblockAnnotationsGenerator (type) {
        /** @member {string} type */
        this.type = type;

        /** @member {string} prefix */
        this.prefix = '';

        if ('default' === this.type) {
            this.prefix += '@';
        } else if ('sfBundle' === this.type) {
            this.prefix += '@ORM' + NAMESPACE_SEPARATOR;
        }
    }

    /**
     * Get the annotations of a property
     * @see Annotations Reference http://docs.doctrine-project.org/projects/doctrine-orm/en/latest/reference/annotations-reference.html#annref-column
     * @see Schema-Representation http://docs.doctrine-project.org/projects/doctrine-dbal/en/latest/reference/schema-representation.html
     * 
     * @param {type.Model} elem
     * @param {string} type
     * @param {type.UMLAssociation} association
     * @return {string}   
     */
    DocblockAnnotationsGenerator.prototype.addPropertyAnnotations = function (elem, type, association) {
        var annotations;

        if ('none' !== this.type) {
            // 'undefined' means that the element is an object, and consequently an association
            if ('undefined' === typeof(association)) {
                annotations = this.createBasicAnnotations(elem, type);
            } else {
                annotations = this.createAssociationAnnotations(elem, association);
            }
        }

        return annotations;
    };

    /**
     * 
     * @param {string} annotation 
     */
    DocblockAnnotationsGenerator.prototype.createAnnotation = function (annotation) {
        return "\n" + this.prefix + annotation;
    };

    /**
     * Get the annotations of an association property (OneToOne, OneToMany, ManyToOne, ManyToMany) for a member variable
     * @see Association Mapping http://docs.doctrine-project.org/projects/doctrine-orm/en/latest/reference/association-mapping.html
     * 
     * @param {type.Model} aEndSource
     * @param {type.UMLAssociation} association
     * @return {string} 
     */
    DocblockAnnotationsGenerator.prototype.createAssociationAnnotations = function (aEndSource, association) {
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

        return this.createAnnotation(associationType + '(' + attrs.join(', ') + ')');
    };

    /**
     * Get basic property attributes (integer, boolean...)
     * @see Basic Mapping http://docs.doctrine-project.org/projects/doctrine-orm/en/latest/reference/basic-mapping.html
     * 
     * @param {type.Model} elem
     * @param {string} type
     * @return {string}
     */
    DocblockAnnotationsGenerator.prototype.createBasicAnnotations = function (elem, type) {
        var annotations = [],
            attrs = [],
            attrOptions = [],
            type = this.isTypeValid(type) ? type : 'string';

        // Main attributes
        attrs.push('name="' + elem.name.toSnakeCase() + '"', 'type="' +  type + '"');
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
        annotations.push('Column(' + attrs.join(', ') + ')');
        if (elem.isID) {
            annotations.push('Id' + this.createAnnotation('GeneratedValue(strategy="AUTO")'));
        }

        return annotations.map(this.createAnnotation, this).join('');
    };

    /**
     * @see Annotations Reference http://docs.doctrine-project.org/projects/doctrine-orm/en/latest/reference/annotations-reference.html#annref-column
     * @see Schema-Representation http://docs.doctrine-project.org/projects/doctrine-dbal/en/latest/reference/schema-representation.html
     * 
     * @param {type.Model} elem
     * @return {string}     
     */
    DocblockAnnotationsGenerator.prototype.createClassAnnotations = function (elem) {
        return [
            'Table(name="' + elem.name.toSnakeCase() + '")',
            'Entity'
        ].map(this.createAnnotation, this).join('');
    };

    /**
     * @return {Array}     
     */
    DocblockAnnotationsGenerator.prototype.getImports = function () {
        return 'sfBundle' === this.type ? [['Doctrine', 'ORM', 'Mapping as ORM'].join(NAMESPACE_SEPARATOR)] : [];
    };

    /**
     * 
     * @return {string} 
     */
    DocblockAnnotationsGenerator.prototype.getSubfolder = function (type) {
        var level = '';

        if ('sfBundle' === this.type) {
            level = ('namespace' === type ? NAMESPACE_SEPARATOR : '/') + 'Entity';
        }

        return level;
    };

    /**
     * Check if the given type is a valid Doctrine type
     * @see http://docs.doctrine-project.org/projects/doctrine-dbal/en/latest/reference/types.html
     * @param {boolean}  
     */
    DocblockAnnotationsGenerator.prototype.isTypeValid = function (type) {
        return -1 !== Doctrine.getTypes().indexOf(type);
    }

    exports.DocblockAnnotationsGenerator = DocblockAnnotationsGenerator;
});
