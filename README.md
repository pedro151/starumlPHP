PHP Extension for StarUML 2
============================

This extension for StarUML(http://staruml.io) support to generate PHP code from UML model. Install this extension from Extension Manager of StarUML.

PHP Code Generation
--------------------

1. Click the menu (`Tools > PHP > Generate Code...`)
2. Select a base model (or package) that will be generated to PHP.
3. Select a folder where generated PHP source files will be placed.

Configurations optionals
------------------------
* Strict Mode (Type Hinting)
* Return Type (PHP7)
* PHPDoc
* Append to file extension

Features
--------

Belows are the rules to convert from UML model elements to PHP source codes.

### UMLPackage

* converted to _PHP Package_ (as a folder).
* create namespaces

### UMLClass

* converted to _PHP Class_. (as a optional separate `.class.php` file)
* `isAbstract` property to `abstract` modifier.
* `isFinalSpecification` and `isLeaf` property to `final` modifier.
* Default constructor is generated.
* All contained types (_UMLClass_, _UMLInterface_) are generated as inner type definition.
* Documentation property to PHPDoc comment.

### UMLAttribute

* converted to _PHP Field_.
* `visibility` property to one of modifiers `public`, `protected`, `private` and none.
* `name` property to field identifier.
* `type` property to field type.
* `multiplicity` property to array type.
* `isStatic` property to `static` modifier.
* `isLeaf` property to `final` modifier.
* `defaultValue` property to initial value.
* Documentation property to PHPDoc comment.

### UMLOperation

* converted to _PHP Methods_.
* `visibility` property to one of modifiers `public`, `protected`, `private` and none.
* `name` property to method identifier.
* `isAbstract` property to `abstract` modifier.
* `isStatic` property to `static` modifier.
* _UMLParameter_ to _PHP Method Parameters_.
* _UMLParameter_'s name property to parameter identifier.
* _UMLParameter_'s type property to type of parameter.
* _UMLParameter_ with `direction` = `return` to return type of method. When no return parameter, `void` is used.
* _UMLParameter_ with `isReadOnly` = `true` to `final` modifier of parameter.
* Documentation property to PHPDoc comment.

### UMLInterface

* converted to _PHP Interface_.  (as a separate `.interface.php` file)
* `visibility` property to one of modifiers `public`, `protected`, `private` and none.
* Documentation property to PHPDoc comment.

### UMLAssociationEnd

* converted to _PHP Field_.
* `visibility` property to one of modifiers `public`, `protected`, `private` and none.
* `name` property to field identifier.
* `type` property to field type.
* If `multiplicity` is one of `0..*`, `1..*`, `*`, then collection type (`Array`) is used.
* `defaultValue` property to initial value.
* Documentation property to PHPDoc comment.

### UMLGeneralization

* converted to _PHP Extends_ (`extends`).
* Allowed only for _UMLClass_ to _UMLClass_, and _UMLInterface_ to _UMLInterface_.

### UMLInterfaceRealization

* converted to _PHP Implements_ (`implements`).
* Allowed only for _UMLClass_ to _UMLInterface_.
