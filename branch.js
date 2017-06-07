var Generator = require('generate-js'),
    aes256 = require('aes256');

function prepKeys(keys, attr) {
    return keys
        .filter(function(k) {
            return k[attr] && k[attr].length;
        }).map(function(k) {
            return k[attr];
        }).sort();
}

var Branch = Generator.generate(function Branch(options) {
    var _ = this;

    options = typeof options === 'object' ? options : {};

    _.setData(options);

    _.defineProperties({
        key: options.key || Math.random()
    });
});

Branch.definePrototype({
    addChild: function addChild(data) {
        var _ = this,
            branch = new Branch({
                parent: _,
                path: data.path,
                key: data.key,
                content: data.content,
                children: data.children
            });

        _.children.push(branch);

        return branch;
    },

    removeChild: function removeChild(child) {
        var _ = this,
            index = _.children.indexOf(child);

        _.children.splice(index, 1);
    },

    mount: function mount(children) {
        var _ = this;

        for (var i = children.length - 1; i >= 0; i--) {
            child = children[i];
            _.addChild( child );
        }
    },

    setData: function setData(data) {
        var _ = this;

        data = typeof data === 'object' ? data : {};

        _.defineProperties({
            writable: true
        }, {
            path: data.path || '',
            content: data.content,
            parent: data.parent
        });

        if (data.keys instanceof Array) {
            _.defineProperties({
                writable: true
            }, {
                keys: data.keys
            });
        }

        if (data.children instanceof Array) {
            _.defineProperties({
                writable: true
            }, {
                children: []
            });

            _.mount(data.children);
        }
    },

    encrypt: function encrypt(str) {
        var _ = this,
            keys = prepKeys(_.keys, 'public'),
            encrypted = str;

        for (var i = keys.length - 1; i >= 0; i--) {
            if (!keys[i].length) continue;
            encrypted = aes256.encrypt(keys[i], encrypted);
        }

        return encrypted;
    },

    decrypt: function decrypt(str) {
        var _ = this,
            keys = prepKeys(_.keys),
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
                key: _.key,
                path: _.path,
                content: _.content
            };

        if (typeof _.credentials !== 'undefined') {
            result.credentials = _.credentials;
        }

        if (_.children instanceof Array) {
            result.children = [];

            for (var i = _.children.length - 1; i >= 0; i--) {
                result.children.push(_.children[i].toJSON());
            }
        }

        return result;
    },
});

if (typeof window !== 'undefined') {
    window.Branch = Branch;
}

module.exports = Branch;
