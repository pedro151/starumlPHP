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
/*global define, $, _, window, staruml, type, document, php7 */

define(function (require, exports, module) {
    "use strict";

    var Repository = staruml.getModule("engine/Repository"),
        Engine     = staruml.getModule("engine/Engine"),
        FileSystem = staruml.getModule("filesystem/FileSystem"),
        FileUtils  = staruml.getModule("file/FileUtils"),
        Async      = staruml.getModule("utils/Async"),
        UML        = staruml.getModule("uml/UML");

    var CodeGenUtils = require("CodeGenUtils");
    
    /**
     * PHP Code Generator
     * @constructor
     *
     * @param {type.UMLPackage} baseModel
     * @param {string} basePath generated files and directories to be placed
     */
    function PHPCodeGenerator(baseModel, basePath) {
    
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
    PHPCodeGenerator.prototype.getIndentString = function (options) {
        if (options.useTab) {
            return "\t";
        } else {
            var i, len, indent = [];
            for (i = 0, len = options.indentSpaces; i < len; i++) {
                indent.push(" ");
            }
            return indent.join("");
        }
    };
    
    /**
     * Generate codes from a given element
     * @param {type.Model} elem
     * @param {string} path
     * @param {Object} options
     * @return {$.Promise}
     */
    PHPCodeGenerator.prototype.generate = function (elem, path, options) {
        var result = new $.Deferred(),
            self = this,
            fullPath,
            directory,
            codeWriter,
            file;
        
        // Package
        if (elem instanceof type.UMLPackage) {
            fullPath = path + "/" + elem.name;
            directory = FileSystem.getDirectoryForPath(fullPath);
            directory.create(function (err, stat) {
                if (!err) {
                    Async.doSequentially(
                        elem.ownedElements,
                        function (child) {
                            return self.generate(child, fullPath, options);
                        },
                        false
                    ).then(result.resolve, result.reject);
                } else {
                    result.reject(err);
                }
            });
        } else if (elem instanceof type.UMLClass) {
            
            // AnnotationType
            if (elem.stereotype === "annotationType") {
                fullPath = path + "/" + elem.name + ".php";
                codeWriter = new CodeGenUtils.CodeWriter(this.getIndentString(options));
                this.writePackageDeclaration(codeWriter, elem, options);
                codeWriter.writeLine();
                this.writeAnnotationType(codeWriter, elem, options);
                file = FileSystem.getFileForPath(fullPath);
                FileUtils.writeText(file, codeWriter.getData(), true).then(result.resolve, result.reject);
                
            // Class
            } else {
                fullPath = path + "/" + elem.name + ".class.php";
                codeWriter = new CodeGenUtils.CodeWriter(this.getIndentString(options));
                this.writePackageDeclaration(codeWriter, elem, options);
                codeWriter.writeLine();
                this.writeClass(codeWriter, elem, options);
                file = FileSystem.getFileForPath(fullPath);
                FileUtils.writeText(file, codeWriter.getData(), true).then(result.resolve, result.reject);
            }
            
        // Interface
        } else if (elem instanceof type.UMLInterface) {
            fullPath = path + "/" + elem.name + ".interface.php";
            codeWriter = new CodeGenUtils.CodeWriter(this.getIndentString(options));
            this.writePackageDeclaration(codeWriter, elem, options);
            codeWriter.writeLine();
            this.writeInterface(codeWriter, elem, options);
            file = FileSystem.getFileForPath(fullPath);
            FileUtils.writeText(file, codeWriter.getData(), true).then(result.resolve, result.reject);
            
        // Enum
        } else if (elem instanceof type.UMLEnumeration) {
            fullPath = path + "/" + elem.name + ".php";
            codeWriter = new CodeGenUtils.CodeWriter(this.getIndentString(options));
            this.writePackageDeclaration(codeWriter, elem, options);
            codeWriter.writeLine();
            this.writeEnum(codeWriter, elem, options);
            file = FileSystem.getFileForPath(fullPath);
            FileUtils.writeText(file, codeWriter.getData(), true).then(result.resolve, result.reject);
            
        // Others (Nothing generated.)
        } else {
            result.resolve();
        }
        return result.promise();
    };
    
    
    /**
     * Return visibility
     * @param {type.Model} elem
     * @return {string}
     */
    PHPCodeGenerator.prototype.getVisibility = function (elem) {
        switch (elem.visibility) {
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
    PHPCodeGenerator.prototype.getModifiers = function (elem) {
        var modifiers = [];
        var visibility = this.getVisibility(elem);
        if (visibility) {
            modifiers.push(visibility);
        }
        if (elem.isStatic === true) {
            modifiers.push("static");
        }
        if (elem.isAbstract === true) {
            modifiers.push("abstract");
        }
        if (elem.isFinalSpecification === true || elem.isLeaf === true) {
            modifiers.push("final");
        }
        if (elem.concurrency === UML.CCK_CONCURRENT) {
            modifiers.push("synchronized");
        }
        // transient
        // volatile
        // strictfp
        // const
        // native
        return modifiers;
    };

    /**
     * Collect super classes of a given element
     * @param {type.Model} elem
     * @return {Array.<type.Model>}
     */
    PHPCodeGenerator.prototype.getSuperClasses = function (elem) {
        var generalizations = Repository.getRelationshipsOf(elem, function (rel) {
            return (rel instanceof type.UMLGeneralization && rel.source === elem);
        });
        return _.map(generalizations, function (gen) { return gen.target; });
    };

    /**
     * Collect super interfaces of a given element
     * @param {type.Model} elem
     * @return {Array.<type.Model>}
     */
    PHPCodeGenerator.prototype.getSuperInterfaces = function (elem) {
        var realizations = Repository.getRelationshipsOf(elem, function (rel) {
            return (rel instanceof type.UMLInterfaceRealization && rel.source === elem);
        });
        return _.map(realizations, function (gen) { return gen.target; });
    };

    /**
     * Return type expression
     * @param {type.Model} elem
     * @return {string}
     */
    PHPCodeGenerator.prototype.getType = function (elem) {
        var _type = "void";
        // type name
        if (elem instanceof type.UMLAssociationEnd) {
            if (elem.reference instanceof type.UMLModelElement && elem.reference.name.length > 0) {
                _type = elem.reference.name;
            }
        } else {
            if (elem.type instanceof type.UMLModelElement && elem.type.name.length > 0) {
                _type = elem.type.name;
            } else if (_.isString(elem.type) && elem.type.length > 0) {
                _type = elem.type;
            }
        }
        // multiplicity
        if (elem.multiplicity && _type !== "void") {
                _type += "[]";
        }
        return _type;
    };
    
    /**
     * Write Doc
     * @param {StringWriter} codeWriter
     * @param {string} text
     * @param {Object} options
     */
    PHPCodeGenerator.prototype.writeDoc = function (codeWriter, text, options) {
        var i, len, lines;
        if (options.phpDoc && _.isString(text)) {
            lines = text.trim().split("\n");
            codeWriter.writeLine("/**");
            for (i = 0, len = lines.length; i < len; i++) {
                codeWriter.writeLine(" * " + lines[i]);
            }
            codeWriter.writeLine(" */");
        }
    };

    /**
     * Write Package Declaration
     * @param {StringWriter} codeWriter
     * @param {type.Model} elem
     * @param {Object} options     
     */
    PHPCodeGenerator.prototype.writePackageDeclaration = function (codeWriter, elem, options) {
        var path = null;
        if (elem._parent) {
            path = _.map(elem._parent.getPath(this.baseModel), function (e) { return e.name; }).join(".");
        }
        if (path) {
            codeWriter.writeLine("namespace " + path + ";");
        }
    };

    /**
     * Write Constructor
     * @param {StringWriter} codeWriter
     * @param {type.Model} elem
     * @param {Object} options     
     */
    PHPCodeGenerator.prototype.writeConstructor = function (codeWriter, elem, options) {
		var haveConstruct = false;
        for (var i = 0, len = elem.operations.length; i < len; i++) {
         if(elem.operations[i].name === "__construct")
		 {
			haveConstruct =true;
		 };
        }
        var _extends = this.getSuperClasses(elem);
 
        if (elem.name.length > 0 && ( !haveConstruct | _extends.length <= 0 ) ) {
			
            var terms = [];
            // Doc
            this.writeDoc(codeWriter, elem.documentation, options);
            // Visibility
            var visibility = this.getVisibility(elem);
            if (visibility) {
                terms.push(visibility);
            }
            terms.push("function __construct()");
            codeWriter.writeLine(terms.join(" ") + " {");
            codeWriter.writeLine("}");
        }
    };

    /**
     * Write Member Variable
     * @param {StringWriter} codeWriter
     * @param {type.Model} elem
     * @param {Object} options     
     */
    PHPCodeGenerator.prototype.writeMemberVariable = function (codeWriter, elem, options) {
        if (elem.name.length > 0) {
            var terms = [];
            // doc
			var doc = "@var " + this.getType (elem) + " " + elem.documentation.trim();
            this.writeDoc(codeWriter, doc, options);
			
			// modifiers const
			if (elem.isFinalSpecification === true || elem.isLeaf === true) {
				terms.push("const " + elem.name.toUpperCase ());
			}
			else
			{
				// modifiers
				var _modifiers = this.getModifiers(elem);
				if (_modifiers.length > 0) {
					terms.push(_modifiers.join(" "));
				}
				// name
				terms.push("$"+elem.name);
			}
            // initial value
            if (elem.defaultValue && elem.defaultValue.length > 0) {
                terms.push("= " + elem.defaultValue);
            }
            codeWriter.writeLine(terms.join(" ") + ";");
        }
    };

    /**
     * Write Method
     * @param {StringWriter} codeWriter
     * @param {type.Model} elem
     * @param {Object} options     
     * @param {boolean} skipBody
     * @param {boolean} skipParams
     */
    PHPCodeGenerator.prototype.writeMethod = function (codeWriter, elem, options, skipBody, skipParams) {
        if (elem.name.length > 0) {
            var terms = [];
            var params = elem.getNonReturnParameters();
            var returnParam = elem.getReturnParameter();
            
            // doc
            var doc = elem.documentation.trim();
            _.each(params, function (param) {
                doc += "\n@param " + this.getType(param) + " " + param.name + " " + param.documentation;
            });
            if (returnParam) {
                doc += "\n@return "+ this.getType(returnParam) + " " + returnParam.documentation;
            }
            this.writeDoc(codeWriter, doc, options);
            
            // modifiers
            var _modifiers = this.getModifiers(elem);
            if (_modifiers.length > 0) {
                terms.push(_modifiers.join(" "));
            }
            
            terms.push("function");
            
            
            // name + parameters
            var paramTerms = [];
            if (!skipParams) {
                var i, len;
                for (i = 0, len = params.length; i < len; i++) {
                    var p = params[i];
                    var s = "$" + p.name;
            
                    paramTerms.push(s);
                }
            }
            terms.push(elem.name + "(" + paramTerms.join(", ") + ")");
            
            // body
            if (skipBody === true || _.contains(_modifiers, "abstract")) {
                codeWriter.writeLine(terms.join(" ") + ";");
            } else {
                codeWriter.writeLine(terms.join(" ") + " {");
                codeWriter.indent();
                codeWriter.writeLine("// TODO implement here");
               
                // return statement
                if (returnParam) {
                    var returnType = this.getType(returnParam);
                    if (returnType === "boolean") {
                        codeWriter.writeLine("return false;");
                    } else if (returnType === "int" || returnType === "long" || returnType === "short" || returnType === "byte") {
                        codeWriter.writeLine("return 0;");
                    } else if (returnType === "float" || returnType === "double") {
                        codeWriter.writeLine("return 0.0;");
                    } else if (returnType === "char") {
                        codeWriter.writeLine("return '0';");
                    } else if (returnType === "string") {
                        codeWriter.writeLine('return "";');
                    } else {
                        codeWriter.writeLine("return null;");
                    }
                }
                               
                codeWriter.outdent();
                codeWriter.writeLine("}");
            }
        }
    };

    /**
     * Write Class
     * @param {StringWriter} codeWriter
     * @param {type.Model} elem
     * @param {Object} options     
     */
    PHPCodeGenerator.prototype.writeClass = function (codeWriter, elem, options) {
        var i, len, terms = [];
        
        // Doc
        var doc = elem.documentation.trim();
        if (Repository.getProject().author && Repository.getProject().author.length > 0) {
            doc += "\n@author " + Repository.getProject().author;
        }
        this.writeDoc(codeWriter, doc, options);
        
        // Modifiers
        var _modifiers = this.getModifiers(elem);
        if (_.some(elem.operations, function (op) { return op.isAbstract === true; })) {
            _modifiers.push("abstract");
        }
        
        // Class
        terms.push("class");
        terms.push(elem.name);
        
        // Extends
        var _extends = this.getSuperClasses(elem);
        if (_extends.length > 0) {
            terms.push("extends " + _extends[0].name);
        }
        
        // Implements
        var _implements = this.getSuperInterfaces(elem);
        if (_implements.length > 0) {
            terms.push("implements " + _.map(_implements, function (e) { return e.name; }).join(", "));
        }
        codeWriter.writeLine(terms.join(" ") + " {");
        codeWriter.writeLine();
        codeWriter.indent();

        // Constructor
        this.writeConstructor(codeWriter, elem, options);
        codeWriter.writeLine();

        // Member Variables
        // (from attributes)
        for (i = 0, len = elem.attributes.length; i < len; i++) {
            this.writeMemberVariable(codeWriter, elem.attributes[i], options);
            codeWriter.writeLine();
        }
        // (from associations)
        var associations = Repository.getRelationshipsOf(elem, function (rel) {
            return (rel instanceof type.UMLAssociation);
        });
        for (i = 0, len = associations.length; i < len; i++) {
            var asso = associations[i];
            if (asso.end1.reference === elem && asso.end2.navigable === true) {
                this.writeMemberVariable(codeWriter, asso.end2, options);
                codeWriter.writeLine();
            } else if (asso.end2.reference === elem && asso.end1.navigable === true) {
                this.writeMemberVariable(codeWriter, asso.end1, options);
                codeWriter.writeLine();
            }
        }

        // Methods
        for (i = 0, len = elem.operations.length; i < len; i++) {
            this.writeMethod(codeWriter, elem.operations[i], options, false, false);
            codeWriter.writeLine();
        }

        // Inner Definitions
        for (i = 0, len = elem.ownedElements.length; i < len; i++) {
            var def = elem.ownedElements[i];
            if (def instanceof type.UMLClass) {
                if (def.stereotype === "annotationType") {
                    this.writeAnnotationType(codeWriter, def, options);
                } else {
                    this.writeClass(codeWriter, def, options);
                }
                codeWriter.writeLine();
            } else if (def instanceof type.UMLInterface) {
                this.writeInterface(codeWriter, def, options);
                codeWriter.writeLine();
            } else if (def instanceof type.UMLEnumeration) {
                this.writeEnum(codeWriter, def, options);
                codeWriter.writeLine();
            }
        }

        codeWriter.outdent();
        codeWriter.writeLine("}");
    };


    /**
     * Write Interface
     * @param {StringWriter} codeWriter
     * @param {type.Model} elem
     * @param {Object} options     
     */
    PHPCodeGenerator.prototype.writeInterface = function (codeWriter, elem, options) {
        var i, len, terms = [];
        
        // Doc
        this.writeDoc(codeWriter, elem.documentation, options);
        
        // Modifiers
        var visibility = this.getVisibility(elem);
        if (visibility) {
            terms.push(visibility);
        }
        
        // Interface
        terms.push("interface");
        terms.push(elem.name);
        
        // Extends
        var _extends = this.getSuperClasses(elem);
        if (_extends.length > 0) {
            terms.push("extends " + _.map(_extends, function (e) { return e.name; }).join(", "));
        }
        codeWriter.writeLine(terms.join(" ") + " {");
        codeWriter.writeLine();
        codeWriter.indent();

        // Member Variables
        // (from attributes)
        for (i = 0, len = elem.attributes.length; i < len; i++) {
            this.writeMemberVariable(codeWriter, elem.attributes[i], options);
            codeWriter.writeLine();
        }
        // (from associations)
        var associations = Repository.getRelationshipsOf(elem, function (rel) {
            return (rel instanceof type.UMLAssociation);
        });
        for (i = 0, len = associations.length; i < len; i++) {
            var asso = associations[i];
            if (asso.end1.reference === elem && asso.end2.navigable === true) {
                this.writeMemberVariable(codeWriter, asso.end2, options);
                codeWriter.writeLine();
            } else if (asso.end2.reference === elem && asso.end1.navigable === true) {
                this.writeMemberVariable(codeWriter, asso.end1, options);
                codeWriter.writeLine();
            }
        }

        // Methods
        for (i = 0, len = elem.operations.length; i < len; i++) {
            this.writeMethod(codeWriter, elem.operations[i], options, true, false);
            codeWriter.writeLine();
        }

        // Inner Definitions
        for (i = 0, len = elem.ownedElements.length; i < len; i++) {
            var def = elem.ownedElements[i];
            if (def instanceof type.UMLClass) {
                if (def.stereotype === "annotationType") {
                    this.writeAnnotationType(codeWriter, def, options);
                } else {
                    this.writeClass(codeWriter, def, options);
                }
                codeWriter.writeLine();
            } else if (def instanceof type.UMLEnumeration) {
                this.writeEnum(codeWriter, def, options);
                codeWriter.writeLine();
            }
        }

        codeWriter.outdent();
        codeWriter.writeLine("}");
    };

    /**
     * Write Enum
     * @param {StringWriter} codeWriter
     * @param {type.Model} elem
     * @param {Object} options     
     */
    PHPCodeGenerator.prototype.writeEnum = function (codeWriter, elem, options) {
        var i, len, terms = [];
        // Doc
        this.writeDoc(codeWriter, elem.documentation, options);
        
        // Modifiers
        var visibility = this.getVisibility(elem);
        if (visibility) {
            terms.push(visibility);
        }
        // Enum
        terms.push("enum");
        terms.push(elem.name);

        codeWriter.writeLine(terms.join(" ") + " {");
        codeWriter.indent();

        // Literals
        for (i = 0, len = elem.literals.length; i < len; i++) {
            codeWriter.writeLine(elem.literals[i].name + (i < elem.literals.length - 1 ? "," : ""));
        }

        codeWriter.outdent();
        codeWriter.writeLine("}");
    };

    
    /**
     * Write AnnotationType
     * @param {StringWriter} codeWriter
     * @param {type.Model} elem
     * @param {Object} options     
     */
    PHPCodeGenerator.prototype.writeAnnotationType = function (codeWriter, elem, options) {
        var i, len, terms = [];
        
        // Doc
        var doc = elem.documentation.trim();
        if (Repository.getProject().author && Repository.getProject().author.length > 0) {
            doc += "\n@author " + Repository.getProject().author;
        }
        this.writeDoc(codeWriter, doc, options);
        
        // Modifiers
        var _modifiers = this.getModifiers(elem);
        if (_.some(elem.operations, function (op) { return op.isAbstract === true; })) {
            _modifiers.push("abstract");
        }
        if (_modifiers.length > 0) {
            terms.push(_modifiers.join(" "));
        }
        
        // AnnotationType
        terms.push("@interface");
        terms.push(elem.name);
        
        codeWriter.writeLine(terms.join(" ") + " {");
        codeWriter.writeLine();
        codeWriter.indent();

        // Member Variables
        for (i = 0, len = elem.attributes.length; i < len; i++) {
            this.writeMemberVariable(codeWriter, elem.attributes[i], options);
            codeWriter.writeLine();
        }
        
        // Methods
        for (i = 0, len = elem.operations.length; i < len; i++) {
            this.writeMethod(codeWriter, elem.operations[i], options, true, true);
            codeWriter.writeLine();
        }

        // Inner Definitions
        for (i = 0, len = elem.ownedElements.length; i < len; i++) {
            var def = elem.ownedElements[i];
            if (def instanceof type.UMLClass) {
                if (def.stereotype === "annotationType") {
                    this.writeAnnotationType(codeWriter, def, options);
                } else {
                    this.writeClass(codeWriter, def, options);
                }
                codeWriter.writeLine();
            } else if (def instanceof type.UMLInterface) {
                this.writeInterface(codeWriter, def, options);
                codeWriter.writeLine();
            } else if (def instanceof type.UMLEnumeration) {
                this.writeEnum(codeWriter, def, options);
                codeWriter.writeLine();
            }
        }

        codeWriter.outdent();
        codeWriter.writeLine("}");
    };
        
    /**
     * Generate
     * @param {type.Model} baseModel
     * @param {string} basePath
     * @param {Object} options
     */
    function generate(baseModel, basePath, options) {
        var result = new $.Deferred();
        var phpCodeGenerator = new PHPCodeGenerator(baseModel, basePath);
        return phpCodeGenerator.generate(baseModel, basePath, options);
    }
    
    exports.generate = generate;

});