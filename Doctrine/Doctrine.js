/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true */
/*global define */

/**
 * @see http://docs.doctrine-project.org/projects/doctrine-orm/en/latest/reference/basic-mapping.html
 */
define(function (require, exports, module) {
    "use strict";
    
    exports.getTypes = function() {
        return [
            'string', // Type that maps a SQL VARCHAR to a PHP string.
            'integer', // Type that maps a SQL INT to a PHP integer.
            'smallint', // Type that maps a database SMALLINT to a PHP integer.
            'bigint', // Type that maps a database BIGINT to a PHP string.
            'boolean', // Type that maps a SQL boolean or equivalent (TINYINT) to a PHP boolean.
            'decimal', // Type that maps a SQL DECIMAL to a PHP string.
            'date', // Type that maps a SQL DATETIME to a PHP DateTime object.
            'time', // Type that maps a SQL TIME to a PHP DateTime object.
            'datetime', // Type that maps a SQL DATETIME/TIMESTAMP to a PHP DateTime object.
            'datetimetz', // Type that maps a SQL DATETIME/TIMESTAMP to a PHP DateTime object with timezone.
            'text', // Type that maps a SQL CLOB to a PHP string.
            'object', // Type that maps a SQL CLOB to a PHP object using serialize() and unserialize()
            'array', // Type that maps a SQL CLOB to a PHP array using serialize() and unserialize()
            'simple_array', // Type that maps a SQL CLOB to a PHP array using implode() and explode(), with a comma as delimiter. IMPORTANT Only use this type if you are sure that your values cannot contain a “,”.
            'json_array', // Type that maps a SQL CLOB to a PHP array using json_encode() and json_decode()
            'float', // Type that maps a SQL Float (Double Precision) to a PHP double. IMPORTANT: Works only with locale settings that use decimal points as separator.
            'guid', // Type that maps a database GUID/UUID to a PHP string. Defaults to varchar but uses a specific type if the platform supports it.
            'blob', // Type that maps a SQL BLOB to a PHP resource stream
        ];
    };
});
