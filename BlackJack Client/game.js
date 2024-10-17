/* IMPORTS */

import Card from "./classes/Client_Card.js";
import Player from "./classes/Client_Player.js";
import * as httpRequest from './http/http_client.js';

/* HTML ELEMENTS */

let dealerTitle = document.getElementById("dealerTitle");
let dealerHand = document.getElementById("dealerHand");

let playerTitle = document.getElementById("playerTitle");
let playerHandMain = document.getElementById("playerHandMain");
let playerHandSplit = document.getElementById("playerHandSplit");

let btnExit = document.getElementById('btnExit');
let startRoundMessage = document.getElementById("startRoundMessage");
let ContainerOverlay = document.getElementById("containerOverlay");
let ContainerOverlaySummery = document.getElementById("containerOverlaySummery");
let ContainerOverlayDealer = document.getElementById("containerOverlayDealer");
let ContainerOverlayPlayers = document.querySelectorAll(".containerOverlayPlayer");

let pPanelPlayerName = document.getElementById("pPanelPlayerName");
let pPanelPlayerBalance = document.getElementById("pPanelPlayerBalance");
let spanPlayerRunInfoBet = document.getElementsByClassName("spanPlayerRunInfoBet");
let spanPlayerRunInfoPoints = document.getElementsByClassName("spanPlayerRunInfoPoints");
let spanPlayerRunInfoInsurance = document.getElementById("spanPlayerRunInfoInsurance");
let PlayersInfo = document.getElementsByClassName("playerInfo");

let btnBetReset = document.getElementById("btnBetReset");
let btnBetAllIn = document.getElementById("btnBetAllIn");
let imgChips = document.querySelectorAll(".chip");
let textBet = document.getElementById("TextBet");
let btnBetConfirm = document.getElementById("btnBetConfirm");

let ContainerBets = document.getElementById("ContainerBets");
let ContainerGameButtons = document.getElementById("ContainerGameButtons");

let btnNextPlayer = document.getElementById("btnNextPlayer");
let btnHit = document.getElementById("btnHit");
let btnDouble = document.getElementById("btnDouble");
let btnStand = document.getElementById("btnStand");
let btnSplit = document.getElementById("btnSplit");
let btnInsurance = document.getElementById("btnInsurance");
let btnSurrender = document.getElementById("btnSurrender");

/* VARS */
let socket = io()
let CurrentBetAmount = 0;
let player;

/* ON CLICK FUNCTIONS */

btnExit.onclick = () => {
    socket.emit("exitGame");
}

btnBetReset.onclick = () => {
    CurrentBetAmount = 0;
    updateBetAmount();
}

btnBetAllIn.onclick = () => {
    CurrentBetAmount = player.balance;
    updateBetAmount();
}

btnBetConfirm.onclick = () => {
    if (CurrentBetAmount != 0) {
        toggleBetButtons(true);
        socket.emit('ConfirmBet', CurrentBetAmount);
    }
}

for(let iChip = 0; iChip < imgChips.length; iChip++) {
    imgChips[iChip].onclick = (e) => {
        let amount = parseInt(e.target.src.split('_')[1].replace(".png", ""));
        if(CurrentBetAmount + amount <= player.balance) {
            CurrentBetAmount += amount;
            updateBetAmount();
        }
    }
}

btnHit.onclick = () => {
    socket.emit('ActionHit');
}

btnStand.onclick = () => {
    socket.emit('ActionStand');
}

btnSurrender.onclick = () => {
    socket.emit('ActionSurrender');
}

btnDouble.onclick = () => {
    socket.emit('ActionDouble');
}

btnSplit.onclick = () => {
    socket.emit('ActionSplit');
}

btnInsurance.onclick = () => {
    socket.emit('ActionInsurance');
}

btnNextPlayer.onclick = () => {
    socket.emit('ActionNext');
}

/* FUNCTIONS */

function updateBetAmount() {
    textBet.textContent = `${CurrentBetAmount}$`
}

function updatePanelInfo(player) {
    pPanelPlayerName.textContent = sessionStorage.username;
    pPanelPlayerBalance.textContent = `${player.balance}$`;
    
    spanPlayerRunInfoPoints[0].textContent = (player.handMain.length == 0) ? '-' : player.getMainHandPoints();
    spanPlayerRunInfoBet[0].textContent = (player.handMain.length == 0) ? '-' : player.bet;

    spanPlayerRunInfoPoints[1].textContent = (player.handSplit.length == 0) ? '-' : player.getSplitHandPoints();
    spanPlayerRunInfoBet[1].textContent = (player.handSplit.length == 0) ? '-' : player.bet;

    spanPlayerRunInfoInsurance.textContent = (player.insurance == 0) ? '-' : player.insurance;
}

function updateSidePanel(players) {
    let iPlayer = 0;
    for(let [name, player] of Object.entries(players)) {
        PlayersInfo[iPlayer].children[0].textContent = name;
        PlayersInfo[iPlayer].children[1].textContent = `${player.balance}$`;

        PlayersInfo[iPlayer].children[2].children[0].children[1].textContent = player.wins;
        PlayersInfo[iPlayer].children[2].children[1].children[1].textContent = player.loses;
        iPlayer++
    }

    for(; iPlayer < 4; iPlayer++) {
        PlayersInfo[iPlayer].style.visibility = 'hidden';
    }
}

function togglePanel(isBet) {
    if(isBet) {
        ContainerBets.classList.remove('invisible');
        ContainerGameButtons.classList.add('invisible');
    } else {
        ContainerBets.classList.add('invisible');
        ContainerGameButtons.classList.remove('invisible');
    }
}

function toggleBetButtons(state) {
    btnBetConfirm.disabled = state;
    btnBetAllIn.disabled = state;
    btnBetReset.disabled = state;
    for(let iChip = 0; iChip < imgChips.length; iChip++) {
        imgChips[iChip].classList.toggle('disabled', state);
    }
}

function disableActionButtons() {
    btnHit.disabled = true;
    btnStand.disabled = true;
    btnSurrender.disabled = true;
    btnDouble.disabled = true;
    btnSplit.disabled = true;
    btnInsurance.disabled = true;
    btnNextPlayer.disabled = true;
}

function updateActionButtons(player, dealer) {   
    btnHit.disabled = false;
    btnStand.disabled = false;
    btnSurrender.disabled = !player.canSurrender();
    btnDouble.disabled = !player.canDouble();
    btnSplit.disabled = !player.canSplit();

    // dealer has ace And player didn't take insurance
    btnInsurance.disabled = !(dealer.handMain[0] && dealer.handMain[0].value == 1 && player.insurance == 0);
    
    // hand over 21
    if(player.getMainHandPoints() >= 21) {
        btnHit.disabled = true;
        btnStand.disabled = true;
        btnSurrender.disabled = true;
        btnDouble.disabled = true;
        btnSplit.disabled = true;
        btnInsurance.disabled = true;
    }
    
    btnNextPlayer.disabled = !(player.getMainHandPoints() >= 21);
}

function flipCardsInElement(handElement) {
    let Cards = handElement.querySelectorAll('.card-scene');
    for(let iCard = 0; iCard < Cards.length; iCard++) {
        Cards[iCard].children[0].classList.remove("card-flipped");
    }
}

/**
 * Updates the image view of the handElement according to the playerHand Array
 * @param {[Card...]} playerHand array of the cards to place in the element 
 * @param {HTMLElement} handElement the element of hand to update
 */
function updateHandElement(playerHand, handElement) {
    let Cards = handElement.querySelectorAll('.card-scene');
    for(let iCard = 0; iCard < Cards.length; iCard++) {
        if(playerHand[iCard]) {
            Cards[iCard].style.visibility = "visible";
            Cards[iCard].children[0].children[0].children[0].src = getCardImage(playerHand[iCard]);
            Cards[iCard].children[0].classList.toggle("card-flipped", playerHand[iCard].isUp);
        } else {
            Cards[iCard].children[0].classList.remove("card-flipped");
            Cards[iCard].style.visibility = "hidden";
        }
    }
}

/**
 * Get the image for the card
 * @param {Card} card card to get the image for
 * @returns {String} path to the card image
 */
function getCardImage(card) {
    card = new Card(card.value, card.symbol);
    let valueName = card.getValueName();
    let symbolName = card.getSymbolName();
    return `./images/cards/${valueName}_of_${symbolName}.svg`;
}

function AnimateSplit() {
    let playerHand1Card2 = playerHandMain.children[0].children[1]
    let playerHand2Card1 = playerHandSplit.children[0].children[0];

    let moveX = playerHand2Card1.getBoundingClientRect().x - playerHand1Card2.getBoundingClientRect().x;
    let moveY = playerHand2Card1.getBoundingClientRect().y - playerHand1Card2.getBoundingClientRect().y;

    playerHand2Card1.children[0].classList.add("card-flipped");

    playerHand1Card2.style.left = `${moveX}px`;
    playerHand1Card2.style.top = `${moveY}px`;
    
    setTimeout(() => {
        playerHand1Card2.children[0].classList.remove("card-flipped");
        playerHand1Card2.style.left = `0px`;
        playerHand1Card2.style.top = `0px`;
    }, 400);
}

function updateSummery(dealer, players) {
    let dealerPoints = dealer.getMainHandPoints();

    ContainerOverlayDealer.children[0].innerHTML = `Dealer (${dealerPoints} Points)`
    ContainerOverlayDealer.children[1].innerHTML = '';

    for(let iCard = 0; iCard < dealer.handMain.length; iCard++) {
        let newCard = document.createElement("img");
        newCard.src = getCardImage(dealer.handMain[iCard]);
        ContainerOverlayDealer.children[1].append(newCard);
    }

    let iPlayer = 0;
    for(let [name, player] of Object.entries(players)) {
        ContainerOverlayPlayers[iPlayer].style.display = 'block';

        let playerOverlayInformation = ContainerOverlayPlayers[iPlayer].children[1];
        let didPlayerSplit = player.handSplit.length != 0;

        // Name
        ContainerOverlayPlayers[iPlayer].children[0].innerText = name
        
        // Hand 1
        playerOverlayInformation.children[0].children[0].children[0].innerText = `${player.getMainHandPoints()} Points`;
        playerOverlayInformation.children[0].children[0].children[1].innerText = `${player.bet}$ Bet`;

        // Hand 2
        playerOverlayInformation.children[0].children[1].style.opacity = (didPlayerSplit) ? 1 : 0.5;
        playerOverlayInformation.children[0].children[1].children[0].innerText = `${(didPlayerSplit) ? player.getSplitHandPoints() : '-'} Points`;
        playerOverlayInformation.children[0].children[1].children[1].innerText = `${(didPlayerSplit) ? `${player.bet}$` : '-'} Bet`;

        // Insurance
        playerOverlayInformation.children[1].style.opacity = (player.insurance != 0) ? 1 : 0.5;
        playerOverlayInformation.children[1].innerHTML = `${player.insurance != 0 ? `${player.insurance}$` : "-"} Insurance`;

        // Total Bet Money
        let totalBetMoney = player.bet * (didPlayerSplit ? 2 : 1) + player.insurance;
        playerOverlayInformation.children[2].innerHTML = `${totalBetMoney}$ - Total Money Bet`;

        // Total Money Won
        let totalWonMoney = 0;

        if (player.getMainHandPoints() <= 21) { //
            if(dealerPoints > 21) { // dealer lost he has over 21 points
                totalWonMoney += (player.bet * (player.isMainHandBJ() ? 2.5 : 2)); // 2.5 for blackjack
            } else { // neither player or dealer over 21 points
                if(player.getMainHandPoints() > dealerPoints) { // player has more points than dealer
                    totalWonMoney += (player.bet * (player.isMainHandBJ() ? 2.5 : 2)); // 2.5 for blackjack
                } else if (player.getMainHandPoints() == dealerPoints) { // player and dealer has same points // money back
                    totalWonMoney += player.bet;
                }
            }
        }

        /* Split Hand Check */
        if (player.getSplitHandPoints() > 0 && player.getSplitHandPoints() <= 21) { //
            if(dealerPoints > 21) { // dealer lost he has over 21 points
                totalWonMoney += (player.bet * (player.isSplitHandBJ() ? 2.5 : 2)); // 2.5 for blackjack
            } else { // neither player or dealer over 21 points
                if(player.getSplitHandPoints() > dealerPoints) { // player has more points than dealer
                    totalWonMoney += (player.bet * (player.isSplitHandBJ() ? 2.5 : 2)); // 2.5 for blackjack
                } else if (player.getSplitHandPoints() == dealerPoints) { // player and dealer has same points // money back
                    totalWonMoney += player.bet;
                }
            }
        }

        /* Check Insurance */
        if(dealer.isMainHandBJ()) {
            totalWonMoney += player.insurance * 2;
        }
        
        // Total money won
        playerOverlayInformation.children[3].innerHTML = `${totalWonMoney}$ - Total Money Won`;
        
        // New Total Balance
        player.balance += totalWonMoney;
        playerOverlayInformation.children[4].innerHTML = `${player.balance}$ - Total Balance`;

        // Color Backhground according to win/lose/tie with money
        if(totalWonMoney > totalBetMoney) { // win
            player.wins++;
            ContainerOverlayPlayers[iPlayer].style.backgroundColor = "#7aef95";
        } else if (totalWonMoney < totalBetMoney) { // lose
            player.loses++;
            ContainerOverlayPlayers[iPlayer].style.backgroundColor = "#F77B7D";
        } else { // tie
            ContainerOverlayPlayers[iPlayer].style.backgroundColor = "#7ba7f7";
        }

        iPlayer++;
    }

    for(; iPlayer < 4; iPlayer++) {
        ContainerOverlayPlayers[iPlayer].style.display = 'none';
    }
}

/* SOCKET */

socket.on('connect', () => {
    updateBetAmount();
    socket.emit('connectSocket', sessionStorage.username);

    socket.on('updateAllInfo', (players) => {
        for(let [name, object] of Object.entries(players)) {
            players[name] = new Player(object);
        }
        
        player = players[sessionStorage.username];
        updatePanelInfo(players[sessionStorage.username]);
        updateSidePanel(players);
    });

    socket.on('updatePlayerInfo', (player) => {
        player = new Player(player);
        updatePanelInfo(player);
    });

    socket.on('startRound', (dealerData) => {
        dealerData = new Player(dealerData);
        dealerTitle.textContent = `Dealer (${dealerData.getMainHandPoints()} Points)`
        updateHandElement(dealerData.handMain, dealerHand);
    
        togglePanel(false);
        ContainerOverlay.classList.remove('isOnScreen');  
    });

    socket.on('updateGameState', (gameData) => {        
        gameData.player = new Player(gameData.player);
        gameData.dealer = new Player(gameData.dealer);

        playerTitle.textContent = `${gameData.username} (${gameData.player.getMainHandPoints()} Points)`
        updateHandElement(gameData.player.handMain, playerHandMain);
        updateHandElement(gameData.player.handSplit, playerHandSplit);
        gameData.player.flipCards();
        playerTitle.textContent = `${gameData.username} (${gameData.player.getMainHandPoints()} Points)`
        updateHandElement(gameData.player.handMain, playerHandMain);

        if(gameData.username == sessionStorage.username) { // is client the current player            
            updateActionButtons(gameData.player, gameData.dealer);
        } else {
            disableActionButtons();
        }
    });

    socket.on('AnimateSplit', () => {
        AnimateSplit();
    });

    socket.on('updateNextButton', (text) => {
        btnNextPlayer.textContent = text;
    });

    socket.on('flipAllPlayerCards', () => {
        flipCardsInElement(playerHandMain);
        flipCardsInElement(playerHandSplit);
    })

    socket.on('updateDealerCards', (dealer) => {
        dealer = new Player(dealer);
        dealerTitle.textContent = `Dealer (${dealer.getMainHandPoints()} Points)`
        updateHandElement(dealer.handMain, dealerHand);
    });

    socket.on('finishRound', () => {
        disableActionButtons();
        btnNextPlayer.disabled = false;
    });

    socket.on('displayEndMenu', (gameData) => {
        gameData.dealer = new Player(gameData.dealer);

        for(let [name, player] of Object.entries(gameData.players)) {
            gameData.players[name] = new Player(player);
        }

        updateSummery(gameData.dealer, gameData.players);
        ContainerOverlay.classList.add('isOnScreen');
        ContainerOverlaySummery.style.display = 'flex'
        startRoundMessage.style.display = 'none'

        disableActionButtons();
        setTimeout(() => {
            btnNextPlayer.textContent = 'Start New Round';
            btnNextPlayer.disabled = false;
        }, 2000);
    });

    socket.on('newRound', () => {
        CurrentBetAmount = 0;
        ContainerOverlaySummery.style.display = 'none'
        startRoundMessage.style.display = 'flex'

        togglePanel(true);
        toggleBetButtons(false);
        updateBetAmount();
    });

    socket.on('disableNextRoundButton', () => {
        btnNextPlayer.disabled = true;
    });

    socket.on('updatePlayerBalance', (balance) => {
        httpRequest.sendPostRequest(`api/set_balance?username=${sessionStorage.username}&password=${sessionStorage.password}&balance=${balance}`,
            (result) => {
            }, (error) => {
                console.log(error);
            }
        )
    });

    socket.on('backToHome', () => {
        window.location.href = '/home_page.html';
    });
});