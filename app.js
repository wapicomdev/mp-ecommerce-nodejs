var express = require('express');
var exphbs = require('express-handlebars');
var port = process.env.PORT || 3000
const mercadopago = require('mercadopago');

var app = express();

app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

app.use('/stylesheets/fontawesome', express.static(__dirname + '/node_modules/@fortawesome/fontawesome-free/'));


app.use(express.static('assets'));

app.use('/assets', express.static(__dirname + '/assets'));

app.get('/', function (req, res) {
    res.render('home', {
        page: 'home'
    });
});

function fullUrl(req) {
    return {
        protocol: req.protocol,
        host: req.get('host'),
        pathname: req.originalUrl
    };
}

app.get('/detail', function (req, res) {

    var currentUrl = fullUrl(req);

    var host = `${currentUrl.protocol}://${currentUrl.host}`;

    // Agrega credenciales
    mercadopago.configure({
        access_token: 'APP_USR-6317427424180639-042414-47e969706991d3a442922b0702a0da44-469485398',
        integrator_id: 'dev_24c65fb163bf11ea96500242ac130004'
    });

    let prod = {
        img: req.query.img.substring(1),
        asset: req.query.asset,
        title: req.query.title,
        price: Number(req.query.price)
    };

    // Crea un objeto de preferencia
    let preference = {
        auto_return: 'approved',
        notification_url: 'https://hookb.in/Z22K7yyOxBSR33eLoLRD',
        collector_id: 469485398,
        external_reference: 'digitalports2@gmail.com',
        back_urls: {
            "success": `${host}/paymentresult/success`,
            "failure": `${host}/paymentresult/failure`,
            "pending": `${host}/paymentresult/pending`
        },
        items: [{
            ID: 1234,
            title: prod.title,
            description: "Dispositivo móvil de Tienda e-commerce",
            unit_price: prod.price,
            picture_url: `${host}${prod.img}`,
            quantity: 1,
        }],
        "payer": {
            "name": "Lalo",
            "surname": "Landa",
            "email": "test_user_63274575@testuser.com",
            "phone": {
                "area_code": "11",
                "number": 22223333
            },
            "address": {
                "street_name": "Falsa",
                "street_number": 123,
                "zip_code": "1111"
            }
        },
        statement_descriptor: "Tienda e-commerce",
        payment_methods: {
            installments: 6, // Maximo 6 Cuotas
            "excluded_payment_methods": [{
                "id": "amex"
            }],
            "excluded_payment_types": [{
                "id": "atm"
            }]
        }
    };

    mercadopago.preferences.create(preference).then(function (response) {
        console.log('Entering..')
        global.id = response.body.id;

        if (response.status == 201) {
            res.render('detail', {
                vdata: req.query,
                prefLin: response.body.init_point,
                prefId: response.body.id,
                page: 'item'
            });
        } else {
            res.sendStatus(404);
        }
        console.log('Finalizing...')
    }).catch(function (error) {
        console.log(error);
        res.sendStatus(404);
    });
});

app.get('/paymentresult/success', (req, res) => {

    var query = req.query;
    var currentUrl = fullUrl(req);
    var host = `${currentUrl.protocol}://${currentUrl.host}`;
    res.render('success', {host: host, data: query, page: 'item' });
})

app.get('/paymentresult/failure', (req, res) => {
    var currentUrl = fullUrl(req);
    var host = `${currentUrl.protocol}://${currentUrl.host}`;
    console.log(host);
    res.render('failure', {url: host, page: 'item'});
})

app.get('/paymentresult/pending', (req, res) => {
    res.render('pending', {page: 'item'});
})

app.listen(port);