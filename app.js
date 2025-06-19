const express = require('express');
const nunjucks = require('nunjucks');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const expressSession = require('express-session');
const path = require('path');

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));
app.use(cookieParser());
app.use(expressSession({
    secret: 'asdf1234',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: false,
        secure: false,
    },
    name: "session-cookie",
}));

app.set('port', 7777);
app.set('view engine', 'html');
app.set('views', path.join(__dirname, 'views'));

app.use('/public', express.static(path.join(__dirname, 'public')));

nunjucks.configure('views', {
    express: app,
    watch: true,
});

const mainRouter = require('./routes/mainRouter.js');
const loginRouter = require('./routes/loginRouter.js');
const bellRouter = require('./routes/bellRouter.js');
const moneyRouter = require('./routes/moneyRouter.js');
const dailyListRouter = require('./routes/dailyListRouter.js');
const detailRouter = require('./routes/detailRouter.js');

app.use('/', mainRouter);
app.use('/login', loginRouter);
app.use('/bell', bellRouter);
app.use('/money', moneyRouter);
app.use('/daily', dailyListRouter);
app.use('/detail', detailRouter);

app.listen(app.get('port'), ()=>{
    console.log(app.get('port'), '번 포트에서 대기 중')
});