var Generator = require('generate-js'),
    aes256 = require('aes256');

function findAncestors(branch) {
    var ancestors = [branch];

    while (branch.parent) {
        ancestors.unshift(branch.parent);
        branch = branch.parent;
    }

    return ancestors;
}

function prepKeys(keys) {
    return keys
        .filter(function(k) { 
            return k.value && k.value.length; 
        }).map(function(k) { 
            return k.value; 
        }).sort();
}

var Branch = Generator.generate(function Branch(options) {
    options      = typeof options               === 'object' ? options               : {};
    options.data = typeof options.data          === 'object' ? options.data          : {};

    if (typeof options.data.path === 'undefined') throw new Error('`path` not supplied.');
    if (typeof options.data.key  === 'undefined') throw new Error('`key` not supplied.');

    var _ = this,
        key, child;

    _.defineProperties({
        data: {}
    });

    _.setData(options.data);
});

Branch.definePrototype({
    addChild: function addChild(key, data) {
        var _ = this;

        _.data.children[key] = new Branch({
            $: _.$,
            parent: _,
            hash: _.hash,
            data: data
        });
    },

    mount: function mount(children) {
        var _ = this;

        for (key in children) {
            child = children[key];
            if (child.constructor && child.constructor.name === 'Branch') continue;
            _.addChild( key, child );
        }
    },

    setData: function setData(data) {
        var _ = this;

        data.children = typeof data.children === 'object' ? data.children : {};
        data.keys     = typeof data.keys     === 'object' ? data.keys     : [];

        for (var key in _.data) {
            delete _.data[key];
        }

        for (var key in data) {
            _.data[key] = data[key];
        }

        _.mount(data.children);
    },

    encrypt: function encrypt(str) {
        var _ = this,
            keys = prepKeys(_.data.keys),
            encrypted = str;

        for (var i = keys.length - 1; i >= 0; i--) {
            if (!keys[i].length) continue;
            encrypted = aes256.encrypt(keys[i], encrypted);
        }

        return encrypted;
    },

    decrypt: function decrypt(str) {
        var _ = this,
            keys = prepKeys(_.data.keys),
            decrypted = str;

        for (var i = 0; i < keys.length; i++) {
            if (!keys[i].length) continue;
            decrypted = aes256.decrypt(keys[i], decrypted);
            if (!decrypted) return;
        }

        return decrypted;
    },

    toJSON: function toJSON() {
        var _ = this,
            result = {
                name: _.data.name,
                key: _.data.key,
                path: _.data.path,
                content: _.data.content
            };

        if (typeof _.data.keys !== 'undefined') {
            result.keys = _.data.keys;
        }

        if (typeof _.data.children === 'object') {
            result.children = {};

            for (var key in _.data.children) {
                result.children[key] = _.data.children[key].toJSON();
            }
        }

        return result;
    },
});

if (typeof window !== 'undefined') {
    window.Branch = Branch;
}

module.exports = Branch;
