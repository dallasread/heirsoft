function removeFromArray(arr, item) {
    arr.splice(arr.indexOf(item), 1);
}

var NUMBER_GROUPS = /(-?\d*\.?\d+)/g,
    SEPARATOR = '====================';

function SORT_ALPHA(a, b) {
    if (!b.path.length)  return -1;
    if (!a.path.length)  return 1;

    var aa = String(a.path).split(NUMBER_GROUPS),
        bb = String(b.path).split(NUMBER_GROUPS),
        min = Math.min(aa.length, bb.length),
        x, y;

    for (var i = 0; i < min; i++) {
        x = parseFloat(aa[i]) || aa[i].toLowerCase();
        y = parseFloat(bb[i]) || bb[i].toLowerCase();

        if (x < y) {
            return -1;
        } else if (x > y) {
            return 1;
        }
    }

    return 0;
}

function findAncestors(branch) {
    var ancestors = [branch];

    while (branch.parent) {
        ancestors.unshift(branch.parent);
        branch = branch.parent;
    }

    return ancestors;
}

var CustomElement = require('generate-js-custom-element'),
    Branch = require('./branch'),
    FileSaver = require('file-saver'),
    CONFIG = {
        template: require('./app.html'),
        partials: {
            branch: require('./branch.html')
        },
        transforms: {
            fullPath: function fullPath(branch) {
                if (!branch) return '';
                return ('/ ' + findAncestors(branch).map(function(a) { return a.path || 'Untitled'; }).join(' / ')).replace(/^\/\//, '/');
            },

            alpha: function alpha(arr) {
                return arr.sort(SORT_ALPHA);
            },

            adam: function adam(branch) {
                return findAncestors(branch)[0];
            },

            includes: function includes(permissions, key) {
                return permissions.indexOf(key) !== -1;
            },
        }
    };

function byteCount(str) {
    return encodeURI(str).split(/%..|./).length - 1;
}

var Tree = CustomElement.createElement(CONFIG, function Tree(options) {
    options = typeof options === 'object' ? options : {};

    var _ = this,
        root = new Branch(options.data);

    _.defineProperties({
        writable: true
    }, {
        $: options.$
    });

    CustomElement.call(_, {
        data: {
            root: root,
            selected: root
        }
    });

    var $el = _.$(_.element);

    $el.on('click', 'sidebar a', function() {
        if (this.data('branch')) {
            _.set('selected', this.data('branch'));
            return false;
        }
    });

    $el.on('blur', '[data-branch-attr]', function() {
        var $this = _.$(this);
        $this.closest('.branch')[0].data('branch')[$this.attr('data-branch-attr')] = this.value;
        _.update();
    });

    $el.on('submit', 'form[name="decrypt"]', function() {
        var $input = _.$(this).find('input'),
            $textarea = _.$(this).find('textarea'),
            privateKey = $input.val(),
            publicKeys = _.get('root.keys').map(function(k) { return k.public; }),
            splat = $textarea.val().trim().split(SEPARATOR),
            str = splat.length === 1 ? splat[0] : splat[1],
            data = _.get('root').decrypt(publicKeys, [privateKey], str);

        if (data) {
            var branch = new Branch(data);
            _.set('root', branch);
            _.set('selected', branch);
            $textarea.val('');
            $input.val('');
            _.update();
        } else {
            alert('Invalid data. Could not restore.');
        }

        return false;
    });

    $el.on('submit', 'form[name="encrypt"]', function() {
        var encrypted = _.get('root').encrypt();

        console.log(encrypted);

        encrypted = 'This file is encrypted... Decrypt it with each public key sorted alphabetically using AES-256. After parsing the returned JSON array, use all of your private keys (probably only one) to decrypt each of the returned chunks. Only one chunk will successfully decrypt.\n' + SEPARATOR + '\n' + encrypted;

        FileSaver.saveAs(
            new Blob(
                [encrypted],
                {
                    type: 'text/plain; charset=utf-8'
                }
            ),
            'heirsoft.txt'
        );

        return false;
    });

    $el.on('click', '[data-delete-branch]', function() {
        var branch = this.data('branch');
        branch.parent.removeChild(branch);
        _.update();
        return false;
    });

    $el.on('click', '[data-delete-key]', function() {
        var branch = _.$(this).closest('.branch')[0].data('branch'),
            key = _.$(this).closest('.key')[0].data('key');

        removeFromArray(branch.keys, key);
        _.update();
        return false;
    });

    $el.on('click', '[data-add-key]', function() {
        _.$(this).closest('.branch')[0].data('branch').keys.push({
            name: _.get('root').generateKey(10),
            public: _.get('root').generateKey(10),
            private: _.get('root').generateKey(10),
        });
        _.update();
        return false;
    });

    $el.on('blur', '[data-key-attr]', function() {
        var $this = _.$(this);
        $this.closest('.key')[0].data('key')[$this.attr('data-key-attr')] = this.value;
        _.update();
    });

    $el.on('click', '[data-add-child]', function() {
        var data = {};

        if (_.$(this).attr('data-type') === 'folder') {
            data.children = [];
        }

        _.set( 'selected', this.data('parent').addChild(data) );
        return false;
    });

    $el.on('click', '.branch-keys input[type="checkbox"]', function() {
        var branch = _.$(this).closest('.branch')[0].data('branch'),
            key = _.$(this).closest('.key')[0].data('key');

        if (this.checked) {
            branch.permissions.push(key);
        } else {
            removeFromArray(branch.permissions, key);
        }

        _.update();
    });
});

Tree.definePrototype({
    appendTo: function appendTo(el) {
        var _ = this;
        el.append(_.element);
        return _;
    }
});

if (typeof window !== 'undefined') {
    window.Tree = Tree;
}

module.exports = Tree;
