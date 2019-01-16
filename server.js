const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

const port = process.env.PORT || 5000;
const app = express();
app.use(express.json());

var transport = nodemailer.createTransport({
	host: 'mail.hagility.com.br',
	port: 587,
	auth: {
		user: 'site@hagility.com.br',
		pass: 'senhapadrao*'
	}
});

/******************************************************************/
/* Conexao com Banco */
/******************************************************************/
var db = mongoose.connection;
db.on('error', console.error);
db.once('open', function() {
  console.log('Conectado ao Moooooongo!')
});

var uri = process.env.MONGODB_URI || 'mongodb://heroku_36h9smz0:1hl3earknnl9vqk47udrh0ln9i@ds249575.mlab.com:49575/heroku_36h9smz0';
mongoose.connect(uri, { useNewUrlParser: true, useCreateIndex: true });


/******************************************************************/
/* Model do usuario */
/******************************************************************/
var userSchema = new mongoose.Schema({
	name : { type: String, required: true },
	email : { type: String, required: true, unique: true, index:true },
	amigo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

var User = mongoose.model('User', userSchema);
mongoose.exports = User;

/****************************************************************/
/* CRUD SIMPLES */
/****************************************************************/
app.get('/amigos', (req, res) => {

	User.find(function(err, resp) {
		if (err) return res.status(500).json(err);
		
		res.status(200).json(resp);
	}).populate('amigo');
});
app.get('/amigo/:id', (req, res) => {

	var id = req.params.id;

	User.findById(id, function(err, resp) {
		if (err) return res.status(500).json(err);
		
		res.status(200).json(resp);
	});
});
app.delete('/amigo/:id', (req, res) => {
	var id = req.params.id;
	User.remove({_id: id}, function (err, resp){
		if (err)
        res.send(err);

    	res.json({ message: resp});
    });	
});
app.post('/amigo', (req, res) => {

	var data = req.body;
	var user = new User(data);
	user.save(function(err, resp) {
		if (err) return res.status(500).json(err);

		res.json(resp);
	});
});
app.put('/amigo/:id', (req, res) => {

	var id = req.params.id;
	var data = req.body;

	User.findOneAndUpdate({_id: id}, data, { new: true }, function(err, user) {
		if (err) return res.status(500).json(err);
		
			res.status(200).json(user);

	}).populate('amigo');
});

// essa rotazinha aqui serve só pra enviar email
// serviria pra qualquer coisa, passando os respectivos params
app.post('/sendMail', (req, res) => {

		var data = req.body;

		new Promise((resolve, reject) => {
			
			transport.sendMail({
		        from: data.from,
		        to: data.to,
		        subject: data.subject,
		        html: data.html,
		    }, (err) => {
		    	if(err){
		    		return reject(res.status(200).json(err));
		    	}else{
		    		return resolve(res.status(200).json(data))
		    	}
		    })
		})
});


app.listen(port, () => console.log(`Example app listening on port ${port}!`))