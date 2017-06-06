var CustomElement = require('generate-js-custom-element'),
    LZString = require('lz-string'),
    gzip = require('gzip-js'),
    pako = require('pako'),
    aes256 = require('aes256'),
    CONFIG = {
        template: require('./app.html'),
        partials: {
            item: require('./item.html')
        },
        transforms: {
            fullPath: function fullPath(item) {
                if (!item) return '';

                return findAncestors(item).map(function(a) { return a.get('path'); }).join('');
            },

            // encrypt: function encrypt(item) {
            //     if (!item.data.keys) return;
            //     // return JSON.stringify(item.toJSON());
            //     return item.encrypt( JSON.stringify(item.toJSON()) );
            // },

            // decrypt: function decrypt(str) {
            //     if (!item.data.keys) return;
            //     return item.decrypt(str);
            // },

            sort: function sort(arr) {
                return (arr || []).sort();
            },

            byteCount: function byteCount(str) {
                return encodeURI(str).split(/%..|./).length - 1;
            },

            jsonStringify: function jsonStringify(item) {
                return JSON.stringify(item.toJSON());
            },

            compressed: function compressed(str) {
                return pako.deflate(str);
                // return gzip.zip(str);
                // return LZString.compress(str);
            },
        }
    };

function findAncestors(item) {
    var ancestors = [item];

    while (item.parent) {
        ancestors.unshift(item.parent);
        item = item.parent;
    }

    return ancestors;
}

var Tree = CustomElement.createElement(CONFIG, function Tree(options) {
    options               = typeof options               === 'object' ? options               : {};
    options.data          = typeof options.data          === 'object' ? options.data          : {};

    if (typeof options.data.name === 'undefined') throw new Error('`name` not supplied.');
    if (typeof options.data.path === 'undefined') throw new Error('`path` not supplied.');
    if (typeof options.data.key  === 'undefined') throw new Error('`key` not supplied.');

    var _ = this,
        key, child;

    _.defineProperties({
        writable: true
    }, {
        $: options.$,
        data: {},
    });

    CustomElement.call(_, { data: _.data });

    _.setData(options.data)

    if (_.get('parent')) return;

    var $el = _.$(_.element);

    $el.on('click', 'a', function() {
        _.set('selected', this.data('item'));
        return false;
    });

    $el.on('click', '[data-unselect]', function() {
        _.unset('selected');
        return false;
    });

    $el.on('blur', 'textarea.file-content', function() {
        _.set('selected.data.content', this.value);
        return false;
    });

    $el.on('submit', 'form[name="restore"]', function() {
        var $textarea = _.$(this).find('textarea'),
            val = $textarea.val().trim(),
            dataString;

        try {
            dataString = _.decrypt( val );
            _.setData( JSON.parse(dataString) );
            $textarea.val('');
        } catch (e) {
            alert('Invalid data. Could not restore.');
        }

        return false;
    });

    $el.on('submit', 'form[name="encrypt"]', function() {
        _.set(
            'encrypted',
            _.encrypt(
                JSON.stringify( _.toJSON() )
            )
        );

        return false;
    });
});

Tree.definePrototype({
    appendTo: function appendTo(el) {
        var _ = this;

        el.append(_.element);
    },

    addChild: function addChild(key, data) {
        var _ = this;

        _.data.children[key] = new Tree({
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
            if (child.constructor && child.constructor.name === 'Tree') continue;
            _.addChild( key, child );
        }
    },

    setData: function setData(data) {
        var _ = this;

        data.children = typeof data.children === 'object' ? data.children : {};
        data.keys     = typeof data.keys     === 'object' ? data.keys     : [];
        data.root = _;

        for (var key in _.data) {
            delete _.data[key];
        }

        for (var key in data) {
            _.data[key] = data[key];
        }

        _.mount(data.children);

        _.update();
    },

    encrypt: function encrypt(str) {
        var _ = this,
            keys = _.data.keys.sort(),
            encrypted = str;

        for (var i = keys.length - 1; i >= 0; i--) {
            encrypted = aes256.encrypt(keys[i], encrypted);
        }

        return encrypted;
    },

    decrypt: function decrypt(str) {
        var _ = this,
            keys = _.data.keys.sort(),
            decrypted = str;

        for (var i = 0; i < keys.length; i++) {
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

window.Tree = Tree;

module.exports = Tree;
