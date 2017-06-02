const express = require('express')
const http = require('http')
const url = require('url')
// const querystring = require('querystring')
const router = express.Router()

const urlMap = {
  '/getcontact': 'http://slandasset.applinzi.com/contacts/API/get.php',
  '/insertcontact': 'http://slandasset.applinzi.com/contacts/API/insert.php',
  '/updatecontact': 'http://slandasset.applinzi.com/contacts/API/update.php',
  '/deletecontact': 'http://slandasset.applinzi.com/contacts/API/delete.php',
}

function mapUrl(rawUrl) {
  let urlObj = url.parse(rawUrl)
  return urlMap[urlObj.pathname]
}

function requestGet(realUrl, req, res) {
  const getReq = http.get(realUrl, (response) => {
    let body = ''
    response.on('data', (d) => {
      body += d
    })

    response.on('end', () => {
      res.json(JSON.parse(body))
    })
  })

  getReq.on('error', (e) => {
      console.log(`problem with request: ${e.message}`)
  });
  getReq.end()
}

function requestPost(realUrl, req, res) {
  console.log(req.body)
  let data = Object.keys(req.body)[0]
  // console.log(rawData)
  // let data = JSON.parse(rawData)
  // console.log(rawData)
  // let data = querystring.stringify(rawData)
  console.log(data)
  let urlObj = url.parse(realUrl)
	let options = {
	    host: urlObj.hostname,
	    path: urlObj.path,
	    port: urlObj.port,
	    method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(data)
      }
	}

	const postReq = http.request(options, function(response) {
		let body = ''
	    response.setEncoding('utf8')
	    response.on('data', function (chunk) {
	        body += chunk
	    });
	    response.on('end',function(){
	        res.json(body)
	    })
	});

	postReq.on('error', (e) => {
  		console.log(`problem with request: ${e.message}`)
	});

	postReq.write(data)
	postReq.end()
}

module.exports = () => {
  //get contacts
  router.get('/getcontact', (req, res) => {
    console.log('getcontact start!')
    let realUrl = mapUrl(req.url)
    requestGet(realUrl, req, res)
  })
  //insert contacts
  router.post('/insertcontact', (req, res) => {
    console.log('insertcontact start!')
    let realUrl = mapUrl(req.url)
    requestPost(realUrl, req, res)
  })

  //update contacts
  router.post('/updatecontact', (req, res) => {
    console.log('updatecontact start!')
    let realUrl = mapUrl(req.url)
    requestPost(realUrl, req, res)
  })

  //delete contacts
  router.post('/deletecontact', (req, res) => {
    console.log('deletecontact start!')
    let realUrl = mapUrl(req.url)
    requestPost(realUrl, req, res)
  })

  return router
}