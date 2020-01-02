let express = require('express')
let app = express()
let cors = require('cors')
let bodyParser = require('body-parser')
let morgan = require('morgan');

// Define Port
const { config } = require('./default')
let port = process.env.PORT || config.port;
let response = require('./helpers/response')
const { connect } = require('./helpers/mongoose_adapter')


// WebConfig
let routes = require('./app/router/v1');

// MobileConfig
let routesMobile = require('./mobile/router/v1');

app.use(morgan('dev'));

// SET SERVER CORS
const corsOptions = {
  allowedHeaders: ['Content-Type', 'Origin', 'X-Requested-With', 'Accept', 'access-control-allow-origin', 'appname', 'portalname'],
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  // preflightContinue: false
}

app.use(cors(corsOptions))

// Using Body-Parser
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({extended: true}));
// Using Router Path Upload
app.use('/upload', express.static(__dirname + '/uploads'));
app.use('/template', express.static(__dirname + '/data/template'));
// Using Router API V1
app.use('/api/v1', routes);
app.use('/api-mobile/v1/', routesMobile);
// Using Router
let connection = connect(function(req,res){
  try{
    if(res){
    }else{
      res.status(500).json(new response(false, 404, 'Error: DB not connected'));
    }
  }
  catch(e){
      console.log(new response(false, 500, 'Error: DB not connected'))
  }
});

app.listen(port)
console.log('Listen port: ' + port);

//catch 404 and forward to error handler
app.use(function (req, res, next) {
  res.status(404).json(new response(false, 404, 'Page Not Found'));
});

app.use(function (req, res, next) {
  res.status(500).json(new response(false, 404, 'Error:: Something Wrong'));
});
