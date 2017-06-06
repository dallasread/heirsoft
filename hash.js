var Generator = require('generate-js'),
    aes256 = require('aes256');

var Hash = Generator.generate(function Hash(options) {
    var _ = this;

    options = typeof options === 'object' ? options : {};

    _.defineProperties({
        writable: true
    }, {
        keys: options.keys || []
    });
});

Hash.definePrototype({
    encrypt: function encrypt(str) {
        var keys = this.keys,
            encrypted = str;

        for (var i = keys.length - 1; i >= 0; i--) {
            encrypted = aes256.encrypt(keys[i], encrypted);
        }

        return encrypted;
    },

    decrypt: function decrypt(str) {
        var keys = this.keys,
            decrypted = str;

        for (var i = 0; i < keys.length; i++) {
            decrypted = aes256.decrypt(keys[i], decrypted);
            if (!decrypted) return;
        }

        return decrypted;
    },

    setKeys: function setKeys(keys) {
        this.keys = keys;
    },
});

module.exports = Hash;
