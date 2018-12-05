'use strict';

const ConfigParameter = require(`./parameter`);

module.exports = class ConfigValuePreFormatter {
    /**
     * Formats received new config parameter value to working look
     * @param {string} name    Name of config parameter.
     * @param {Array}  options Array with options for new value of config parameter.
     *
     * @return {*|undefined} Working value of config parameter or undefined for non supported values
     */
    static run(name, options) {
        switch (name) {
            case ConfigParameter.WEIGHT:
                return Number(options[0]);
            case ConfigParameter.MIN_POST_AGE:
            case ConfigParameter.MAX_POST_AGE:
                return options.join(` `);
            default:
                return undefined;
        }
    }
};
