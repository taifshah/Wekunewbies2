'use strict';

const chrono = require(`chrono-node`)
    , sprintf = require(`sprintf-js`).sprintf
    , Message = require(`discord.js`).Message
    , messages = require(`./messages`)
    , ConfigParameter = require(`./config/parameter`)
    , ConfigProvider = require(`./config/provider`)
    , ConfigValidator = require(`./config/validator`)
    , ConfigValuePreFormatter = require(`./config/value-pre-formatter`)
    , ConfigValuePostFormatter = require(`./config/value-post-formatter`)
    , Adapter = require(`./adapter`).Adapter
    , tool = require(`./tool`)
;

module.exports = class BotHelper {

    static updateVotingPowerStatus(bot, username) {
        Adapter.instance().processAccountInfo(username, function (account) {
            bot.user.setActivity(sprintf(`VP - %s%%.`, tool.calculateVotingPower(account)), { type: `WATCHING` });
        });
    }

    static handleBotCommand(command, params, message) {
        switch (command) {
            case `help`:
            case `info`:
                BotHelper.handleHelpCommand(message);
                break;
            case `config`:
                if (false === BotHelper.checkUserPermission(command, message)) {
                    message.channel.send(sprintf(
                        messages.permissionDenied,
                        message.author.id,
                        ConfigProvider.get(ConfigParameter.COMMAND_PREFIX),
                        command
                    ));

                    return false;
                }
                BotHelper.handleConfigCommand(params, message);
                break;
            case `upvote`:
                BotHelper.handleUpvoteCommand(message, params);
                break;
            default:
                message.channel.send(sprintf(
                    messages.unsupportedCommand,
                    message.author.id,
                    ConfigProvider.get(ConfigParameter.COMMAND_PREFIX),
                    command
                ));
        }
    }

    static handleHelpCommand(message) {
        message.channel.send(sprintf(
            messages.info,
            message.author.id,
            ConfigProvider.get(ConfigParameter.USERNAME),
            ConfigProvider.get(ConfigParameter.COMMAND_PREFIX)
        ))
    }

    static handleConfigCommand(params, message) {
        if (params.length === 0) {
            message.channel.send(sprintf(
                messages.configInfo,
                message.author.id,
                ConfigProvider.get(ConfigParameter.COMMAND_PREFIX)
            ));

            return;
        }
        if (params.length === 1) {
            message.channel.send(sprintf(
                messages.configParameterValue,
                message.author.id,
                params[0],
                JSON.stringify(ConfigProvider.get(params[0]))
            ));

            return;
        }

        const parameterName = params[0]
            , parameterValue = ConfigValuePreFormatter.run(parameterName, params.splice(1))
        ;

        let errors = [];
        if (undefined === parameterValue) {
            errors = [sprintf(`Config parameter "%s" cannot be changed.`, parameterName)];
        } else {
            errors = ConfigValidator.validate(parameterName, parameterValue);
        }

        if (errors.length) {
            message.channel.send(sprintf(
                messages.configParameterValueError,
                message.author.id,
                parameterName,
                JSON.stringify(errors)
            ));

            return;
        }

        ConfigProvider.set(parameterName, ConfigValuePostFormatter.run(parameterName, parameterValue));
        message.channel.send(sprintf(
            messages.configParameterValueChanged,
            message.author.id,
            parameterName,
            JSON.stringify(ConfigProvider.get(parameterName))
        ));
    }

    static handleUpvoteCommand(message, params) {
        if (params.length < 1 || !params[0]) {
            console.error(`Failed to receive post URL.`, params);
            message.channel.send(sprintf(
                messages.upvotePostUrlError,
                message.author.id,
                ConfigProvider.get(ConfigParameter.COMMAND_PREFIX)
            ));

            return
        }
        let postParams = tool.parsePostUrl(params[0]);
        if (postParams.length < 2 || !postParams.author || !postParams.permlink) {
            console.error(`Failed to parse post URL`, postParams);
            message.channel.send(sprintf(
                messages.upvotePostNotFound,
                message.author.id,
                ConfigProvider.get(ConfigParameter.COMMAND_PREFIX)
            ));

            return
        }

        Adapter.instance().processGetContent(
            postParams.author,
            postParams.permlink,
            function (result) {
                const voterUsername = ConfigProvider.get(ConfigParameter.USERNAME)
                    , minPostAge = ConfigProvider.get(ConfigParameter.MIN_POST_AGE)
                    , maxPostAge = ConfigProvider.get(ConfigParameter.MAX_POST_AGE)
                ;

                if (
                    `active_votes` in result
                    && result.active_votes.length > 0
                    && tool.isArrayContainsProperty(result.active_votes, `voter`, voterUsername)
                ) {
                    message.channel.send(sprintf(
                        messages.upvotePostVotedAlready,
                        message.author.id,
                        voterUsername
                    ));

                    return;
                }

                if (`created` in result && (minPostAge || maxPostAge)) {
                    const postCreatedDate = chrono.parseDate(result.created);
                    if (minPostAge) {
                        const minPostDate = chrono.parseDate(minPostAge);
                        if (postCreatedDate > minPostDate) {
                            message.channel.send(sprintf(
                                messages.upvotePostTooEarly,
                                message.author.id,
                                minPostAge,
                                maxPostAge
                            ));

                            return;
                        }
                    }
                    if (maxPostAge) {
                        const maxPostDate = chrono.parseDate(maxPostAge);
                        if (postCreatedDate < maxPostDate) {
                            message.channel.send(sprintf(
                                messages.upvotePostTooLate,
                                message.author.id,
                                minPostAge,
                                maxPostAge
                            ));

                            return;
                        }
                    }
                }

                Adapter.instance().processVote(
                    ConfigProvider.get(ConfigParameter.POSTING_KEY),
                    voterUsername,
                    postParams.author,
                    postParams.permlink,
                    ConfigProvider.get(ConfigParameter.WEIGHT) * 100,
                    function () {
                        message.channel.send(sprintf(messages.upvoteSuccess, message.author.id, voterUsername));
                    },
                    function () {
                        message.channel.send(sprintf(messages.systemError, message.author.id));
                    }
                );
            },
            function (result) {
                if (result && result.id === 0) {
                    message.channel.send(sprintf(messages.upvotePostNotFound, message.author.id));
                } else {
                    message.channel.send(sprintf(messages.systemError, message.author.id));
                }
            }
        );
    }

    /**
     * Checks user permission to perform command.
     * @param {string} command Name of command to check.
     * @param {Message} message Message object in which command was received.
     *
     * @return {boolean} Whether user has permission to perform command or not.
     */
    static checkUserPermission(command, message) {
        let admins = ConfigProvider.get(ConfigParameter.ADMIN_LIST);
        if (undefined === admins) {
            return true;
        } else {
            return admins.includes(message.author.id);
        }
    }

};
