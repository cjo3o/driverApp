const express = require('express');
const nunjucks = require('nunjucks');
const logger = require('morgan');

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(express.static('public'));

app.set('port', 7777);

app.use("/public",express.static('public'));

nunjucks.configure("views",{
    express:app,
    watch:true,
});

app.set('view engine', 'html');

const mainRouter = require('./routes/mainRouter.js');
const loginRouter = require('./routes/loginRouter.js');
const bellRouter = require('./routes/bellRouter.js');
const moneyRouter = require('./routes/moneyRouter.js');

app.use('/', mainRouter);
app.use('/login', loginRouter);
app.use('/bell', bellRouter);
app.use('/money', moneyRouter);

app.listen(app.get('port'), ()=>{
    console.log(app.get('port'), '번 포트에서 대기 중')
});