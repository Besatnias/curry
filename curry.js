// CoinMarketCap
const Cmc = require('node-coinmarketcap')
	, cmc = new Cmc()
// 1Forex
	, fs = require('fs-extra')
	, vars = JSON.parse(fs.readFileSync('secrets'))
	, forge_key = vars.other.forge
	, ForexDataClient = require('./ForexDataClient.js')
	, forge = new ForexDataClient(forge_key)
// NeDb
	, Db = require('nedb-promise')
	, curry = new Db({
			filename: 'curry.json'
		, autoload: true
		, onload: (e) => e && console.err(e)
	})
// HTTP
	, rp = require('request-promise')

const forgeExchanges = [
	'EURUSD', 'GBPUSD', 'AUDUSD',
  'NZDUSD', 'XAUUSD', 'XAGUSD',
  'JPYUSD', 'CHFUSD', 'CADUSD',
  'SEKUSD', 'NOKUSD', 'MXNUSD',
  'ZARUSD', 'TRYUSD', 'CNHUSD' ]

const log = value =>
	(console.log(value), value);

const getCoins = () =>
	new Promise(resolve =>
		cmc.multi(resolve));

const getTop = (n) =>
	getCoins().then( coins =>
		coins.getTop(n))

const cmcToDb = () => 
	getTop(50).then( arr =>
		Promise.all(arr.map( coin =>
			quoteToDb(coin.symbol, 1 / coin.price_usd))))

const forgeToDb = () =>
	forge.getQuotes(forgeExchanges)
		.then( quotes =>
			Promise.all(quotes.map( quote =>
				quoteToDb(quote.symbol.replace('USD', ''), quote.price))))

const dtToDb = () =>
	rp('https://s3.amazonaws.com/dolartoday/data.json')
		.then(JSON.parse)
			.then( data =>
				quoteToDb('VEF', data.USD.dolartoday));

const quoteToDb = (symbol, price) =>
	curry.find({ symbol: symbol })
		.then( entry =>
			entry.price !== price
			&& curry.update(
				{ symbol: symbol, id: (entry[0] || {})._id }
			, { $set: { price: price } }
			, { upsert: true }))

// forge.getSymbols()
// 	.then(symbols =>
// 		symbols.filter(symbol =>
// 			/USD$/.test(symbol)))
// 				.then(console.dir)

// const getDT = () => 

// cmcToDb()
// 	.then(console.log)
// 	.catch(console.err)


// const getCmc = () => cmc.multi( coins =>
// 	curry.update( {price: Number}
// 		, coins.getTop(50).map( coin =>
// 				({ symbol: coin.symbol, price: 1 / coin.price_usd }))
// 		, { upsert: true })
// 	.then(console.log)
// 	.catch(console.error))


	// , r = require('ramda')
	// , cron = require('cron')
	// ,	Promise = require('bluebird')

/** TO DO

rn I need to produce the symbol recognizer? Well not before I build the getForge and getDt so that the db is filled up
however, what I'm planning is to use string-similarity module. Use this array of symbols and map it to just be names and symbol
https://gist.github.com/Fluidbyte/2973986
should be name, name_plural, symbols, all in an array
names: []
symbol: 'symbol'
then all of those could be joined into an array of names
when receiving a word, it would automatically pass by the similarity checker and choose the string with the highest similarity
this would in turn check the previous array, look for the symbol, look in the db for the symbol's value
do the math relationship and then return

**/