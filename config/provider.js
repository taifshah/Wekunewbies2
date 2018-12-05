'use strict';

const sprintf = require(`sprintf-js`).sprintf
    , fs = require(`fs`)
    , ConfigParameter = require(`./parameter`)
;

let runtimeConfig = {}
    , configLoaded = false
;

module.exports = class ConfigProvider {
    /**
     * Returns current value of config parameter
     * @param {string} name Name of config parameter.
     * @return {*|undefined} Value of config parameter or undefined if parameter doesn't exists.
     */
    static get(name) {
        ConfigProvider.load();

        if (name in runtimeConfig) {
            return runtimeConfig[name];
        } else {
            return undefined;
        }
    }

    /**
     * Changes value of config parameter
     * @param {string} name  Name of config parameter.
     * @param {*}      value New value for config parameter.
     */
    static set(name, value) {
        if (false === (name in runtimeConfig)) {
            return;
        }
        if (undefined === value) {
            delete runtimeConfig[name];
        } else {
            switch (name) {
                case ConfigParameter.WEIGHT:
                case ConfigParameter.MIN_POST_AGE:
                case ConfigParameter.MAX_POST_AGE:
                    runtimeConfig[name] = value;
                    break;
            }
        }
        ConfigProvider.dump();
    }

    /**
     * Loads actual configs from default file and runtime one
     */
    static load() {
        if (configLoaded) {
            return;
        }
        const config = require(ConfigProvider.getConfigPath(false))
            , runtimeConfigPath = ConfigProvider.getConfigPath()
        ;

        if (fs.existsSync(runtimeConfigPath)) {
            runtimeConfig = require(runtimeConfigPath);
        }

        runtimeConfig = {...config, ...runtimeConfig};

        configLoaded = true;
    }

    /**
     * Stores current config parameters to file
     */
    static dump() {
        fs.writeFile(
            ConfigProvider.getConfigPath(),
            JSON.stringify(runtimeConfig),
            `utf8`,
            function (err) {
                if (err) {
                    console.error(err);
                }
            }
        );
    }

    /**
     * Provides path to config file
     * @param {boolean} runtime Specifies which config file path returns, runtime or not.
     * @return {string} Path to config file.
     */
    static getConfigPath(runtime = true) {
        let configPath = __dirname + `/../config.json`;
        if (runtime) {
            const config = require(configPath);

            return sprintf(__dirname + `/../%s`, config.runtimeConfigFile);
        } else {
            return configPath;
        }
    }
};
