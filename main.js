const express = require('express')
const https = require("https")
const {JsonDB, Config} = require("node-json-db")
const app = express()
const db = new JsonDB(new Config("users",true,false,'/'))
const port = 9491
const port2 = 9492
const fs = require('node:fs');
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // Use `true` for port 465, `false` for all other ports
  auth: {
    user: "funteering253@gmail.com",
    pass: "nldy javs isnx txnr",
  },
});


app.use(express.static('public'))

app.use(express.raw({limit:"200mb"}))
app.use(express.json({limit:"200mb"}))


app.post('/checkpass', async(req,res) => {
	try {
		const filter = await db.getData(`/users/${req.body.user}`)
		console.log(filter.pass == req.body.pass)
		if(filter.pass == req.body.pass) {
			res.send({success:true})
		} else {
			res.send({success:false})
		}
	}
	catch {
		res.send({success:false})}
	})

app.post('/delete', express.raw({type: "*/*", limit:"200mb"}) , async (req, res) => {
	if(req.body.place === 0) {
	
		await db.push(`/users/${req.body.user}/images[${req.body.id}]`,null)
	} else if(req.body.place === 1) {
		await db.push(`/users/${req.body.user}/images2[${req.body.id}]`,null)
	}
	await res.send({status:"ok"});
})

app.post('/image', express.raw({type: "*/*", limit:"200mb"}) , async (req, res) => {
	const filename = `images/${req.headers["bilsem-username"]}_${Date.now()}.jpg`;
	const prefix = "public/"
	await fs.writeFile(
		prefix + filename, 
		req.body, 
		(err) => {
			if(err) { 
				console.log(err)
			} else {
				console.log("ok")
			}
		}
	)
	
	await db.push(`/users/${req.headers["bilsem-username"]}/images[${req.headers["bilsem-index"]}]`,filename)
	await res.send({status:"ok"});
})




app.post('/image2', express.raw({type: "*/*", limit:"200mb"}) , async (req, res) => {
	const filename = `images2/${req.headers["bilsem-username"]}_${Date.now()}.jpg`;
	const prefix = "public/"
	await fs.writeFile(
		prefix + filename, 
		req.body, 
		(err) => {
			if(err) { 
				console.log(err)
			} else {
				console.log("ok")
			}
		}
	)
	
	await db.push(`/users/${req.headers["bilsem-username"]}/images2[${req.headers["bilsem-index"]}]`,filename)
	await res.send({status:"ok"});
})

app.post("/completedmap", async(req,res)=>{
	await db.push(`/users/${req.body.user}/completedIndexes[${req.body.mapId}]`,true)
	const sentMail = await db.getData(`/users/${req.body.user}/mailSent[${req.body.mapId}]`)
	console.log(sentMail)
	if(!sentMail) {
		let getPhotoPaths;
		if(req.body.mapId === 0) {
			getPhotoPaths = await db.getData(`/users/${req.body.user}/images`)	
		} else if(req.body.mapId === 1) {
			getPhotoPaths = await db.getData(`/users/${req.body.user}/images2`)	
		}
		const info = await transporter.sendMail({
		    from: 'SPICA 253 - FUN-TEERING', // sender address
		    to: req.body.user, // list of receivers
		    //attachments: getPhotoPaths.map(item=>{return {path:"http://3.84.53.159:9491/"+item}}),
		    attachments: getPhotoPaths.map(item=>{return {path:`${process.cwd()}/public/${item}`}}),
		    subject: `Merhaba ${req.body.user} - Oryantiring fotoğraflarınız`, // Subject line
		    text: "Görevlerinizi tamamladığınız için teşekkürler!" // plain text body
		});
		await db.push(`/users/${req.body.user}/mailSent[${req.body.mapId}]`, true)
	} else {console.log("mailsent")}
	await res.send({status :"ok"})
})


app.post('/communityPost', async(req,res)=>{
	await db.push(`/topluluk[]`, {message:req.body.message,timestamp:Date.now(), from:req.body.user})
	await res.send({status:"ok"})
})

app.get('/getPosts', async(req,res)=>{
	const posts = await db.getData('/topluluk')
	await res.send({status:"ok", posts})
})
app.post("/create_user", async (req,res) => {
	try {
		await db.getData(`/users/${req.body.user}`);
	} catch {
		await db.push(`/users/${req.body.user}`, {pass:req.body.pass,images:Array(10).fill(null), images2:Array(5).fill(null), mailSent: Array(2).fill(false) , completedIndexes:Array(5).fill(null)});
	}
	await res.send({status : "ok"})
})

app.post("/sendmail", async(req,res) => {
	

})

app.get("/test", async(req,res)=>{
	await res.send({status:"ok"})
})

app.post("/get_images", async(req,res) => {
	console.log(req.body)
	await res.send({prefix:"http://3.84.53.159:9491/", ...await db.getData(`/users/${req.body.user}/`)});
});

var options = {
    key: fs.readFileSync('/etc/letsencrypt/live/ahmetefeakyazi.codes/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/ahmetefeakyazi.codes/fullchain.pem'),
};

var server = https.createServer(options, app).listen(port2, function(){
  console.log("Express HTTPS server listening on port " + port2);
});
var server2 = app.listen(port, ()=>{console.log("Express HTTP server listening on port" + port)})
