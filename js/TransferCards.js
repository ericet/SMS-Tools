const client = new dsteem.Client('https://api.hive.blog');
steem.api.setOptions({
	url: 'https://api.hive.blog'
});

// Checking if the already exists
async function checkAccountName(username) {
	const ac = await client.database.call('lookup_account_names', [[username]]);
	return (ac[0] === null) ? false : true;
}

function get_collection(player) {
	return new Promise(async function (resolve, reject) {
		axios.get("https://steemmonsters.com/cards/collection/" + player).then(function (response, error) {
			if (!error && response.status == 200) {
				let data = response.data;
				resolve(data.cards);
			} else {
				reject('get_collection error');
			}

		});

	});
}

function get_market_orders(player) {
	return new Promise(async function (resolve, reject) {
		let orders=[];
		axios.get("https://steemmonsters.com/cards/collection/" + player).then(function (response, error) {
			if (!error && response.status == 200) {
				let cards = response.data.cards;
				for(let card of cards){
					if(card.market_id!==null){
						orders.push(card.market_id);
					}
				}
				resolve(orders);
			} else {
				reject('get_collection error');
			}

		});

	});
}

function get_for_sale_grouped() {
	return new Promise(async function (resolve, reject) {
		axios.get("https://steemmonsters.com/market/for_sale_grouped").then(function (response, error) {
			if (!error && response.status == 200) {
				let data = response.data;
				resolve(data);
			} else {
				reject('get_for_sale_grouped error');
			}

		});

	});

}

async function start(account, postingKey, selection, to, hasKeychain,percent) {
	let collection = await get_collection(account);
	let extraCards = [];
	let orders =[];
	$('#log').val('');
	if (selection === 'extra' || selection === 'market') {
		extraCards = await getExtraCards(collection);
	} 
	else if(selection ==='cancel'){
		orders = await get_market_orders(account);
			let i, j, chunk, max = 40;
			for (i = 0, j = orders.length; i < j; i += chunk) {
				chunk = orders.slice(i, i + max);
				let log = await cancelCards(account, postingKey, chunk, hasKeychain);
				logit($('#log'), log)
			}
	
	}
	else {
		for (let i in collection) {
			if (collection[i].market_id === null) {
				extraCards.push(collection[i]);
			}
		}

	}
	if (extraCards.length > 0) {
		if (selection === 'market') {

			let data = await get_for_sale_grouped();
			let sellCards = [];
			let percentIncreased = 1+percent/100;
			for (let i in extraCards) {
				for (let j in data) {
					if (extraCards[i].card_detail_id === data[j].card_detail_id && extraCards[i].gold === data[j].gold && extraCards[i].edition === data[j].edition) {
						let card = new Object();
						card.uid = extraCards[i].uid;
						card.price = (data[j].low_price * percentIncreased).toFixed(3);
						sellCards.push(card);
					}
				}
			}
			let i, j, chunk, max = 20;
			for (i = 0, j = sellCards.length; i < j; i += chunk) {
				chunk = sellCards.slice(i, i + max);
				let log = await sellCardsAtMarketPrice(account, postingKey, chunk, hasKeychain);
				logit($('#log'), log);
			}
			

		} else {
			let cards = []
			for (let i in extraCards) {
				cards.push(extraCards[i].uid);
			}
			let i, j, chunk, max = 40;
			for (i = 0, j = cards.length; i < j; i += chunk) {
				chunk = cards.slice(i, i + max);
				let log = await transferCards(account, postingKey, chunk, to, hasKeychain);
				logit($('#log'), log)
			}
			
		}
	} 
	else if(orders.length>0){
		console.log(orders);
	}
	
	else {
		logit($('#log'), `${account} has no card to send/sell!`);
	}

}

function getExtraCards(collection) {
	return new Promise(async function (resolve, reject) {
		let uniqueCards = [];
		let extraCards = [];
		for (let i in collection) {
			if (hasAdded(uniqueCards, collection[i].card_detail_id)) {
				if (collection[i].level == 1 && collection[i].market_id == null) {
					extraCards.push(collection[i]);
				}
			} else {
				uniqueCards.push(collection[i].card_detail_id)
			}

		}
		resolve(extraCards);
	});

}

//Check if the card has been added to the collection
function hasAdded(cards, card) {

	for (let i in cards) {
		if (cards[i] == card) {
			return true;
		}
	}
	return false;

}

function transferCards(account, postingKey, cards, to, hasKeychain) {
	return new Promise(async function (resolve, reject) {
		var json = JSON.stringify({
			to: to,
			cards: cards
		});
		if (hasKeychain && postingKey === '') {
			hive_keychain.requestCustomJson(account, 'sm_gift_cards', "Posting", json, 'Splinterlands Card Transfer', function (response) {
				if (response.error != null) {
					resolve(response.error);
				}
				resolve(`${account} transferred ${cards.length} cards (${cards}) to ${to}`);
			});
		} else {
			steem.broadcast.customJson(postingKey, [], [account], 'sm_gift_cards', json, (err, result) => {
				if (err) {
					resolve(`Transfer failed:${err}`);
				} else {
					resolve(`${account} transferred ${cards.length} cards (${cards}) to ${to}`);
				}

			});
		}
	});
}

function cancelCards(account, postingKey, cards, hasKeychain) {
	return new Promise(async function (resolve, reject) {
		var json = JSON.stringify({
			trx_ids: cards
		});
		if (hasKeychain && postingKey === '') {
			hive_keychain.requestCustomJson(account, 'sm_cancel_sell', "Posting", json, 'Splinterlands Cancel Market Orders', function (response) {
				if (response.error != null) {
					resolve(response.error);
				}
				resolve(`${account} cancelled ${cards.length} market orders (${cards})`);
			});
		} else {
			steem.broadcast.customJson(postingKey, [], [account], 'sm_cancel_sell', json, (err, result) => {
				if (err) {
					resolve(`Cancellation failed:${err}`);
				} else {
					resolve(`${account} cancelled ${cards.length} market orders (${cards})`);
				}

			});
		}
	});
}

function sellCardsAtMarketPrice(account, postingKey, cards, hasKeychain) {
	return new Promise(async function (resolve, reject) {
		var json = [];
		let log = '';
		for (let i in cards) {
			json.push({
				cards: [cards[i].uid],
				currency: 'USD',
				price: cards[i].price,
				fee_pct: 500
			})
			log += `${cards[i].uid} listed at price ${cards[i].price}\n`;
		}
		if (hasKeychain && postingKey === '') {
			hive_keychain.requestCustomJson(account, 'sm_sell_cards', "Posting", JSON.stringify(json), 'Splinterlands Card Sell', function (response) {
				if (response.error != null) {
					resolve(response.error);
				}
				resolve(log);
			});
		} else {
			steem.broadcast.customJson(postingKey, [], [account], 'sm_sell_cards', JSON.stringify(json), (err, result) => {
				if (err) {
					resolve(`Transfer failed:${err}`);
				} else {
					resolve(log);
				}

			});
		}
	});

}

function logit(dom, msg) {
	if ((msg == undefined) || (msg == null) || (msg == '')) {
		return;
	}
	var d = new Date();
	var n = d.toLocaleTimeString();
	var s = dom.val();
	dom.val((s + "\n" + n + ": " + msg).trim());
}

function clearSelection(tokens) {
	return new Promise(async function (resolve, reject) {
		let length = tokens.options.length;
		for (i = 0; i < length; i++) {
			tokens.options[i] = null;
		}
		resolve(tokens);
	});

}

$('#transfer').submit(async function (e) {
	e.preventDefault();
	let hasKeychain = false;
	const username = $("#username").val().trim();
	const postingKey = $('#posting-key').val().trim();
	const percent =$("#amount").val().trim();
	if(percent.length===0){
		percent=5;
	}
	const to = $("#to").val().trim();
	const selection = $("#selection").val();
	if (steem.utils.validateAccountName(username) !== null) {
		alert('Invalid Steem ID');
		$("#username").focus();
		return;
	}
	if (window.hive_keychain) {
		hasKeychain = true;
	}
	if (postingKey == '' && !hasKeychain) {
		alert('Your Private Posting Key is missing.');
		$("#posting-key").focus();
		return;
	}
	let validAccount;
	console.log(selection)
	if (selection === 'market' || selection ==='cancel') {
		validAccount = true;
		
	} 
	else {
		validAccount = await checkAccountName(to);
	}
	if (validAccount) {
		start(username, postingKey, selection, to, hasKeychain,percent);
	} else {
		logit($('#log'), username + " is an invalid steem ID");
	}

});

$("select").change(function () {
	if ($(this).val() == 'market') {
		document.getElementById("to").disabled = true;
		document.getElementById("amount").disabled = false;
		document.getElementById("submit").textContent  = "Sell All";
	} 
	
	else if($(this).val() == 'cancel'){
		document.getElementById("to").disabled = true;
		document.getElementById("amount").disabled = true;
		document.getElementById("submit").textContent  = "Cancel All";
	}
	else {
		document.getElementById("to").disabled = false;
		document.getElementById("amount").disabled = true;
		document.getElementById("submit").textContent  = "Transfer All";

	}
}).trigger("change");
