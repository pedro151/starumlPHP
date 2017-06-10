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
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true */
/*global define, $, _, window, staruml, type, document, php7, app */

define ( function ( require , exports , module ) {
    "use strict";

    var Repository     = app.getModule ( "core/Repository" ) ,
        ProjectManager = app.getModule ( "engine/ProjectManager" ) ,
        Engine         = app.getModule ( "engine/Engine" ) ,
        FileSystem     = app.getModule ( "filesystem/FileSystem" ) ,
        FileUtils      = app.getModule ( "file/FileUtils" ) ,
        Async          = app.getModule ( "utils/Async" ) ,
        UML            = app.getModule ( "uml/UML" );

    var CodeGenUtils = require ( "CodeGenUtils" );

    //constant for separate namespace on code
    var SEPARATE_NAMESPACE = '\\';

    /**
     * PHP Code Generator
     * @constructor
     *
     * @param {type.UMLPackage} baseModel
     * @param {string} basePath generated files and directories to be placed
     */
    function PHPCodeGenerator ( baseModel , basePath ) {

        /** @member {type.Model} */
        this.baseModel = baseModel;

        /** @member {string} */
        this.basePath = basePath;

    }

    /**
     * Return Indent String based on options
     * @param {Object} options
     * @return {string}
     */
    PHPCodeGenerator.prototype.getIndentString = function ( options ) {
        if ( options.useTab ) {
            return "\t";
        } else {
            var i , len , indent = [];
            for ( i = 0, len = options.indentSpaces; i < len; i++ ) {
                indent.push ( " " );
            }
            return indent.join ( "" );
        }
    };

    /**
     * Generate codes from a given element
     * @param {type.Model} elem
     * @param {string} path
     * @param {Object} options
     * @return {$.Promise}
     */
    PHPCodeGenerator.prototype.generate = function ( elem , path , options ) {
        var result   = new $.Deferred () ,
            self     = this ,
            fullPath = path + "/" + elem.name ,
            directory;

        // Package
        if ( elem instanceof type.UMLPackage ) {
            directory = FileSystem.getDirectoryForPath ( fullPath );
            directory.create ( function ( err , stat ) {
                if ( !err ) {
                    Async.doSequentially (
                        elem.ownedElements ,
                        function ( child ) {
                            return self.generate ( child , fullPath , options );
                        } ,
                        false
                    ).then ( result.resolve , result.reject );
                } else {
                    result.reject ( err );
                }
            } );
        } else if ( this.isClass ( elem , type ) ) {
            this.generateClass ( elem , path , options , result );
        } else {
            result.resolve ();
        }
        return result.promise ();
    };

    /**
     *  verify type class
     * @param elem
     * @param type
     * @returns {boolean}
     */
    PHPCodeGenerator.prototype.isClass = function ( elem , type ) {
        return elem instanceof type.UMLClass
            || elem instanceof type.UMLInterface
            || elem instanceof type.UMLEnumeration;
    };

    /**
     * generate file class
     * @param elem
     * @param path
     * @param options
     * @param result
     */
    PHPCodeGenerator.prototype.generateClass = function ( elem , path , options , result ) {
        var codeWriter ,
            file ,
            classExtension = "";

        codeWriter = new CodeGenUtils.CodeWriter ( this.getIndentString ( options ) );
        codeWriter.writeLine ( "<?php\n" );
        this.writePackageDeclaration ( codeWriter , elem );
        codeWriter.writeLine ();
        codeWriter.addSection ( "uses" , true );
        this.writeClasses ( codeWriter , elem , options );
        if ( elem instanceof type.UMLClass && !elem.stereotype === "annotationType" ) {
            classExtension = options.classExtension;
        } else if ( elem instanceof type.UMLInterface ) {
            classExtension = options.interfaceExtension;
        }
        file = FileSystem.getFileForPath ( path + "/" + elem.name + classExtension + ".php" );
        FileUtils.writeText ( file , codeWriter.getData () , true ).then ( result.resolve , result.reject );
    };

    /**
     *
     * @param codeWriter
     * @param elem
     * @param options
     */
    PHPCodeGenerator.prototype.writeClasses = function ( codeWriter , elem , options ) {

        // AnnotationType
        if ( elem instanceof type.UMLClass && elem.stereotype === "annotationType" ) {
            this.writeAnnotationType ( codeWriter , elem , options );

            // Class
        } else if ( elem instanceof type.UMLClass ) {
            this.writeClass ( codeWriter , elem , options );

            // Interface
        } else if ( elem instanceof type.UMLInterface ) {
            this.writeInterface ( codeWriter , elem , options );

            // Enum
        } else if ( elem instanceof type.UMLEnumeration ) {
            this.writeEnum ( codeWriter , elem , options );
        }
    };

    /**
     * Return visibility
     * @param {type.Model} elem
     * @return {string}
     */
    PHPCodeGenerator.prototype.getVisibility = function ( elem ) {
        switch ( elem.visibility ) {
            case UML.VK_PACKAGE:
                return "";
            case UML.VK_PUBLIC:
                return "public";
            case UML.VK_PROTECTED:
                return "protected";
            case UML.VK_PRIVATE:
                return "private";
        }
        return null;
    };

    /**
     * Collect modifiers of a given element.
     * @param {type.Model} elem
     * @return {Array.<string>}
     */
    PHPCodeGenerator.prototype.getModifiersClass = function ( elem ) {
        var modifiers = [];

        if ( elem.isStatic === true ) {
            modifiers.push ( "static" );
        }
        if ( elem.isAbstract === true ) {
            modifiers.push ( "abstract" );
        }
        if ( elem.isFinalSpecification === true || elem.isLeaf === true ) {
            modifiers.push ( "final" );
        }
        // transient
        // volatile
        // strictfp
        // const
        // native
        return modifiers;
    };
    /**
     * Collect modifiers of a given element.
     * @param {type.Model} elem
     * @return {Array.<string>}
     */
    PHPCodeGenerator.prototype.getModifiers = function ( elem ) {
        var modifiers  = [];
        var visibility = this.getVisibility ( elem );
        if ( visibility ) {
            modifiers.push ( visibility );
        }
        var status = this.getModifiersClass ( elem );
        return _.union ( modifiers , status );
    };

    /**
     * Collect super classes of a given element
     * @param {type.Model} elem
     * @return {Array.<type.Model>}
     */
    PHPCodeGenerator.prototype.getSuperClasses = function ( elem ) {
        var generalizations = Repository.getRelationshipsOf ( elem , function ( rel ) {
            return (rel instanceof type.UMLGeneralization && rel.source === elem);
        } );
        return _.map ( generalizations , function ( gen ) {
            return gen.target;
        } );
    };

    /**
     * Collect super interfaces of a given element
     * @param {type.Model} elem
     * @return {Array.<type.Model>}
     */
    PHPCodeGenerator.prototype.getSuperInterfaces = function ( elem ) {
        var realizations = Repository.getRelationshipsOf ( elem , function ( rel ) {
            return (rel instanceof type.UMLInterfaceRealization && rel.source === elem);
        } );
        return _.map ( realizations , function ( gen ) {
            return gen.target;
        } );
    };

    /**
     *
     * @param {type.Model} elem
     * @return {Array}
     */
    PHPCodeGenerator.prototype.getNamespaces = function ( elem ) {
        var _namespace = [];
        var _parent    = [];
        if ( elem._parent instanceof type.UMLPackage && !(elem._parent instanceof type.UMLModel) ) {
            _namespace.push ( elem._parent.name );
            _parent = this.getNamespaces ( elem._parent );
        }

        return _.union ( _parent , _namespace );
    };

    /**
     * Return type expression
     * @param {type.Model} elem
     * @return {string}
     */
    PHPCodeGenerator.prototype.getDocumentType = function ( elem ) {
        var _type      = "void";
        var _namespace = "";

        if ( elem === null ) {
            return _type;
        }

        // type name
        if ( elem instanceof type.UMLAssociationEnd ) {
            if ( elem.reference instanceof type.UMLModelElement && elem.reference.name.length > 0 ) {
                _type      = elem.reference.name;
                _namespace = _.map ( this.getNamespaces ( elem.reference ) , function ( e ) { return e; } ).join ( SEPARATE_NAMESPACE );

                if ( _namespace !== "" ) {
                    _namespace = SEPARATE_NAMESPACE + _namespace;
                }
                _type = _namespace + SEPARATE_NAMESPACE + _type;
            }
        } else {
            if ( elem.type instanceof type.UMLModelElement && elem.type.name.length > 0 ) {
                _type      = elem.type.name;
                _namespace = _.map ( this.getNamespaces ( elem.type ) , function ( e ) { return e; } ).join ( SEPARATE_NAMESPACE );

                if ( _namespace !== "" ) {
                    _namespace = SEPARATE_NAMESPACE + _namespace;
                }
                _type = _namespace + SEPARATE_NAMESPACE + _type;
            } else if ( _.isString ( elem.type ) && elem.type.length > 0 ) {
                _type = elem.type;
            }
        }
        // multiplicity
        if ( elem.multiplicity && this.isAllowedTypeHint ( _type ) ) {
            if ( _.contains ( [ "0..*" , "1..*" , "*" ] , elem.multiplicity.trim () ) ) {
                _type += "[]";
            }
        }
        return _type;
    };

    /**
     *
     * @param elem
     * @returns {string}
     */
    PHPCodeGenerator.prototype.getType = function ( elem ) {
        if ( elem === null ) {
            return "void";
        }
        var _type = this.getDocumentType ( elem );
        if ( elem.multiplicity && this.isAllowedTypeHint ( _type ) ) {
            if ( _type.indexOf ( "[]" ) !== -1 ) {
                _type = "array";
            }
        }
        return _type;
    };

    PHPCodeGenerator.prototype.getTypeHint = function ( elem ) {
        var _type            = "void" ,
            _namespacePath   = [] ,
            _globalNamespace = this.namespacePath ,
            _namespace       = "" ,
            _isObject        = false;

        if ( elem === null ) {
            return _type;
        }

        // type name
        if ( elem instanceof type.UMLAssociationEnd ) {
            if ( elem.reference instanceof type.UMLModelElement && elem.reference.name.length > 0 ) {
                _isObject      = true;
                _type          = elem.reference.name;
                _namespacePath = this.getNamespaces ( elem.reference );
            }
        } else {
            if ( elem.type instanceof type.UMLModelElement && elem.type.name.length > 0 ) {
                _isObject      = true;
                _type          = elem.type.name;
                _namespacePath = this.getNamespaces ( elem.type );
            } else if ( _.isString ( elem.type ) && elem.type.length > 0 ) {
                _type = elem.type;
            }
        }

        if ( _isObject ) {
            if ( _globalNamespace.isEqual ( _globalNamespace.intersect ( _namespacePath ) ) ) {
                _namespace = _.map ( _namespacePath.diff ( _globalNamespace ) , function ( e ) { return e; } ).join ( SEPARATE_NAMESPACE );
            } else {
                _namespace = _.map ( _namespacePath , function ( e ) { return e; } ).join ( SEPARATE_NAMESPACE );
                _namespace = SEPARATE_NAMESPACE + _namespace;
            }

            if ( _namespace.length > 0 ) {
                _type = _namespace + SEPARATE_NAMESPACE + _type;
            }
        }

        return _type;
    };

    Array.prototype.intersect = function ( array ) {
        var result = [];
        for ( var i = 0 , len = this.length; i < len; i++ ) {
            if ( this[ i ] == array[ i ] ) {
                result.push ( array[ i ] );
            }
        }
        return result;
    };

    Array.prototype.isEqual = function ( array ) {
        if ( this.length != array.length ) {
            return false;
        }
        for ( var i = 0 , len = this.length; i < len; i++ ) {
            if ( this[ i ] != array[ i ] ) {
                return false;
            }
        }
        return true;
    };

    Array.prototype.diff = function ( array ) {
        var result = [];
        for ( var i = 0 , len = this.length; i < len; i++ ) {
            if ( this[ i ] != array[ i ] ) {
                result.push ( this[ i ] );
            }
        }
        return result;
    };

    /**
     * Write Doc
     * @param {StringWriter} codeWriter
     * @param {string} text
     * @param {Object} options
     */
    PHPCodeGenerator.prototype.writeDoc = function ( codeWriter , text , options ) {
        var i , len , lines , terms;
        if ( options.phpDoc && _.isString ( text ) ) {
            lines = text.trim ().split ( "\n" );
            codeWriter.writeLine ( "/**" );
            for ( i = 0, len = lines.length; i < len; i++ ) {
                terms = [ " *" ];
                if ( lines[ i ] !== "" ) {
                    terms.push ( lines[ i ].trim () );
                }
                codeWriter.writeLine ( terms.join ( " " ) );
            }
            codeWriter.writeLine ( " */" );
        }
    };

    /**
     * Write Specification
     * @param {StringWriter} codeWriter
     * @param {string} text
     */
    PHPCodeGenerator.prototype.writeSpec = function ( codeWriter , text ) {
        var i , len , lines;
        if ( _.isString ( text ) ) {
            lines = text.trim ().split ( "\n" );
            for ( i = 0, len = lines.length; i < len; i++ ) {
                codeWriter.writeLine ( lines[ i ] );
            }
        }
    };

    var namespacePath = null;

    /**
     * Write Package Declaration
     * @param {StringWriter} codeWriter
     * @param {type.Model} elem
     */
    PHPCodeGenerator.prototype.writePackageDeclaration = function ( codeWriter , elem ) {
        var namespace      = null;
        this.namespacePath = this.getNamespaces ( elem );
        if ( this.namespacePath.length > 0 ) {
            namespace = this.namespacePath.join ( SEPARATE_NAMESPACE );
        }
        if ( namespace ) {
            codeWriter.writeLine ( "namespace " + namespace + ";" );
        }
    };

    /**
     * Write Constructor
     * @param {StringWriter} codeWriter
     * @param {type.Model} elem
     * @param {Object} options
     */
    PHPCodeGenerator.prototype.writeConstructor = function ( codeWriter , elem , options ) {
        var haveConstruct = false;
        for ( var i = 0 , len = elem.operations.length; i < len; i++ ) {
            if ( elem.operations[ i ].name.indexOf ( "__construct" ) !== -1 ) {
                haveConstruct = true;
            }
        }
        var _extends = this.getSuperClasses ( elem );

        if ( elem.name.length > 0 && _extends.length <= 0 ) {
            if ( !haveConstruct ) {
                var terms = [];
                // Doc
                this.writeDoc ( codeWriter , elem.documentation , options );
                var visibility = this.getVisibility ( elem );
                if ( visibility ) {
                    terms.push ( visibility );
                }
                terms.push ( "function __construct()" );
                codeWriter.writeLine ( terms.join ( " " ) );
                codeWriter.writeLine ( "{" );
                codeWriter.writeLine ( "}" );
            }
        }
    };

    /**
     * Write Member Variable
     * @param {StringWriter} codeWriter
     * @param {type.Model} elem
     * @param {Object} options
     */
    PHPCodeGenerator.prototype.writeMemberVariable = function ( codeWriter , elem , options ) {
        if ( elem.name.length > 0 ) {
            var terms = [];
            // doc
            var doc   = "@var " + this.getDocumentType ( elem ) + " " + elem.documentation.trim ();
            this.writeDoc ( codeWriter , doc , options );

            // modifiers const
            if ( elem.isFinalSpecification === true || elem.isLeaf === true ) {
                terms.push ( "const " + elem.name.toUpperCase () );
            }
            else {
                // modifiers
                var _modifiers = this.getModifiers ( elem );
                if ( _modifiers.length > 0 ) {
                    terms.push ( _modifiers.join ( " " ) );
                }
                // name
                terms.push ( "$" + elem.name );
            }
            // initial value
            if ( elem.defaultValue && elem.defaultValue.length > 0 ) {
                terms.push ( "= " + elem.defaultValue );
            }
            codeWriter.writeLine ( terms.join ( " " ) + ";" );
        }
    };

    /**
     * Write Methods for Abstract parent and Interfaces
     * @param {StringWriter} codeWriter
     * @param {type.Model} elem
     * @param {Object} options
     * @param {boolean} onlyAbstract
     */
    PHPCodeGenerator.prototype.writeSuperMethods = function ( codeWriter , elem , options , methods , onlyAbstract ) {
        onlyAbstract = onlyAbstract || false;
        for ( var i = 0 , len = elem.operations.length; i < len; i++ ) {
            var method = elem.operations[ i ];
            if ( method !== undefined && !_.contains ( methods , method.name ) && !onlyAbstract || method.isAbstract === true ) {
                var clone = _.clone ( method );
                if ( onlyAbstract ) {
                    clone.isAbstract = false;
                }
                clone.documentation = "@inheritDoc";
                var implemented     = this.writeMethod ( codeWriter , clone , options , false , false );
                if ( implemented ) {
                    codeWriter.writeLine ();
                    methods.push ( method.name );
                }
            }
        }
    };

    /**
     * Write Method
     * @param {StringWriter} codeWriter
     * @param {type.Model} elem
     * @param {Object} options
     * @param {boolean} skipBody
     * @param {boolean} skipParams
     * @return {boolean}
     */
    PHPCodeGenerator.prototype.writeMethod = function ( codeWriter , elem , options , skipBody , skipParams ) {
        if ( elem.name.length > 0 ) {
            var terms       = [];
            var params      = elem.getNonReturnParameters ();
            var returnParam = elem.getReturnParameter ();
            var _that       = this;
            // doc
            var doc         = elem.documentation.trim ();
            _.each ( params , function ( param ) {
                doc += "\n@param " + _that.getDocumentType ( param ) + " $" + param.name + " " + param.documentation;
            } );
            if ( returnParam ) {
                doc += "\n@return " + this.getDocumentType ( returnParam ) + " " + returnParam.documentation;
            }
            this.writeDoc ( codeWriter , doc , options );

            // modifiers
            var _modifiers = this.getModifiers ( elem );
            if ( _modifiers.length > 0 ) {
                terms.push ( _modifiers.join ( " " ) );
            }

            terms.push ( "function" );

            // name + parameters
            var paramTerms = [];
            if ( !skipParams ) {
                var i , len;
                for ( i = 0, len = params.length; i < len; i++ ) {
                    var p            = params[ i ];
                    var s            = "$" + p.name;
                    var defaultValue = p.defaultValue;
                    var type         = this.getType ( p );
                    if ( options.phpStrictMode && this.isAllowedTypeHint ( type ) ) {
                        s = this.getTypeHint ( p ) + " " + s;
                    }

                    if ( defaultValue.length > 0 ) {
                        s += " = " + defaultValue;
                    }
                    paramTerms.push ( s );
                }
            }

            var functionName = elem.name + "(" + paramTerms.join ( ", " ) + ")";
            if ( options.phpReturnType ) {
                functionName = functionName + ':' + this.getTypeHint ( returnParam );
            }
            terms.push ( functionName );

            // body
            if ( skipBody === true || _.contains ( _modifiers , "abstract" ) ) {
                codeWriter.writeLine ( terms.join ( " " ) + ";" );
            } else {
                codeWriter.writeLine ( terms.join ( " " ) );
                codeWriter.writeLine ( "{" );
                codeWriter.indent ();

                //specification
                if ( elem.specification.length > 0 ) {
                    this.writeSpec ( codeWriter , elem.specification );
                } else {
                    codeWriter.writeLine ( "// TODO: implement here" );

                    // return statement
                    if ( returnParam ) {
                        var returnType = this.getType ( returnParam );
                        if ( returnType === "boolean" || returnType === "bool" ) {
                            codeWriter.writeLine ( "return false;" );
                        } else if ( returnType === "int" || returnType === "long" || returnType === "short" || returnType === "byte" ) {
                            codeWriter.writeLine ( "return 0;" );
                        } else if ( returnType === "float" || returnType === "double" ) {
                            codeWriter.writeLine ( "return 0.0;" );
                        } else if ( returnType === "char" ) {
                            codeWriter.writeLine ( "return '0';" );
                        } else if ( returnType === "string" ) {
                            codeWriter.writeLine ( 'return "";' );
                        } else if ( returnType === "array" ) {
                            codeWriter.writeLine ( "return array();" );
                        } else {
                            codeWriter.writeLine ( "return null;" );
                        }
                    }
                }

                codeWriter.outdent ();
                codeWriter.writeLine ( "}" );
            }
            return true;
        }

        return false;
    };

    /**
     * Write Class
     * @param {StringWriter} codeWriter
     * @param {type.Model} elem
     * @param {Object} options
     */
    PHPCodeGenerator.prototype.writeClass = function ( codeWriter , elem , options ) {
        var i , len , terms = [];

        // Doc
        var doc = elem.documentation.trim ();
        if ( ProjectManager.getProject ().author && ProjectManager.getProject ().author.length > 0 ) {
            doc += "\n@author " + ProjectManager.getProject ().author;
        }
        this.writeDoc ( codeWriter , doc , options );

        // Modifiers
        var _modifiers = this.getModifiersClass ( elem );
        if ( _modifiers.length > 0 ) {
            terms.push ( _modifiers.join ( " " ) );
        }

        // Class
        terms.push ( "class" );
        terms.push ( elem.name );

        // Extends
        var _extends = this.getSuperClasses ( elem );
        var _superClass;
        if ( _extends.length > 0 ) {
            _superClass = _extends[ 0 ];
            terms.push ( "extends " + _superClass.name );
        }

        // Implements
        var _implements = this.getSuperInterfaces ( elem );
        if ( _implements.length > 0 ) {
            terms.push ( "implements " + _.map ( _implements , function ( e ) {
                    return e.name;
                } ).join ( ", " ) );
        }

        codeWriter.writeLine ( terms.join ( " " ) );
        codeWriter.writeLine ( "{" );
        codeWriter.indent ();

        // Constructor
        this.writeConstructor ( codeWriter , elem , options );
        codeWriter.writeLine ();

        // Member Variables
        // (from attributes)
        for ( i = 0, len = elem.attributes.length; i < len; i++ ) {
            this.writeMemberVariable ( codeWriter , elem.attributes[ i ] , options );
            codeWriter.writeLine ();
        }
        // (from associations)
        var associations = Repository.getRelationshipsOf ( elem , function ( rel ) {
            return (rel instanceof type.UMLAssociation);
        } );
        for ( i = 0, len = associations.length; i < len; i++ ) {
            var asso = associations[ i ];
            if ( asso.end1.reference === elem && asso.end2.navigable === true ) {
                this.writeMemberVariable ( codeWriter , asso.end2 , options );
                codeWriter.writeLine ();
            } else if ( asso.end2.reference === elem && asso.end1.navigable === true ) {
                this.writeMemberVariable ( codeWriter , asso.end1 , options );
                codeWriter.writeLine ();
            }
        }

        // Methods
        var methods = [];
        for ( i = 0, len = elem.operations.length; i < len; i++ ) {
            var implemented = this.writeMethod ( codeWriter , elem.operations[ i ] , options , false , false );
            if ( implemented ) {
                codeWriter.writeLine ();
                methods.push ( elem.operations[ i ].name );
            }
        }

        if ( _superClass !== undefined ) {
            this.writeSuperMethods ( codeWriter , _superClass , options , methods , true );
        }

        if ( _implements.length > 0 ) {
            for ( i = 0, len = _implements.length; i < len; i++ ) {
                this.writeSuperMethods ( codeWriter , _implements[ i ] , options , methods );
            }
        }

        // Inner Definitions
        for ( i = 0, len = elem.ownedElements.length; i < len; i++ ) {
            var def = elem.ownedElements[ i ];
            if ( this.isClass ( def , type ) ) {
                this.writeClasses ( codeWriter , def , options );
            }
            codeWriter.writeLine ();
        }

        codeWriter.outdent ();
        codeWriter.lines.pop ();
        codeWriter.writeLine ( "}\n" );
    };

    /**
     * Write Interface
     * @param {StringWriter} codeWriter
     * @param {type.Model} elem
     * @param {Object} options
     */
    PHPCodeGenerator.prototype.writeInterface = function ( codeWriter , elem , options ) {
        var i , len , terms = [];

        // Doc
        this.writeDoc ( codeWriter , elem.documentation , options );

        // Interface
        terms.push ( "interface" );
        terms.push ( elem.name );

        // Extends
        var _extends = this.getSuperClasses ( elem );
        if ( _extends.length > 0 ) {
            terms.push ( "extends " + _.map ( _extends , function ( e ) {
                    return e.name;
                } ).join ( ", " ) );
        }
        codeWriter.writeLine ( terms.join ( " " ) );
        codeWriter.writeLine ( "{" );
        codeWriter.indent ();

        // Member Variables
        // (from attributes)
        for ( i = 0, len = elem.attributes.length; i < len; i++ ) {
            this.writeMemberVariable ( codeWriter , elem.attributes[ i ] , options );
            codeWriter.writeLine ();
        }
        // (from associations)
        var associations = Repository.getRelationshipsOf ( elem , function ( rel ) {
            return (rel instanceof type.UMLAssociation);
        } );
        for ( i = 0, len = associations.length; i < len; i++ ) {
            var asso = associations[ i ];
            if ( asso.end1.reference === elem && asso.end2.navigable === true ) {
                this.writeMemberVariable ( codeWriter , asso.end2 , options );
                codeWriter.writeLine ();
            } else if ( asso.end2.reference === elem && asso.end1.navigable === true ) {
                this.writeMemberVariable ( codeWriter , asso.end1 , options );
                codeWriter.writeLine ();
            }
        }

        // Methods
        for ( i = 0, len = elem.operations.length; i < len; i++ ) {
            this.writeMethod ( codeWriter , elem.operations[ i ] , options , true , false );
            codeWriter.writeLine ();
        }

        // Inner Definitions
        for ( i = 0, len = elem.ownedElements.length; i < len; i++ ) {
            var def = elem.ownedElements[ i ];
            this.writeClasses ( codeWriter , def , options );
            codeWriter.writeLine ();
        }

        codeWriter.outdent ();
        codeWriter.lines.pop ();
        codeWriter.writeLine ( "}\n" );
    };

    /**
     * Write Enum
     * @param {StringWriter} codeWriter
     * @param {type.Model} elem
     * @param {Object} options
     */
    PHPCodeGenerator.prototype.writeEnum = function ( codeWriter , elem , options ) {
        var i , len , terms = [] ,
            literals        = [];
        // Doc
        this.writeDoc ( codeWriter , elem.documentation , options );

        // Enum
        terms.push ( "class" );
        terms.push ( elem.name );
        terms.push ( "extends" );
        terms.push ( SEPARATE_NAMESPACE + "SplEnum" );

        codeWriter.writeLine ( terms.join ( " " ) + "\n{" );
        codeWriter.indent ();

        // Literals
        for ( i = 0, len = elem.literals.length; i < len; i++ ) {
            literals.push ( "const" );
            literals.push ( elem.literals[ i ].name );
            literals.push ( "=" );
            literals.push ( i );
            literals.push ( ";" );
        }

        codeWriter.writeLine ( literals.join ( " " ) + "\n" );

        codeWriter.outdent ();
        codeWriter.lines.pop ();
        codeWriter.writeLine ( "}\n" );
    };

    /**
     * Write AnnotationType
     * @param {StringWriter} codeWriter
     * @param {type.Model} elem
     * @param {Object} options
     */
    PHPCodeGenerator.prototype.writeAnnotationType = function ( codeWriter , elem , options ) {
        var i , len , terms = [];

        // Doc
        var doc = elem.documentation.trim ();
        if ( Repository.getProject ().author && Repository.getProject ().author.length > 0 ) {
            doc += "\n@author " + Repository.getProject ().author;
        }
        this.writeDoc ( codeWriter , doc , options );

        // Modifiers
        var _modifiers = this.getModifiersClass ( elem );

        if ( _modifiers.length > 0 ) {
            terms.push ( _modifiers.join ( " " ) );
        }

        // AnnotationType
        terms.push ( "@interface" );
        terms.push ( elem.name );

        codeWriter.writeLine ( terms.join ( " " ) + "\n{" );
        codeWriter.writeLine ();
        codeWriter.indent ();

        // Member Variables
        for ( i = 0, len = elem.attributes.length; i < len; i++ ) {
            this.writeMemberVariable ( codeWriter , elem.attributes[ i ] , options );
            codeWriter.writeLine ();
        }

        // Methods
        for ( i = 0, len = elem.operations.length; i < len; i++ ) {
            this.writeMethod ( codeWriter , elem.operations[ i ] , options , true , true );
            codeWriter.writeLine ();
        }

        // Inner Definitions
        for ( i = 0, len = elem.ownedElements.length; i < len; i++ ) {
            var def = elem.ownedElements[ i ];
            this.writeClasses ( codeWriter , def , options );
            codeWriter.writeLine ();
        }

        codeWriter.outdent ();
        codeWriter.writeLine ( "}" );
    };

    /**
     * Is PHP allowed type hint ?
     * @param {string} type
     * @return {boolean}
     */
    PHPCodeGenerator.prototype.isAllowedTypeHint = function ( type ) {
        switch ( type ) {
            case "void":
                return false;
            default:
                return true;
        }
    };

    /**
     * Generate
     * @param {type.Model} baseModel
     * @param {string} basePath
     * @param {Object} options
     */
    function generate ( baseModel , basePath , options ) {
        var phpCodeGenerator = new PHPCodeGenerator ( baseModel , basePath );
        return phpCodeGenerator.generate ( baseModel , basePath , options );
    }

    exports.generate = generate;

} );
