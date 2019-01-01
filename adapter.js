let sprintf = require(`sprintf-js`).sprintf
    , instance = null
;

class Adapter {
    constructor() {
        this.name = `weku`;

        this.connection = require(`@steemit/steem-js`);
        this.reconnect();
    }

    static instance() {
        if (null === instance) {
            instance = new Adapter();
        }

        return instance;
    }

    reconnect() {
        this.connection.api.setOptions({ url: `wss://standby.weku.io:8190` });
        this.connection.config.set(`address_prefix`, `WKA`);
        this.connection.config.set(`chain_id`, `b24e09256ee14bab6d58bfa3a4e47b0474a73ef4d6c47eeea007848195fa085e`);
    }

    async processAccountInfo(username, callback) {
        this.reconnect();
        this.connection.api.getAccounts([username], function (err, result) {
            if (err) {
                console.error(sprintf(`Adapter: Failed to load account info: "%s"`, username));
                console.error(err);

                return;
            }
            if (result.length < 1) {
                console.error(sprintf(`Adapter: Account "%s" not found.`, username));

                return;
            }

            callback(result[0]);
        });
    }

    async processGetContent(author, permlink, successCallback, failCallback) {
        this.reconnect();
        this.connection.api.getContent(author, permlink, function (err, result) {
            if (err) {
                console.info(author, permlink);
                console.error(`Error during getContent appeared.`);
                console.error(err);

                if (failCallback) {
                    failCallback()
                }

                return;
            }
            if (result.id === 0) {
                console.info(author, permlink);
                console.error(`Post not found.`);

                if (failCallback) {
                    failCallback(result);
                }

                return;
            }
            successCallback(result);
        });
    }

    async processVote(wif, voter, author, permlink, weight, successCallback, failCallback) {
        this.reconnect();
        this.connection.broadcast.vote(wif, voter, author, permlink, weight, function(err, result) {
            if (err) {
                console.info(voter, author, permlink, weight);
                console.error(`Error during vote appeared.`);
                console.error(err);

                if (failCallback) {
                    failCallback(result);
                }

                return;
            }
            successCallback(result);
        });
    }
}

module.exports.Adapter = Adapter;
