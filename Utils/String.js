/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true */
/*global define */

define(function (require, exports, module) {
    "use strict";

    /**
     * Convert a string into snake_case
     * 
     * @return {string} 
     */
    String.prototype.toSnakeCase = function() {
        var str = this.replace(/([A-Z])/g, function($1) {return '_' + $1.toLowerCase();});

        return '_' === str.substr(0, 1) ? str.substr(1) : str;
    };
});
