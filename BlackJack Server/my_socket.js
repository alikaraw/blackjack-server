let socketIO = require("socket.io");
let GameManager = require("./classes/GameManager");

const CARD_FLIP_TIME = 800;
let ioSocket;

/**
 * Username: Socket
 */
let AllSockets = {};

/**
 * username: partyAdmin;
 */
let partyPointer = {}

/*
    "partyAdmin": {
        gamemode = 'ranked/casual'
        partyMembers = [partyAdmin, member1, member2, member3] // max 4
        gameManager = obj
        nextStage = 0; // also used to track the current player turn
    }
*/
let Games = {}

exports.CreateSocket = (server) => {
    ioSocket = socketIO(server);
    ioSocket.on('connect', (socket) => {   
        socket.on('forceFriendsUpdate', (friends) => {
            for(let iFriend = 0; iFriend < friends.length; iFriend++) {
                let friendSocket = AllSockets[friends[iFriend]];
                
                if(friendSocket) {
                    friendSocket.emit('updateFriends', Object.keys(AllSockets));
                }
            }
        });

        socket.on('forceFriendsMenuUpdate', (friend) => {
            let friendSocket = AllSockets[friend];
            if(friendSocket) {
                friendSocket.emit('UpdateFriendMenu');
            }
        });
        
        socket.on('newConnection', (username) => {            
            AllSockets[username] = socket;
            Games[username] = {
                partyMembers: [username],
                gameManager: undefined,
                nextStage: 0,
            }
            partyPointer[username] = username;
            
            console.log(AllSockets);
        });

        socket.on('newPartyInvite', (target) => {
            let user = getUserFromSocket(socket);
            if(user && AllSockets[target]) {
                AllSockets[target].emit('newPartyInvite', user);
            }
        });

        socket.on('joinParty', (target) => {
            let user = getUserFromSocket(socket);
            if(Games[target] && Games[target].partyMembers.length < 4 && user) { // make sure only admin can invite people
                Games[target].partyMembers.push(user);
                delete Games[user];
                partyPointer[user] = target;

                for(let iMember = 0; iMember < Games[target].partyMembers.length; iMember++) {
                    let memeberSocket = AllSockets[Games[target].partyMembers[iMember]];
                    
                    if(memeberSocket) {
                        memeberSocket.emit('updateLobby', Games[target].partyMembers);
                        memeberSocket.emit('updateGamemode', Games[target].gamemode)
                    }
                }
            }
        });

        socket.on('kickParty', (target) => {
            let user = getUserFromSocket(socket);
            
            // remove member from party
            let index = Games[user].partyMembers.indexOf(target);
            if(index != -1) { 

                // Create new party for kicked member
                Games[target] = {
                    gamemode: undefined,
                    partyMembers: [target],
                    gameManager: undefined,
                    nextStage: 0,
                }
                partyPointer[target] = target;
                
                AllSockets[target].emit('updateLobby', Games[target].partyMembers);
                AllSockets[target].emit('updateGamemode');
                
                // Remove member from party
                Games[user].partyMembers.splice(index, 1);

                // Update all members lobby
                emitToParty(user, 'updateLobby', Games[user].partyMembers);
            }
        });

        socket.on('changeGamemode', (gamemode) => {
            let user = getUserFromSocket(socket);
            if (Games[user]) {
                Games[user].gamemode = gamemode;
                emitToParty(user, 'updateGamemode', gamemode);
            } 
        });

        socket.on('startSetupGame', () => {
            let user = getUserFromSocket(socket);

            if(Games[user] && Games[user].gamemode) {   
                let partyAdmin = partyPointer[user];             
                if(Games[user].gamemode == 'ranked') {
                    Games[partyAdmin].gameManager = new GameManager(Games[partyAdmin].partyMembers.length, -1);
                    emitToParty(user, 'getMemberBalance');
                } else {
                    Games[partyAdmin].gameManager = new GameManager(Games[partyAdmin].partyMembers.length, 1500);
                    emitToParty(partyAdmin, 'startGame');
                }
            }
        });

        socket.on('sendMemberBalance', (balance) => {
            let user = getUserFromSocket(socket);
            let partyAdmin = partyPointer[user]; 

            Games[partyAdmin].gameManager.setPlayerBalance(getPlayerIndexInParty(user), balance);
            Games[partyAdmin].nextStage++;

            if(isNextStage(partyAdmin)) {
                Games[partyAdmin].nextStage = 0;
                emitToParty(partyAdmin, 'startGame');
            }
        });

        socket.on('connectSocket', (username) => {
            AllSockets[username] = socket;
            let partyAdmin = partyPointer[username];
            Games[partyAdmin].nextStage++;
            
            if(isNextStage(partyAdmin)) {
                Games[partyAdmin].nextStage = 0;
                updateAllInfo(partyAdmin);
            }
        });

        socket.on('ConfirmBet', (betAmount) => {
            let user = getUserFromSocket(socket);
            let partyAdmin = partyPointer[user];

            Games[partyAdmin].gameManager.setPlayerBet(getPlayerIndexInParty(user), betAmount);
            Games[partyAdmin].nextStage++;
            socket.emit('updatePlayerInfo', Games[partyAdmin].gameManager.getPlayer(getPlayerIndexInParty(user)));

            if(isNextStage(partyAdmin)) { // everyone placed a bet
                startRound(partyAdmin);
            }
        });

        socket.on('ActionHit', () => {
            let user = getUserFromSocket(socket);
            let partyAdmin = partyPointer[user];
            let playerIndex = Games[partyAdmin].nextStage;

            Games[partyAdmin].gameManager.drawCardForPlayer(playerIndex);
            emitToParty(partyAdmin, 'updateGameState', {
                username: Games[partyAdmin].partyMembers[playerIndex], 
                player: Games[partyAdmin].gameManager.getPlayer(playerIndex),
                dealer: Games[partyAdmin].gameManager.getDealer()
            });

            socket.emit('updatePlayerInfo', Games[partyAdmin].gameManager.getPlayer(playerIndex));
        });

        socket.on('ActionStand', () => {
            socket.emit('finishRound');
        });

        socket.on('ActionSurrender', () => {
            let user = getUserFromSocket(socket);
            let partyAdmin = partyPointer[user];
            let playerIndex = Games[partyAdmin].nextStage;
            
            Games[partyAdmin].gameManager.getPlayer(playerIndex).surrenderHand();
            updateAllInfo(partyAdmin);
            socket.emit('updatePlayerInfo', Games[partyAdmin].gameManager.getPlayer(playerIndex));
            socket.emit('finishRound');
        });

        socket.on('ActionDouble', () => {
            let user = getUserFromSocket(socket);
            let partyAdmin = partyPointer[user];
            let playerIndex = Games[partyAdmin].nextStage;
            
            Games[partyAdmin].gameManager.getPlayer(playerIndex).doubleHand();
            Games[partyAdmin].gameManager.drawCardForPlayer(playerIndex);
            emitToParty(partyAdmin, 'updateGameState', {
                username: Games[partyAdmin].partyMembers[playerIndex], 
                player: Games[partyAdmin].gameManager.getPlayer(playerIndex),
                dealer: Games[partyAdmin].gameManager.getDealer()
            });

            updateAllInfo(partyAdmin);
            socket.emit('updatePlayerInfo', Games[partyAdmin].gameManager.getPlayer(playerIndex));
            socket.emit('finishRound');
        });

        socket.on('ActionSplit', () => {
            let user = getUserFromSocket(socket);
            let partyAdmin = partyPointer[user];
            let playerIndex = Games[partyAdmin].nextStage;

            emitToParty(partyAdmin, 'AnimateSplit');
            Games[partyAdmin].gameManager.getPlayer(playerIndex).splitHand();
            setTimeout(() => {
                socket.emit('updateNextButton', 'Switch Hands');
                socket.emit('updatePlayerInfo', Games[partyAdmin].gameManager.getPlayer(playerIndex));
                emitToParty(partyAdmin, 'updateGameState', {
                    username: Games[partyAdmin].partyMembers[playerIndex], 
                    player: Games[partyAdmin].gameManager.getPlayer(playerIndex),
                    dealer: Games[partyAdmin].gameManager.getDealer()
                });
            }, 400); // 400 is the time it takes for the card to get to the point in the animation
        })

        socket.on('ActionInsurance', () => {
            let user = getUserFromSocket(socket);
            let partyAdmin = partyPointer[user];
            let playerIndex = Games[partyAdmin].nextStage;

            Games[partyAdmin].gameManager.getPlayer(playerIndex).takeInsurance();
            updateAllInfo(partyAdmin);
            socket.emit('updatePlayerInfo', Games[partyAdmin].gameManager.getPlayer(playerIndex));
            emitToParty(partyAdmin, 'updateGameState', {
                username: Games[partyAdmin].partyMembers[playerIndex], 
                player: Games[partyAdmin].gameManager.getPlayer(playerIndex),
                dealer: Games[partyAdmin].gameManager.getDealer()
            });
        });

        socket.on('ActionNext', () => {
            let user = getUserFromSocket(socket);
            let partyAdmin = partyPointer[user];
            let playerIndex = Games[partyAdmin].nextStage;
            
            if(Games[partyAdmin].gameManager.isRoundFinished()) { // round finished now start new round if all players want to
                Games[partyAdmin].nextStage++;
                socket.emit('disableNextRoundButton');

                if(isNextStage(partyAdmin)) {
                    Games[partyAdmin].nextStage = 0;
                    Games[partyAdmin].gameManager.resetGame();
                    
                    emitToParty(partyAdmin, 'updateGameState', {
                        username: Games[partyAdmin].partyMembers[0], 
                        player: Games[partyAdmin].gameManager.getPlayer(0),
                        dealer: Games[partyAdmin].gameManager.getDealer()
                    });

                    emitToParty(partyAdmin, 'newRound');
                    
                    for(let iPlayer = 0; iPlayer < Games[partyAdmin].partyMembers.length; iPlayer++) {
                        AllSockets[Games[partyAdmin].partyMembers[iPlayer]].emit('updatePlayerInfo', Games[partyAdmin].gameManager.getPlayer(iPlayer));
                    }
                }
            } else if(Games[partyAdmin].gameManager.getPlayer(playerIndex).splittedHand) { // player split hand, let him play his second hand
                Games[partyAdmin].gameManager.getPlayer(playerIndex).splittedHand = false;
                Games[partyAdmin].gameManager.getPlayer(playerIndex).switchHands();
                socket.emit('updateNextButton', playerIndex + 1 == Games[partyAdmin].partyMembers.length ? 'Finish Round' : 'Next Player');
                socket.emit('updatePlayerInfo', Games[partyAdmin].gameManager.getPlayer(playerIndex));
                emitToParty(partyAdmin, 'flipAllPlayerCards');
                setTimeout(() => {
                    emitToParty(partyAdmin, 'updateGameState', {
                        username: Games[partyAdmin].partyMembers[playerIndex], 
                        player: Games[partyAdmin].gameManager.getPlayer(playerIndex),
                        dealer: Games[partyAdmin].gameManager.getDealer()
                    });
                }, CARD_FLIP_TIME);
            } else if (playerIndex + 1 == Games[partyAdmin].partyMembers.length) { // finish round
                Games[partyAdmin].nextStage = 0;
                Games[partyAdmin].gameManager.flipDealerCards();
                emitToParty(partyAdmin, 'updateDealerCards', Games[partyAdmin].gameManager.getDealer());

                let drawCardCylce = setInterval(() => {
                    if(Games[partyAdmin].gameManager.getDealer().getMainHandPoints() < 17) {
                        Games[partyAdmin].gameManager.drawCardForDealer();
                        emitToParty(partyAdmin, 'updateDealerCards', Games[partyAdmin].gameManager.getDealer());
                    } else {
                        clearInterval(drawCardCylce);
                        
                        let players = {};
                        for (let iPlayer = 0; iPlayer < Games[partyAdmin].partyMembers.length; iPlayer++) {
                            players[Games[partyAdmin].partyMembers[iPlayer]] = Games[partyAdmin].gameManager.getPlayer(iPlayer);
                        }
                        
                        emitToParty(partyAdmin, 'displayEndMenu', {
                            dealer: Games[partyAdmin].gameManager.getDealer(),
                            players: players
                        });

                        CalcResults(partyAdmin);
                        updateAllInfo(partyAdmin);
                        for(let iPlayer = 0; iPlayer < Games[partyAdmin].partyMembers.length; iPlayer++) {
                            let playerSocket = AllSockets[Games[partyAdmin].partyMembers[iPlayer]];
                            playerSocket.emit('updatePlayerInfo', Games[partyAdmin].gameManager.getPlayer(iPlayer));
                            if(Games[partyAdmin].gamemode == 'ranked') {
                                playerSocket.emit('updatePlayerBalance', Games[partyAdmin].gameManager.getPlayer(iPlayer).balance);
                            }
                        }
                    }
                }, CARD_FLIP_TIME);
            } else { // Next player's turn to play
                Games[partyAdmin].nextStage++;
                emitToParty(partyAdmin, 'flipAllPlayerCards');
                setTimeout(() => {
                    emitToParty(partyAdmin, 'updateGameState', {
                        username: Games[partyAdmin].partyMembers[Games[partyAdmin].nextStage], 
                        player: Games[partyAdmin].gameManager.getPlayer(Games[partyAdmin].nextStage),
                        dealer: Games[partyAdmin].gameManager.getDealer()
                    });
                }, CARD_FLIP_TIME);
            }
        });

        socket.on('exitGame', () => {
            let user = getUserFromSocket(socket);
            let partyAdmin = partyPointer[user];
            
            if(Games[partyAdmin].partyMembers.length > 1) { // if user is not alone in party
                let playerIndex = getPlayerIndexInParty(user);
                Games[partyAdmin].partyMembers.splice(playerIndex, 1);
                Games[partyAdmin].gameManager.getPlayers().splice(playerIndex, 1);

                if(user == partyAdmin) {
                    let newPartyAdmin = Games[partyAdmin].partyMembers[0];
                    for (let iMember = 0; iMember < Games[partyAdmin].partyMembers.length; iMember++) {
                        partyPointer[Games[partyAdmin].partyMembers[iMember]] = newPartyAdmin;
                    }

                    Games[newPartyAdmin] = Games[partyAdmin];
                    delete Games[partyAdmin];
                    partyAdmin = newPartyAdmin;
                }

                updateAllInfo(partyAdmin);
                
                // check if all players other than the one existed the game placed bets if so begin the round
                if(isNextStage(partyAdmin)) {
                    startRound(partyAdmin);
                }

                socket.emit('backToHome');
            } else {
                socket.emit('backToHome');
            }
        });

        // socket.on('disconnect', (reason) => {
        //     let user = getUserFromSocket(socket);

        //     for(let userSocket of Object.values(AllSockets)) {
        //         userSocket.emit('updateFriends', Object.keys(AllSockets));
        //     }
        // });
    })
}

function emitToParty(partyAdmin, event, data = undefined) {
    for(let iMember = 0; iMember < Games[partyAdmin].partyMembers.length; iMember++) {
        let memeberSocket = AllSockets[Games[partyAdmin].partyMembers[iMember]];
        
        if(memeberSocket) {
            memeberSocket.emit(event, data);
        }
    }
}

function updateAllInfo(partyAdmin) {    
    let partyMembers = Games[partyAdmin].partyMembers;
    let players = {}
    for (let iMember = 0; iMember < partyMembers.length; iMember++) {
        players[partyMembers[iMember]] = Games[partyAdmin].gameManager.getPlayer(getPlayerIndexInParty(partyMembers[iMember]));
    }

    emitToParty(partyAdmin, 'updateAllInfo', players);
}

function getUserFromSocket(userSocket) {    
    for (const [username, socket] of Object.entries(AllSockets)) {
        if(userSocket.id == socket.id) {
            return username;
        }
    }

    return null;
}

function getPlayerIndexInParty(user) {
    return Games[partyPointer[user]].partyMembers.indexOf(user);
}

function isNextStage(partyAdmin) {
    return Games[partyAdmin].nextStage == Games[partyAdmin].partyMembers.length;
}

function startRound(partyAdmin) {
    Games[partyAdmin].nextStage = 0;                
    Games[partyAdmin].gameManager.startRound();

    emitToParty(partyAdmin, 'startRound', Games[partyAdmin].gameManager.getDealer());
    emitToParty(partyAdmin, 'updateGameState', {
        username: Games[partyAdmin].partyMembers[0], 
        player: Games[partyAdmin].gameManager.getPlayer(0),
        dealer: Games[partyAdmin].gameManager.getDealer()
    });

    AllSockets[partyAdmin].emit('updatePlayerInfo', Games[partyAdmin].gameManager.getPlayer(0));
    for (let iPlayer = 0; iPlayer < Games[partyAdmin].partyMembers.length; iPlayer++) {
        AllSockets[Games[partyAdmin].partyMembers[iPlayer]].emit('updateNextButton', (Games[partyAdmin].partyMembers.length - 1 == iPlayer) ? 'Finish Round' : "Next Player");
    }
}

function CalcResults(partyAdmin) {
    const partyMembers = Games[partyAdmin].partyMembers;
    const gameManager = Games[partyAdmin].gameManager;
    let dealer = gameManager.getDealer();
    let dealerPoints = dealer.getMainHandPoints();

    for(let iPlayer = 0; iPlayer < partyMembers.length; iPlayer++) {
        let player = gameManager.getPlayer(iPlayer);
        let moneyWon = 0;

        if (player.getMainHandPoints() <= 21) { //
            if(dealerPoints > 21) { // dealer lost he has over 21 points
                moneyWon += (player.bet * (player.isMainHandBJ() ? 2.5 : 2)); // 2.5 for blackjack
            } else { // neither player or dealer over 21 points
                if(player.getMainHandPoints() > dealerPoints) { // player has more points than dealer
                    moneyWon += (player.bet * (player.isMainHandBJ() ? 2.5 : 2)); // 2.5 for blackjack
                } else if (player.getMainHandPoints() == dealerPoints) { // player and dealer has same points // money back
                    moneyWon += player.bet;
                }
            }
        }

        /* Split Hand Check */
        if (player.getSplitHandPoints() > 0 && player.getSplitHandPoints() <= 21) { //
            if(dealerPoints > 21) { // dealer lost he has over 21 points
                moneyWon += (player.bet * (player.isSplitHandBJ() ? 2.5 : 2)); // 2.5 for blackjack
            } else { // neither player or dealer over 21 points
                if(player.getSplitHandPoints() > dealerPoints) { // player has more points than dealer
                    moneyWon += (player.bet * (player.isSplitHandBJ() ? 2.5 : 2)); // 2.5 for blackjack
                } else if (player.getSplitHandPoints() == dealerPoints) { // player and dealer has same points // money back
                    moneyWon += player.bet;
                }
            }
        }

        /* Check Insurance */
        if(dealer.isMainHandBJ()) {
            moneyWon += player.insurance * 2;
        }

        let totalBetMoney = player.bet * (player.splitHand.length != 0 ? 2 : 1) + player.insurance;

        if(moneyWon > totalBetMoney) {
            player.wins++;
        } else if (moneyWon < totalBetMoney) {
            player.loses++;
        }

        gameManager.addBalanceToPlayer(iPlayer, moneyWon);
    }
}