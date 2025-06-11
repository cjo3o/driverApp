const express = require('express');
const nunjucks = require('nunjucks');

const app = express();

app.set('port', 7777);
app.set('view engine', 'html');

nunjucks.configure("views",{
    express:app,
    watch:true,
})

const mainRouter = require('./routes/mainRouter.js');
app.use('/', mainRouter);

app.listen(app.get('port'), ()=>{
    console.log(app.get('port'), '번 포트에서 대기 중')
});