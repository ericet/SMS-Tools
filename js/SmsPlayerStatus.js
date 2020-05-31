let isLoading = false;
let totalRewards = 0;
let totalDec = 0;
let totalLegendary, totalGold, totalOrb = 0;
let leagues = [];
let totalCommon = 0, totalCommonGold = 0, totalRare = 0, totalRareGold = 0, totalEpic = 0, totalEpicGold = 0, totalLegend = 0, totalLegendGold = 0;
Date.prototype.addHours = function (h) {
	this.setHours(this.getHours() + h);
	return this;
}

async function display(player, cards) {
	return new Promise(async function (resolve, reject) {
		const [details,quest,ids,balances,rarityMap] = await Promise.all([getPlayerDetails(player),get_player_quests(player),getClaimIds(player),get_balances(player),getAllCards(player)]);
		
		let images = await getImage(ids, cards);
		// let rc = await get_player_rc(player);
		
		let dec = 0, ecr = 0, legendary = 0, gold = 0, orb = 0;
		let common = 0, common_gold = 0, rare = 0, rare_gold = 0, epic = 0, epic_gold = 0, legend = 0, legend_gold = 0;
		for (let [k, v] of rarityMap) {
			if (k === 1) {
				common = v;
				totalCommon += Number(v);
			} else if (k === '1-gold') {
				common_gold = v;
				totalCommonGold += Number(v);

			} else if (k === 2) {
				rare = v;
				totalRare += Number(v);

			} else if (k === '2-gold') {
				rare_gold = v;
				totalRareGold += Number(v);

			} else if (k === 3) {
				epic = v;
				totalEpic += Number(v);

			} else if (k === '3-gold') {
				epic_gold = v;
				totalEpicGold += Number(v);

			} else if (k === 4) {
				legend = v;
				totalLegend += Number(v);

			} else if (k === '4-gold') {
				legend_gold = v;
				totalLegendGold += Number(v);

			}
		}
		for (let i in balances) {
			if (balances[i].token === 'DEC') {
				dec = balances[i].balance;
			}
			if (balances[i].token === 'ECR') {
				ecr = balances[i].balance;
			}
			if (balances[i].token === 'LEGENDARY') {
				legendary = balances[i].balance;
			}
			if (balances[i].token === 'GOLD') {
				gold = balances[i].balance;
			}
			if (balances[i].token === 'ORB') {
				orb = balances[i].balance;
			}

		}
		totalRewards += details.reward;
		totalDec += dec;
		totalLegendary += legendary;
		totalGold += gold;
		totalOrb += orb;
		let status;
		let created_date;
		let reset_time;
		if (quest[0] === undefined) {
			status = "Haven't claimed anything yet";
			created_date = 'N/A';
			reset_time = 'N/A';
		} else {
			status = quest[0].claim_date == null ? 'In Progress' : 'Completed';
			created_date = new Date(quest[0]['created_date']);
			reset_time = created_date.addHours(23);
		}
		
	  let table =`<table id="dvlist" class="table is-fullwidth"><tbody><tr>`
	  table += '<td><span class="names">Player</span></td>';
	  table += `<td>${details.name}</td>`;
	  table += '</tr>';
		// htmlString += '<tr>';

		// htmlString += '<tr>';
		// htmlString += '<td><span class="names">Resource Credits</span></td>';
		// htmlString += `<td>${rc}%</td>`;
		// htmlString += '</tr>';

		table += '<tr>';
		table += '<td><span class="names">Current Rating</span></td>';
		table += `<td>${details.rating}/${details.season_max_rating}</td>`;
		table += '</tr>';

		table += '<tr>';
		table += '<td><span class="names">Current Capture Rate</span></td>';
		table += `<td>${ecr / 100}%</td>`;
		table += '</tr>';

		table += '<tr>';
		table += '<td><span class="names">DEC Balances</span></td>';
		table += `<td>${dec}</td>`;
		table += '</tr>';

		table += '<tr>';
		table += '<td><span class="names">ORB</span></td>';
		table += `<td>${orb}</td>`;
		table += '</tr>';

		table += '<tr>';
		table += '<td><span class="names">Potion Stats</span></td>';
		table += `<td>Legendary Potion: ${legendary}<br/>Gold Potion: ${gold}</td>`;
		table += '</tr>';




		table += '<tr>';
		table += '<td><span class="names">Collection Stats</span></td>';
		table += `<td>Common: ${common} | Gold: ${common_gold}<br/>Rare:  ${rare} | Gold: ${rare_gold}<br/>Epic: ${epic} | Gold: ${epic_gold}<br/>Legendary: ${legend} | Gold: ${legend_gold}</td>`;
		table += '</tr>';


		table += '<tr>';
		table += '<td><span class="names">Daily Quest</span></td>';
		if (quest[0] === undefined) {
			table += `<td> N/A </td>`;
		} else {
			table += `<td>${quest[0].name} (${quest[0].completed_items}/${quest[0].total_items})</td>`;
		}
		table += '</tr>';
		if (status === 'Completed') {
			table += '<tr>';
			table += '<td><span class="names">Next Quest Time</span></td>';
			table += `<td>${reset_time}</td>`;
			table += '</tr>';
		}

		table += '<tr>';
		table += '<td><span class="names">Total Wins/Battles</span></td>';
		table += `<td>${details.win}/${details.battle} = ${details.win_rate}%</td>`;
		table += '</tr>';
		table += '<tr>';
		table += '<td><span class="names">Season Total Wins/Battles</span></td>';
		table += `<td>${details.season_win}/${details.season_battle} = ${details.season_win_rate}%</td>`;
		table += '</tr>';
		table += '<tr>';
		table += '<td><span class="names">Season League</span></td>';
		table += `<td>${details.league} (${details.reward} Loot Chests)</td>`;
		table += '</tr>';

		table += '<tr>';
		table += '<td><span class="names">The Most Recent Loot Chests Claimed</span></td>';
		let imagesString = '';
		for (let i in images) {
			let image = `<div><img src="${images[i].url}" width="100px" height="150px"><ul><span>${images[i].quantity}</span></ul>`;
			imagesString += image + '</div>';
		}
		table += `<td><div class="row">${imagesString}</div></td>`;
		table += '</tbody></tr></table>';
		let htmlString = '';
		htmlString += `<article class="message is-info">
		<div class="message-header">
			<a data-toggle="collapse" data-parent="#accordion" href="#${player}">
			${player}</a>
		</div>
		<div id="${player}" class="panel-collapse collapse show">
		  <div class="message-body">${table}</div>
		</div>
	  </article>`;

		resolve(htmlString);
	});

}

function get_player_details(player) {
	return new Promise(function (resolve, reject) {
		const url = 'https://steemmonsters.com/players/details?name=' + player;
		axios.get(url).then(function (response) {
			if (!response.data.error) {
				resolve(response.data)

			}
		}).catch(function (error) {
			reject('error');
		});
	});
}

function get_player_quests(player) {
	return new Promise(function (resolve, reject) {
		const url = 'https://steemmonsters.com/players/quests?username=' + player;
		axios.get(url).then(function (response) {
			if (!response.data.error) {
				resolve(response.data)

			}
		}).catch(function (error) {
			reject('error');
		});
	});

}

function getClaimIds(player) {
	return new Promise(function (resolve, reject) {
		const url = "https://api.steemmonsters.io/players/history?username=" + player + "&from_block=-1&limit=10&types=claim_reward";
		axios.get(url).then(function (response, error) {
			if (!error && response.status == 200) {
				let data = response.data;
				let claims = [];
				let rewards;
				for (let info of data) {
					if (!info.error) {
						let ids = JSON.parse(info.result);
						if (ids.rewards !== undefined) {
							rewards = ids.rewards;
						} else {
							rewards = ids;
						}
						for (let reward of rewards) {
							if (reward.type === 'reward_card') {
								if (reward.card !== undefined) {
									let newObj = new Object();
									newObj.type = 'reward_card';
									newObj.id = reward.card.card_detail_id;
									newObj.isGold = reward.card.gold;
									claims.push(newObj);
								} else {
									for (let card of reward.cards) {
										let newObj = new Object();
										newObj.type = 'reward_card';
										newObj.id = card.card_detail_id;
										newObj.isGold = card.gold;
										claims.push(newObj);
									}
								}
							} else if (reward.type === 'dec') {
								let newObj = new Object();
								newObj.type = 'dec';
								newObj.quantity = reward.quantity;
								claims.push(newObj);
							} else if (reward.type === 'potion') {
								let newObj = new Object();
								newObj.type = 'potion';
								newObj.potion_type = reward.potion_type;
								newObj.quantity = reward.quantity;
								claims.push(newObj);
							} else if (reward.type === 'pack') {
								let newObj = new Object();
								newObj.type = 'pack';
								newObj.quantity = reward.quantity;
								claims.push(newObj);
							}
						}
						return resolve(claims);
					}
				}
				return resolve(claims);
			}
		})
	});
}

function getImage(ids, cards) {
	return new Promise(function (resolve, reject) {
		let urls = [];
		for (let i in ids) {
			if (ids[i].type === 'reward_card') {
				for (let j in cards) {
					if (ids[i].id == cards[j].id) {
						let image = new Object();
						let url = 'https://s3.amazonaws.com/steemmonsters/cards_beta/' + cards[j].name.replace(' ', '%20');

						if (ids[i].isGold == true) {
							url += '_gold.png';
						} else {
							url += '.png';
						}
						image.url = url;
						image.quantity = 1;
						urls.push(image);
					}
				}
			} else if (ids[i].type === 'potion') {
				let image = new Object();
				if (ids[i].potion_type === 'legendary') {
					image.url = 'https://s3.amazonaws.com/steemmonsters/website/ui_elements/shop/img_potion_rarity.png';
					image.quantity = ids[i].quantity;

				} else if (ids[i].potion_type === 'gold') {
					image.url = 'https://s3.amazonaws.com/steemmonsters/website/ui_elements/shop/img_potion_gold-foil.png';
					image.quantity = ids[i].quantity;
				}
				urls.push(image);
			} else if (ids[i].type === 'dec') {
				let image = new Object();
				image.url = 'https://s3.amazonaws.com/steemmonsters/website/icons/icon_dec.svg';
				image.quantity = ids[i].quantity;
				urls.push(image)

			} else if (ids[i].type === 'pack') {
				let image = new Object();
				image.url = 'https://d36mxiodymuqjm.cloudfront.net/website/ui_elements/shop/img_essence-orb.png';
				image.quantity = ids[i].quantity;
				urls.push(image)

			}
		}
		resolve(urls);
	});

}

function get_details() {
	return new Promise(function (resolve, reject) {
		const url = "https://steemmonsters.com/cards/get_details";
		axios.get(url).then(function (response, error) {
			if (!error && response.status == 200) {
				let info = response.data;
				resolve(info);
			}
		})
	});
}

function get_player_rc(player) {
	return new Promise(function (resolve, reject) {
		axios.get("https://anyx.io/v1/rc_api/find_rc_accounts?accounts=" + player).then(function (response, error) {
			if (!error && response.status == 200) {
				let ac = response.data;
				if (ac == null)
					resolve('NA');
				let rcPercent = ac.rc_accounts[0].rc_manabar.current_mana / ac.rc_accounts[0].max_rc * 100;

				resolve(rcPercent.toFixed(2));
			} else {
				reject('get_player_rc error');
			}
		})
	});
}

function get_balances(player) {
	return new Promise(function (resolve, reject) {
		axios.get("https://steemmonsters.com/players/balances?username=" + player).then(function (response, error) {
			if (!error && response.status == 200) {
				let balances = response.data
				resolve(balances);
			} else {
				reject('get_balances');
			}
		})

	});
}

function find_cards(card_ids) {
	return new Promise(function (resolve, reject) {
		let card_ids_str = '';
		if (card_ids instanceof Array) {
			card_ids_str = card_ids.join();
		} else {
			card_ids_str = card_ids
		}
		axios.get('https://steemmonsters.com/cards/find?ids=' + card_ids_str).then(function (response, error) {
			if (!error && response.status == 200) {
				var info = response.data;
				resolve(info);
			} else {
				reject('find_cards error');
			}
		})
	});

}

function get_collection(player) {
	return new Promise(function (resolve, reject) {
		axios.get('https://steemmonsters.com/cards/collection/' + player).then(function (response, error) {
			if (!error && response.status == 200) {
				var info = response.data.cards;
				resolve(info);
			} else {
				console.log(player)
				reject('get_collection error')
			}
		});
	});
}


async function getAllCards(player) {
	return new Promise(async function (resolve, reject) {
		let collections = await get_collection(player);
		let rarityMap = new Map();
		let card_ids = [];
		for (let i in collections) {
			card_ids.push(collections[i].uid);
		}
		if (card_ids.length != 0) {
			let cards = await find_cards(card_ids);
			cards.forEach(card => {
				if (card.gold) {
					if (rarityMap.get(card.details.rarity + "-gold")) {
						rarityMap.set(card.details.rarity + "-gold", rarityMap.get(card.details.rarity) + 1);
					} else {
						rarityMap.set(card.details.rarity + "-gold", 1);
					}
				} else {
					if (rarityMap.get(card.details.rarity)) {
						rarityMap.set(card.details.rarity, rarityMap.get(card.details.rarity) + 1);
					} else {
						rarityMap.set(card.details.rarity, 1);
					}
				}

			});
		}
		resolve(rarityMap);
	});
}

function hasAdded(leagues, leagueName) {
	for (let league of leagues) {
		if (league.name === leagueName) {
			return true;
		}

	}
	return false;


}
function addLeague(leagues, leagueName) {
	let league = new Object();
	league.name = leagueName;
	league.count = 1;
	leagues.push(league);

}

function updateLeague(leagues, leagueName) {
	for (let league of leagues) {
		if (league.name === leagueName) {
			league.count++;
			return;
		}

	}
	return;

}

function getPlayerDetails(player) {
	return new Promise(async function (resolve, reject) {
		let playerDetails = new Object();
		let detail = await get_player_details(player);
		if (detail != 'error' && detail.season_details.battles != null) {
			playerDetails.name = detail.name;
			playerDetails.rating = detail.rating;
			playerDetails.battle = detail.battles;
			playerDetails.win = detail.wins;
			playerDetails.win_rate = (detail.wins / detail.battles * 100).toFixed(2);
			playerDetails.capture_rate = detail.capture_rate;
			playerDetails.season_battle = detail.season_details.battles;
			playerDetails.season_win = detail.season_details.wins;
			playerDetails.season_max_rating = detail.season_details.max_rating;
			playerDetails.season_win_rate = (playerDetails.season_win / playerDetails.season_battle * 100).toFixed(2)
			let seasonRating = detail.season_details.max_rating;
			if (seasonRating >= 0 && seasonRating <= 99) {
				playerDetails.league = 'Novice';
				playerDetails.reward = 0;
			} else if (seasonRating >= 100 && seasonRating <= 399) {
				playerDetails.league = 'Bronze 3'
				playerDetails.reward = 5;

			} else if (seasonRating >= 400 && seasonRating <= 699) {
				playerDetails.league = 'Bronze 2'
				playerDetails.reward = 7;
			} else if (seasonRating >= 700 && seasonRating <= 999) {
				playerDetails.league = 'Bronze 1'
				playerDetails.reward = 9;
			} else if (seasonRating >= 1000 && seasonRating <= 1299) {
				playerDetails.league = 'Silver 3'
				playerDetails.reward = 12;
			} else if (seasonRating >= 1300 && seasonRating <= 1599) {
				playerDetails.league = 'Silver 2'
				playerDetails.reward = 15;
			} else if (seasonRating >= 1600 && seasonRating <= 1899) {
				playerDetails.league = 'Silver 1'
				playerDetails.reward = 18;
			} else if (seasonRating >= 1900 && seasonRating <= 2199) {
				playerDetails.league = 'Gold 3'
				playerDetails.reward = 22;
			} else if (seasonRating >= 2200 && seasonRating <= 2499) {
				playerDetails.league = 'Gold 2'
				playerDetails.reward = 26;
			} else if (seasonRating >= 2500 && seasonRating <= 2799) {
				playerDetails.league = 'Gold 1'
				playerDetails.reward = 30;
			} else if (seasonRating >= 2800 && seasonRating <= 3099) {
				playerDetails.league = 'Diamon 3'
				playerDetails.reward = 40;
			} else if (seasonRating >= 3100 && seasonRating <= 3399) {
				playerDetails.league = 'Diamon 2'
				playerDetails.reward = 50;
			} else if (seasonRating >= 3400 && seasonRating <= 3699) {
				playerDetails.league = 'Diamon 1'
				playerDetails.reward = 60;
			} else if (seasonRating >= 3700 && seasonRating <= 4199) {
				playerDetails.league = 'Champion 3'
				playerDetails.reward = 80;
			} else if (seasonRating >= 4200 && seasonRating <= 4699) {
				playerDetails.league = 'Champion 2'
				playerDetails.reward = 120;
			} else if (seasonRating >= 4700) {
				playerDetails.league = 'Champion 1'
				playerDetails.reward = 150;
			}
			if (hasAdded(leagues, playerDetails.league)) {
				updateLeague(leagues, playerDetails.league);

			} else {
				addLeague(leagues, playerDetails.league);
			}
			resolve(playerDetails);
		}
	});
}

$(document).ready(async function () {

	$('#view').submit(async function (e) {
		e.preventDefault();

		$('#log').val('');
		$('div#display').html('');
		$('div#summary').html(`<div class="loader"></div>`)
		const input = $('#username').val();
		let usernames = input.split(',');
		let htmlString = '	<div class="panel-group" id="accordion">';
		let cards = await get_details();
		totalRewards = 0, totalDec = 0, totalLegendary = 0, totalGold = 0, totalOrb = 0, totalCommon = 0, totalCommonGold = 0, totalRare = 0, totalRareGold = 0, totalEpic = 0, totalEpicGold = 0, totalLegend = 0, totalLegendGold = 0;
		leagues = [];
		for (let i in usernames) {
			let username = usernames[i];
			let string = await display(username, cards);
			htmlString += string;
		}
		htmlString += `</div>`;	
		let leagueHtml ='';
		for (let league of leagues) {
			leagueHtml += `${league.name}(${league.count}) `;
		}
		let summary =`<div class="row">
		<div class="column">
			<div class="title"><i class="fas fa-wallet"></i> Summary</div>
			<div class="main">Total Season Loot Chests: ${totalRewards}</div>
			<div class="main">League: ${leagueHtml}</div>
			<div class="main">Total DEC:${totalDec.toFixed(3)}</div>
			<div class="main">Total Legendary/Gold Potion:${totalLegendary}/${totalGold}</div>
			<div class="main">Total Orb:${totalOrb}</div>

		</div>
		<div class="column">
			<div class="title"><i class="fas fa-award"></i> Cards</div>
			<div class="main">Total Common/Gold Cards: ${totalCommon}/${totalCommonGold}</div>
			<div class="main">Total Rare/Gold Cards: ${totalRare}/${totalRareGold}</div>
			<div class="main">Total Epic/Gold Cards: ${totalEpic}/${totalEpicGold}</div>
			<div class="main">Total Legendary/Gold Cards: ${totalLegend}/${totalLegendGold}</div>

		</div>
	</div>`

		$('div#summary').html(summary+"</div>");
		$('div#display').html(htmlString);
		let x = document.getElementById("pleaseWait");
		x.style.display = "none";

	});
});
