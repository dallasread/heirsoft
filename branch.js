var Generator = require('generate-js'),
    aes256 = require('aes256');

function _encrypt(keys, json) {
    var encrypted = JSON.stringify(json);

    keys = keys.sort();

    for (var i = keys.length - 1; i >= 0; i--) {
        if (!keys[i].length) continue;
        encrypted = aes256.encrypt(keys[i], encrypted);
    }

    return encrypted;
}

function _decrypt(keys, str) {
    var decrypted = str;

    keys = keys.sort();

    for (var i = 0; i < keys.length; i++) {
        if (!keys[i].length) continue;
        decrypted = aes256.decrypt(keys[i], decrypted);
        if (!decrypted) return;
    }

    return decrypted;
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
                children: data.children,
                permissions: data.permissions
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

        if (typeof _.permissions === 'undefined') {
            _.defineProperties({
                permissions: (
                    data.keys ? data.keys : (
                        (
                            data.permissions || (
                                data.parent ? data.parent.permissions: []
                            )
                        ).slice()
                    )
                )
            });
        }

        if (data.keys instanceof Array) {
            _.defineProperties({
                writable: true
            }, {
                keys: data.keys
            });
        }

        if (data.children instanceof Array) {
            _.defineProperties({
                children: []
            });

            _.mount(data.children);
        }
    },

    encrypt: function encrypt() {
        var _ = this,
            results = [],
            key;

        for (var i = _.keys.length - 1; i >= 0; i--) {
            key = _.keys[i];

            results.push(
                _encrypt(
                    [key.private],
                    _.toJSON(key)
                )
            );
        }

        return _encrypt(
            _.keys.map(function(k) {
                return k.public;
            }),
            { data: results }
        );
    },

    decrypt: function decrypt(keys, str) {
        var _ = this;

        return _decrypt(keys, str);
    },

    toJSON: function toJSON(key) {
        var _ = this,
            isWritable = key === _.key,
            result = {
                key: _.key,
                path: _.path,
                content: _.content
            };

        // TODO: isWritable & detecting a master key (eg. has all keys)
        console.log(result)


        if (isWritable) {
            if (_.keys instanceof Array) {
                result.keys = _.keys;
            }

            result.permissions = _.permissions.map(function(k) {
                return k.private;
            });
        }

        if (_.children instanceof Array) {
            result.children = [];

            for (var i = _.children.length - 1; i >= 0; i--) {
                if (isWritable || _.children[i].permissions.indexOf(key) !== -1) {
                    result.children.push( _.children[i].toJSON(key) );
                }
            }
        }

        return result;
    }
});

if (typeof window !== 'undefined') {
    window.Branch = Branch;
}

module.exports = Branch;
