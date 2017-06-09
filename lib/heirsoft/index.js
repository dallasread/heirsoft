var CustomElement = require('generate-js-custom-element'),
    BrowserRouter = require('browser-app-router'),
    Vault = require('../vault'),
    Opener = require('../opener'),
    CONFIG = {
        template: require('./heirsoft.html'),
        partials: {
            header: require('./header.html'),
            home: require('./home.html')
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
        _.buildNewVault();
        return false;
    });

    $el.on('click', '[data-open-vault]', function() {
        var opener = new Opener({
            $: _.$
        });

        _.set('opener', opener);

        opener.on('data', function(data) {
            _.unset('opener');
            _.buildNewVault(data);
        });

        $el.find('.opener-wrapper').html( _.get('opener.element') );

        return false;
    });

    $el.on('click', '[data-unset]', function() {
        if (confirm('Are you sure you want to close this vault?')) {
            _.unset('opener');
            _.unset('vault');
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
    buildNewVault: function buildNewVault(data) {
        var _ = this,
            vault = new Vault({
                $: _.$,
                data: data || {
                    path: 'My Vault',
                    keys: [],
                    children: [
                        { path: 'Welcome', content: 'Welcome to Heirsoft!\n\nThis file is protected in your vault.\n\nYou can edit or rename this file.\n\nOnce you\'ve added keys to your vault, you\'ll also be able to set the permissions on this file.\n\nTo download your vault, click on your vault\'s name and click "Download Vault". This will give you your AES-256 encrypted data in 1 file, easily decrypt-able even without this website.\n\nEnjoy!' }
                    ]
                }
            });

        _.set('vault', vault);
        _.$(_.element).find('.vault-wrapper').html( _.get('vault.element') );
    },
});

if (typeof window !== 'undefined') {
    window.Heirsoft = Heirsoft;
}

module.exports = Heirsoft;
