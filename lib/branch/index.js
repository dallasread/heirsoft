var Generator = require('generate-js'),
    aes256 = require('aes256'),
    crypto = require('crypto');

function _encrypt(keys, json) {
    var encrypted = typeof json === 'string' ? json : JSON.stringify(json);

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

function findAllByAttr(items, ids, attr) {
    var result = [];

    for (var i = items.length - 1; i >= 0; i--) {
        if (ids.indexOf(items[i][attr]) !== -1) {
            result.push(items[i]);
        }
    }

    return result;
}

function applyPermissionKeys(keys, children) {
    var child, i;
    for (i = children.length - 1; i >= 0; i--) {
        child = children[i];

        child.permissions = findAllByAttr(keys, child.permissions, 'private');

        if (child.children instanceof Array) {
            applyPermissionKeys(keys, child.children);
        }
    }
}

var Branch = Generator.generate(function Branch(options) {
    var _ = this;

    options = typeof options === 'object' ? options : {};

    _.setData(options);

    _.defineProperties({
        key: options.key || _.generateKey()
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
            _.addChild( children[i] );
        }
    },

    setData: function setData(data) {
        var _ = this;

        data = typeof data === 'object' ? data : {};

        _.defineProperties({
            writable: true
        }, {
            path: data.path || '',
            content: data.content || '',
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

        _.defineProperties({
            isWritable: data.keys instanceof Array
        });

        if (data.children instanceof Array) {
            _.defineProperties({
                children: []
            });

            _.mount(data.children);
        }
    },

    encrypt: function encrypt() {
        var _ = this,
            privateKeys = _.keys.filter(function(k) {
                return k.private && k.private.length;
            }).map(function(k) {
                return k.private;
            }),
            results = [],
            key;

        if (_.keys.length > 1) {
            for (var i = _.keys.length - 1; i >= 0; i--) {
                key = _.keys[i];

                results.push(
                    _encrypt(
                        [key.private],
                        _.toJSON(key)
                    )
                );
            }
        }

        if (_.isWritable) {
            results.push(
                _encrypt(
                    privateKeys,
                    _.toJSON(key, true)
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

    decrypt: function decrypt(publicKeys, privateKeys, str) {
        var data, chunks, chunk;

        try {
            str = _decrypt( publicKeys, str );
            chunks = JSON.parse(str).data;

            for (var i = chunks.length - 1; i >= 0; i--) {
                try {
                    chunk = _decrypt( privateKeys, chunks[i] );
                    data = JSON.parse(chunk);

                    if (data.keys instanceof Array) {
                        applyPermissionKeys(data.keys, data.children);
                    }

                    return data;
                } catch (e) { }
            }
        } catch (e) { }

        return data;
    },

    toJSON: function toJSON(key, isWritable) {
        var _ = this,
            result = {
                key: _.key,
                path: _.path
            };

        if (typeof _.content !== 'undefined') {
            result.content = _.content;
        }

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
                    result.children.push( _.children[i].toJSON(key, isWritable) );
                }
            }
        }

        return result;
    },

    generateKey: function generateKey(length) {
        return crypto.randomBytes(length || 24).toString('base64').replace(/[^0-9a-zA-Z]/g, '');
    }
});

if (typeof window !== 'undefined') {
    window.Branch = Branch;
}

module.exports = Branch;
