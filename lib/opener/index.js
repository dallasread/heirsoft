var CustomElement = require('generate-js-custom-element'),
    Branch = require('../branch'),
    SEPARATOR = '====================',
    CONFIG = {
        template: require('./opener.html'),
        partials: {
            'opener-matrix': require('./opener-matrix.html')
        }
    };

var Opener = CustomElement.createElement(CONFIG, function Opener(options) {
    options = typeof options === 'object' ? options : {};

    var _ = this,
        tree = new Branch({});

    _.defineProperties({
        writable: true
    }, {
        $: options.$,
        tree: tree,
        content: undefined
    });

    CustomElement.call(_, {
        data: {
            step: 1,
            tree: tree,
            publicKeys: [''],
            privateKeys: [''],
            contents: undefined
        }
    });

    var $el = _.$(_.element);

    $el.on('submit', '[name="start"]', function() {
        _.set('step', 2);
        return false;
    });

    $el.on('submit', '[name="opener-content"]', function() {
        var contents = _.$(this).find('[name="contents"]').val(),
            splat = contents.trim().split(SEPARATOR);

        contents = splat.length === 1 ? splat[0] : splat[1];

        _.set('contents', contents);
        _.set('step', 3);
        return false;
    });

    $el.on('submit', '[name="opener-public-keys"]', function() {
        _.set('step', 4);
        return false;
    });

    $el.on('submit', '[name="opener-private-keys"]', function() {
        var data = tree.decrypt(
            _.get('publicKeys'),
            _.get('privateKeys'),
            _.get('contents')
        );

        if (!data) {
            alert('We could not decrypt this vault using the keys supplied.');
            _.set('step', 2)
            return false;
        }

        _.emit('data', data);

        return false;
    });

    $el.on('blur', '.matrix input', function() {
        var $this = _.$(this),
            arr = $this.closest('.matrix')[0].data('keys'),
            index = $this.closest('.key')[0].data('index');

        arr[index] = $this.val();
        _.update();
        return false;
    });

    $el.on('click', '[data-add-key]', function() {
        var arr = _.$(this).closest('.matrix')[0].data('keys');
        arr.push('');
        _.update();
        return false;
    });

    $el.on('click', '[data-remove-key]', function() {
        var $this = _.$(this),
            arr = $this.closest('.matrix')[0].data('keys'),
            index = $this.closest('.key')[0].data('index');

        delete arr[index];
        _.update();
        return false;
    });
});

Opener.definePrototype({
});

if (typeof window !== 'undefined') {
    window.Opener = Opener;
}

module.exports = Opener;
