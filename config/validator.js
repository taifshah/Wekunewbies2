'use strict';

const chrono = require(`chrono-node`)
    , sprintf = require(`sprintf-js`).sprintf
    , Validator = require(`better-validator`)
    , ConfigParameter = require(`./parameter`)
    , ConfigProvider = require(`./provider`)
;

module.exports = class ConfigValidator {
    /**
     * Validates received config parameter name and value
     * @param {string} name  Name of config parameter.
     * @param {*}      value New value for config parameter.
     *
     * @return {Array} List of errors, empty if all fine.
     */
    static validate(name, value) {
        switch (name) {
            case ConfigParameter.WEIGHT:
                return ConfigValidator.validateWeight(value);
            case ConfigParameter.MIN_POST_AGE:
                return ConfigValidator.validateMinPostAge(value);
            case ConfigParameter.MAX_POST_AGE:
                return ConfigValidator.validateMaxPostAge(value);
            default:
                return [];
        }
    }

    /**
     * Validates "weight" config parameter
     * @param {*} value New value for config parameter.
     *
     * @return {Array} List of errors, empty if all fine.
     */
    static validateWeight(value) {
        const validator = new Validator();

        validator(value).isNumber().isInRange(0.01, 100);

        return validator.run();
    }

    /**
     * Validates "minPostAge" parameter for config parameter
     * @param {string} value New value for config parameter.
     *
     * @return {Array} List of errors, empty if all fine.
     */
    static validateMinPostAge(value) {
        let errors = ConfigValidator.validateTimeInterval(value);
        if (errors.length) {
            return errors;
        }

        const maxPostAge = ConfigProvider.get(ConfigParameter.MAX_POST_AGE);
        if (false === Boolean(maxPostAge)) {
            return [];
        }

        const parsedDate = chrono.parseDate(value)
            , maxPostAgeDate = chrono.parseDate(maxPostAge)
        ;

        if (parsedDate <= maxPostAgeDate) {
            return [sprintf(
                `Provided value cannot be greater or equal to "%s" parameter (it value "%s"). Change it before.`
                , ConfigParameter.MAX_POST_AGE
                , maxPostAge
            )];
        } else {
            return [];
        }
    }

    /**
     * Validates "maxPostAge" parameter for config parameter
     * @param {string} value New value for config parameter.
     *
     * @return {Array} List of errors, empty if all fine.
     */
    static validateMaxPostAge(value) {
        let errors = ConfigValidator.validateTimeInterval(value);
        if (errors.length) {
            return errors;
        }

        const minPostAge = ConfigProvider.get(ConfigParameter.MIN_POST_AGE);
        if (false === Boolean(minPostAge)) {
            return [];
        }

        const parsedDate = chrono.parseDate(value)
            , minPostAgeDate = chrono.parseDate(minPostAge)
        ;

        if (parsedDate >= minPostAgeDate) {
            return [sprintf(
                `Provided value cannot be less or equal to "%s" parameter (it value "%s"). Change it before.`
                , ConfigParameter.MIN_POST_AGE
                , minPostAge
            )];
        } else {
            return [];
        }
    }

    /**
     * Validates time interval for config parameter
     * @param {string} value New value for config parameter.
     *
     * @return {Array} List of errors, empty if all fine.
     */
    static validateTimeInterval(value) {
        const validator = new Validator()
            , parsedDate = chrono.parseDate(value)
        ;

        validator(parsedDate).required();

        if (validator.run().length || false === (parsedDate instanceof Date)) {
            return [`Cannot receive Date from provided config value, please use another one.`];
        } else {
            return [];
        }
    }
};
