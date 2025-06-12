const express = require('express');
const nunjucks = require('nunjucks');

const app = express();

app.set('port', 7777);
app.set('view engine', 'html');

app.use("/public",express.static('public'));

nunjucks.configure("views",{
    express:app,
    watch:true,
})

const mainRouter = require('./routes/mainRouter.js');
const bellRouter = require('./routes/bellRouter.js');
const moneyRouter = require('./routes/moneyRouter.js');

app.use('/', mainRouter);
app.use('/bell', bellRouter);
app.use('/money', moneyRouter);

app.listen(app.get('port'), ()=>{
    console.log(app.get('port'), '번 포트에서 대기 중')
});