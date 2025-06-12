const express = require('express');
const nunjucks = require('nunjucks');
const logger = require('morgan');

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(express.static('public'));

app.set('port', 8000);

nunjucks.configure("views",{
    express:app,
    watch:true,
});

app.set('view engine', 'html');

const mainRouter = require('./routes/mainRouter.js');
const loginRouter = require('./routes/loginRouter.js');

app.use('/', mainRouter);
app.use('/login', loginRouter);

app.listen(app.get('port'), ()=>{
    console.log(app.get('port'), '번 포트에서 대기 중')
});