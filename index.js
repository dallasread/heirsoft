var CustomElement = require('generate-js-custom-element'),
    Branch = require('./branch'),
    LZString = require('lz-string'),
    gzip = require('gzip-js'),
    pako = require('pako'),
    aes256 = require('aes256'),
    CONFIG = {
        template: require('./app.html'),
        partials: {
            branch: require('./branch.html')
        },
        transforms: {
            fullPath: function fullPath(branch) {
                if (!branch) return '';

                return findAncestors(branch).map(function(a) { return a.get('path'); }).join('');
            },
        }
    };

function byteCount(str) {
    return encodeURI(str).split(/%..|./).length - 1;
}

var Tree = CustomElement.createElement(CONFIG, function Tree(options) {
    options               = typeof options               === 'object' ? options               : {};
    options.data          = typeof options.data          === 'object' ? options.data          : {};

    if (typeof options.data.path === 'undefined') throw new Error('`path` not supplied.');
    if (typeof options.data.key  === 'undefined') throw new Error('`key` not supplied.');

    var _ = this,   
        root = new Branch({ data: options.data });

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

    $el.on('blur', 'textarea.file-content', function() {
        _.set('selected.data.content', this.value);
        return false;
    });

    $el.on('submit', 'form[name="restore"]', function() {
        var $textarea = _.$(this).find('textarea'),
            val = $textarea.val().trim(),
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

        _.set('encrypted', 'This file is encrypted...\n===\n' + encrypted);

        // console.log('---');
        // console.log('Raw          ~>', byteCount(raw) / 1000 + ' kb');
        // console.log('Uncompressed ~>', byteCount(encrypted) / 1000 + ' kb');
        // console.log('Compressed   ~>', byteCount(pako.deflate(encrypted)) / 1000 + ' kb');

        return false;
    });

    $el.on('click', '[data-delete-key]', function() {
        root.data.keys.splice(root.data.keys.indexOf(this.data('key')), 1);
        _.update();
    });

    $el.on('click', '[data-add-key]', function() {
        root.data.keys.push({});
        _.update();
    });

    $el.on('blur', '[data-key-attr]', function() {
        var $this = _.$(this);
        $this.closest('li.key')[0].data('key')[$this.attr('data-key-attr')] = this.value;
        _.update();
    });
});

Tree.definePrototype({
    appendTo: function appendTo(el) {
        var _ = this;

        el.append(_.element);
    }
});

if (typeof window !== 'undefined') {
    window.Tree = Tree;
}

module.exports = Tree;
