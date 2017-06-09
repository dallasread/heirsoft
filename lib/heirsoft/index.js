var CustomElement = require('generate-js-custom-element'),
    BrowserRouter = require('browser-app-router'),
    Vault = require('../vault'),
    CONFIG = {
        template: require('./heirsoft.html'),
        partials: {
            header: require('./header.html')
        }
    };

var Heirsoft = CustomElement.createElement(CONFIG, function Heirsoft(options) {
    var _ = this;

    CustomElement.call(_, options);

    _.defineProperties({
        $: options.$
    });

    var $el = _.$(_.element),
        router = new BrowserRouter({
            mode: 'hash'
        });

    $el.on('click', '[data-create-vault]', function() {
        _.set('vault', new Vault({ $: _.$, data: { path: 'My Vault', keys: [], children: [] } }));
        $el.find('.vault-wrapper').html( _.get('vault.element') );
        return false;
    });

    $el.on('click', '[data-unset]', function() {
        if (confirm('Are you sure you want to close this vault?')) {
            _.unset( _.$(this).attr('data-unset') );
        }

        return false;
    });

    $el.on('click', '.toggle-sidebar', function() {
        var $sidebar = _.$('sidebar');

        if (parseInt($sidebar.css('left'))) {
            $sidebar.animate({ left: 0 }, 150);
        } else {
            $sidebar.animate({ left: '-100%' }, 150);
        }

        return false;
    });
});

Heirsoft.definePrototype({
});

if (typeof window !== 'undefined') {
    window.Heirsoft = Heirsoft;
}

module.exports = Heirsoft;
