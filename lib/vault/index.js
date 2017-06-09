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

function byteCount(str) {
    return encodeURI(str).split(/%..|./).length - 1;
}

var CustomElement = require('generate-js-custom-element'),
    Branch = require('../branch'),
    FileSaver = require('file-saver'),
    CONFIG = {
        template: require('./vault.html'),
        partials: {
            branch: require('./branch.html'),
            editor: require('./editor.html'),
            'tree-editor': require('./tree-editor.html'),
            'tree-matrix': require('./tree-matrix.html')
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
            }
        }
    };

var Vault = CustomElement.createElement(CONFIG, function Vault(options) {
    options = typeof options === 'object' ? options : {};

    var _ = this,
        tree = new Branch(options.data);

    _.defineProperties({
        writable: true
    }, {
        $: options.$,
        tree: tree
    });

    CustomElement.call(_, {
        data: {
            tree: tree,
            selected: tree
        }
    });

    var $el = _.$(_.element);

    $el.on('click', 'sidebar a, sidebar button', function() {
        if (_.$(window).width() > 640) return;

        var $sidebar = $el.find('sidebar');

        if (parseInt($sidebar.css('left'))) {
            $sidebar.animate({ left: 0 }, 150);
        } else {
            $sidebar.animate({ left: '-100%' }, 150);
        }
    });

    $el.on('click', '[data-go-branch]', function() {
        if (this.data('branch')) {
            _.set('selected', this.data('branch'));
        }

        return false;
    });

    $el.on('blur', '[data-branch-attr]', function() {
        var $this = _.$(this);
        $this.closest('.branch')[0].data('branch')[$this.attr('data-branch-attr')] = this.value;
        _.update();
    });

    $el.on('submit', 'form[name="encrypt"]', function() {
        var encrypted = _.get('tree').encrypt();

        console.log(encrypted);

        encrypted = 'Decrypt this file using each of the public keys sorted alphabetically using AES-256. After parsing the returned JSON array, use all of your private keys (probably only one) alphabetically using AES-256 to decrypt each of the returned chunks. Only one chunk will successfully decrypt.\n' + SEPARATOR + '\n' + encrypted;

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

    $el.on('click', '[data-remove-branch]', function() {
        if (confirm('Are you sure you want to delete this item?')) {
            var branch = this.data('branch');
            branch.parent.removeChild(branch);
            _.update();
        }

        return false;
    });

    $el.on('click', '[data-remove-key]', function() {
        if (confirm('Are you sure you want to delete this key?')) {
            var branch = _.$(this).closest('.branch')[0].data('branch'),
                key = _.$(this).closest('.key')[0].data('key');

            removeFromArray(branch.keys, key);
            _.update();
        }

        return false;
    });

    $el.on('click', '[data-add-key]', function() {
        _.$(this).closest('.branch')[0].data('branch').keys.push({
            name: _.get('tree').generateKey(10),
            public: _.get('tree').generateKey(10),
            private: _.get('tree').generateKey(10),
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

Vault.definePrototype({
});

if (typeof window !== 'undefined') {
    window.Vault = Vault;
}

module.exports = Vault;
