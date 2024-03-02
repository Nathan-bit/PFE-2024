const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views','./views')
app.use(express.static(__dirname + '/public'));

let message ="je suis une message"
app.get('/', (req, res) =>{
  res.render('index',{message: message});
})

app.get('/header' , (req, res) => {
    res.render('partiales/header')
  })
app.get('/footer', (req, res) => {res.render('partiales/footer')})
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});