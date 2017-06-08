var CustomElement = require('generate-js-custom-element'),
    Vault = require('../vault'),
    CONFIG = {
        template: require('./index.html')
    };

var Heirsoft = CustomElement.createElement(CONFIG, function Heirsoft(options) {
    var _ = this;

    CustomElement.call(_, options);

    _.defineProperties({
        $: options.$
    });

    _.$(_.element).on('click', '[data-create-vault]', function() {
        _.set('vault', new Vault({ $: _.$, data: { keys: [], children: [] } }));
        _.element.append(_.get('vault.element'))
        return false;
    });
});

Heirsoft.definePrototype({
});

if (typeof window !== 'undefined') {
    window.Heirsoft = Heirsoft;
}

module.exports = Heirsoft;
