function SORT_ALPHA2(a, b) {
    if (!b.path.length)  return -1;
    if (!a.path.length)  return 1;
    if (a.path < b.path) return -1;
    if (a.path > b.path) return 1;
    return 0;
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
};

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
    aes256 = require('aes256'),
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
                return arr.sort(SORT_ALPHA)
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
            selected: undefined
        }
    });

    var $el = _.$(_.element);

    $el.on('click', 'a', function() {
        _.set('selected', this.data('branch'));
        return false;
    });

    $el.on('click', '[data-unselect]', function() {
        _.unset('selected');
        return false;
    });

    $el.on('blur', '[data-branch-attr]', function() {
        var $this = _.$(this);
        $this.closest('p.branch')[0].data('branch')[$this.attr('data-branch-attr')] = this.value;
        _.update();
    });

    $el.on('submit', 'form[name="decrypt"]', function() {
        var $textarea = _.$(this).find('textarea'),
            splat = $textarea.val().trim().split(SEPARATOR),
            val = splat.length === 1 ? val : splat[1],
            dataString;

        try {
            dataString = root.decrypt( val );
            root.setData( JSON.parse(dataString) );
            $textarea.val('');
            _.update();
        } catch (e) {
            alert('Invalid data. Could not restore.');
        }

        return false;
    });

    $el.on('submit', 'form[name="encrypt"]', function() {
        var raw = JSON.stringify( root.toJSON() ),
            encrypted = root.encrypt(raw);

        encrypted = 'This file is encrypted...\n' + SEPARATOR + '\n' + encrypted;

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

    $el.on('click', '[data-delete-key]', function() {
        root.keys.splice(root.keys.indexOf(this.data('key')), 1);
        _.update();
    });

    $el.on('click', '[data-delete-branch]', function() {
        var branch = this.data('branch');
        branch.parent.removeChild(branch);
        _.update();
    });

    $el.on('click', '[data-add-key]', function() {
        root.keys.push({});
        _.update();
    });

    $el.on('blur', '[data-key-attr]', function() {
        var $this = _.$(this);
        $this.closest('li.key')[0].data('key')[$this.attr('data-key-attr')] = this.value;
        _.update();
    });

    $el.on('click', '[data-add-child]', function() {
        var data = {};

        if (_.$(this).attr('data-type') === 'folder') {
            data.children = [];
        } else {
            data.content = 'Sample file.';
        }

        _.set( 'selected', this.data('parent').addChild(data) );
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
