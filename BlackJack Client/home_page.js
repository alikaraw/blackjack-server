/* IMPORTS */

import * as httpRequest from './http/http_client.js';

/* ELEMENTS */

let pPlayerName = document.getElementById("pPlayerName");
let pUserBalance = document.getElementById("pUserBalance");

let ContainerMainPages = document.getElementById("ContainerMainPages").children;
let menuNavbarItems = document.getElementsByTagName("li");
let btnPlay = document.getElementById("btnPlay");

let inputSearchName = document.getElementById("inputSearchName");
let btnFriendsMenu = document.getElementById("btnFriendsMenu");

let ContainerFriendReq = document.getElementById("ContainerFriendReq");
let FriendsReqExit = document.getElementById("FriendsReqExit");

let FriendsReqSent = document.getElementById("FriendsReqSent");
let FriendsReqSentContainer = document.getElementById("FriendsReqSentContainer");
let FriendsReqSentList = document.getElementById("FriendsReqSentList");
let FriendsReqInput = document.getElementById("FriendsReqInput");
let FriendReqSend = document.getElementById("FriendReqSend");

let FriendsReqInc = document.getElementById("FriendsReqInc");
let FriendsReqIncContainer = document.getElementById("FriendsReqIncContainer");
let FriendsReqIncList = document.getElementById("FriendsReqIncList");

let ContainerFriendsList = document.getElementById("ContainerFriendsList");
let ContainerFriendActions = document.getElementById("ContainerFriendActions");
let FriendsAction = document.getElementsByClassName("FriendsAction");

let btnInvitesMenu = document.getElementById("btnInvitesMenu");
let ContainerPartyInvites = document.getElementById("ContainerPartyInvites");
let ContainerPartyInvites_List = document.getElementById("ContainerPartyInvites_List");
let ContainerLobbySpots = document.getElementById("ContainerLobbySpots");
let ContainerMods = document.getElementsByClassName("ContainerMod");
let btnStartGame = document.getElementById("btnStartGame");

/* VARS */

let socket = new io();
let arrPartyInvites = []; // array of all the party invites there is for client
let arrPartyMembers = [];
let friendActionTarget = '';

const DictionaryPages = {
    "btnPlay": "ContainerPlay",
    "liRewards": "ContainerRewards",
};

/* ON EVENT ELEMENTS */

btnPlay.onclick = (e) => {
    ChangeMainPage(e.target.id);
}

for (let iItem = 0; iItem < menuNavbarItems.length; iItem++) {
    menuNavbarItems[iItem].onclick = (e) => {
        ChangeMainPage(e.target.id)
    }
}

btnFriendsMenu.onclick = () => {
    ContainerFriendReq.style.display = 'flex';
}

PartyInvitesExit.onclick = () => {
    ContainerPartyInvites.style.display = 'none';
}

btnInvitesMenu.onclick = () => {
    ContainerPartyInvites.style.display = 'flex';
}

FriendsReqExit.onclick = () => {
    ContainerFriendReq.style.display = 'none';
}

FriendsReqSent.onclick = () => {
    FriendsReqSent.classList.add("selected");
    FriendsReqInc.classList.remove("selected");
    FriendsReqSentContainer.style.display = 'block';
    FriendsReqIncContainer.style.display = 'none';
}

FriendsReqInc.onclick = () => {
    FriendsReqSent.classList.remove("selected");
    FriendsReqInc.classList.add("selected");
    FriendsReqSentContainer.style.display = 'none';
    FriendsReqIncContainer.style.display = 'block';
}

btnStartGame.onclick = () => {
    socket.emit('startSetupGame', undefined);
}

FriendReqSend.onclick = () => {
    if (FriendsReqInput.value != '' && FriendsReqInput.value !== sessionStorage.username) {
        httpRequest.sendPostRequest(`api/friend_add?sender=${sessionStorage.username}&password=${sessionStorage.password}&receiver=${FriendsReqInput.value}`, () => {
            socket.emit('forceFriendsMenuUpdate', FriendsReqInput.value);
            FriendsReqInput.value = '';
            loadFriends();
            loadFriendsMenu();
        }, {}, (error) => {
            console.log(error);
        });
    }
}

window.onclick = (element) => {
    let target = element.target;
    
    if(!(
            target.id == "ContainerFriendActions" ||
            target.classList.contains("ContainerFriend") ||
            target.parentNode.classList.contains("ContainerFriend") ||
            target.parentNode.classList.contains("ContainerFriendStatus")
        )) {
        ContainerFriendActions.style.visibility = 'hidden'
    }
}

for (let iAction = 0; iAction < FriendsAction.length; iAction++) {
    FriendsAction[iAction].onclick = (element) => {
        switch(iAction) {
            case 0 :
                socket.emit('newPartyInvite', friendActionTarget);
            break;
            
            case 1:
                httpRequest.sendGetRequest(`api/friend_remove?username=${sessionStorage.username}&password=${sessionStorage.password}&target=${friendActionTarget}`, 
                    (result) => {
                        socket.emit('forceFriendsUpdate', [friendActionTarget]);
                        loadFriends();
                    }, (error) => {
                        console.log(error);
                    }
                )
            break;
        }        
    }
}

inputSearchName.addEventListener("input", (event) => {    
    for (let iFriend = 0; iFriend < ContainerFriendsList.children.length; iFriend++) {
        let friendName = ContainerFriendsList.children[iFriend].children[0].textContent;
        ContainerFriendsList.children[iFriend].style.display = (friendName.includes(event.target.value)) ? 'block':'none';
    }
})

for (let iContainerMod = 0; iContainerMod < ContainerMods.length; iContainerMod++) {
    ContainerMods[iContainerMod].onclick = () => {
        socket.emit('changeGamemode', ContainerMods[iContainerMod].id);
    }
}

/* FUNCTIONS */
export function updateUserBalance() {
    httpRequest.sendGetRequest(`api/get_balance?username=${sessionStorage.username}&password=${sessionStorage.password}`, (result) => {        
        pUserBalance.textContent = `${JSON.parse(result)[0].balance}$`
    }, (error) => {
        console.log(error)
    })
}

function ChangeMainPage(id) {
    for (let iPage = 0; iPage < ContainerMainPages.length; iPage++) {
        ContainerMainPages[iPage].style.display = (ContainerMainPages[iPage].id == DictionaryPages[id]) ? "block" : "none";
    }
}

function loadFriendsMenu() {    
    httpRequest.sendGetRequest(`api/friend_requests?username=${sessionStorage.username}&password=${sessionStorage.password}`, (result) => {        
        let Requests = JSON.parse(result);
        let sentHTML = '', incomingHTML = '';

        for(let iSent = 0; iSent < Requests.sent.length; iSent++) {
            sentHTML = sentHTML.concat(
                `<div class="FriendReqItem">
                    <p>${Requests.sent[iSent]}</p>
                    <img id='${Requests.sent[iSent]}' class='friendSentCancel' src="images/reject.png">
                </div>`
            );
        }

        FriendsReqSentList.innerHTML = sentHTML;
        let btnSentReqs = document.getElementsByClassName('friendSentCancel');
        for(let iButton = 0; iButton < btnSentReqs.length; iButton++) {
            btnSentReqs[iButton].addEventListener('click', (element) => {
                httpRequest.sendGetRequest(`api/friend_cancel?username=${sessionStorage.username}&password=${sessionStorage.password}&cancel=${element.target.id}`,
                    (result) => {
                        socket.emit('forceFriendsMenuUpdate', element.target.id);
                        loadFriendsMenu();
                    }, (error) => {
                        console.log(error);
                    }
                )
            })  
        }

        for(let iIncoming = 0; iIncoming < Requests.incoming.length; iIncoming++) {
            incomingHTML = incomingHTML.concat(
                `<div class="FriendReqItem">
                    <p>${Requests.incoming[iIncoming]}</p>
                    <img id='${Requests.incoming[iIncoming]}_0' class='friendIncAction' src="images/reject.png">
                    <img id='${Requests.incoming[iIncoming]}_1' class='friendIncAction' src="images/accpet.png">
                </div>`
            );
        }

        FriendsReqIncList.innerHTML = incomingHTML;
        
        let btnIncReqs = document.getElementsByClassName('friendIncAction');
        for(let iButton = 0; iButton < btnIncReqs.length; iButton++) {
            btnIncReqs[iButton].addEventListener('click', (element) => {
                let id = element.target.id.split('_');
                httpRequest.sendGetRequest(`api/friend_action?username=${sessionStorage.username}&password=${sessionStorage.password}&sender=${id[0]}&action=${id[1]}`,
                    (result) => {
                        socket.emit('forceFriendsMenuUpdate', id[0]);
                        loadFriendsMenu();
                        loadFriends();
                    }, (error) => {
                        console.log(error);
                    }
                )
            })  
        }
    }, (error) => {
        console.log(error);
    });
}

function loadFriends() {
    httpRequest.sendGetRequest(`api/friends?username=${sessionStorage.username}&password=${sessionStorage.password}`,
        (result) => {
            let friends = JSON.parse(result);
            friends.push(sessionStorage.username);
            socket.emit('forceFriendsUpdate', friends);
        }, (error) => {
            console.log(error);
        }
    )
}

function updateFriendsList(friends, connectPlayers) {
    let friendsOnlineHTML = ' ', friendsOfflineHTML = '';

    for(let iFriend = 0; iFriend < friends.length; iFriend++) {
        let isFriendConnected = connectPlayers.includes(friends[iFriend]);

        if (isFriendConnected) {
            friendsOnlineHTML = friendsOnlineHTML.concat(`
                <div class="ContainerFriend">
                    <p class="pFriendName">${friends[iFriend]}</p>
                    <div class="ContainerFriendStatus">
                        <i class="material-symbols-rounded iFriendStatus"> radio_button_checked </i>
                        <span class="spanFriendStatus">Online</span>
                    </div>
                </div>
            `)
        } else {
            friendsOfflineHTML = friendsOfflineHTML.concat(`
                <div class="ContainerFriend">
                    <p class="pFriendName">${friends[iFriend]}</p>
                    <div class="ContainerFriendStatus offline">
                        <i class="material-symbols-rounded iFriendStatus"> radio_button_checked </i>
                        <span class="spanFriendStatus">Offline</span>
                    </div>
                </div>
            `)
        }
    } 

    ContainerFriendsList.innerHTML = friendsOnlineHTML.concat(friendsOfflineHTML);

    let FriendsContainers = document.getElementsByClassName('ContainerFriend');
    for (let iFContainer = 0; iFContainer < FriendsContainers.length; iFContainer++) {
        FriendsContainers[iFContainer].onclick = (element) => {
            let pos = FriendsContainers[iFContainer].getBoundingClientRect();
            ContainerFriendActions.style.visibility = 'visible'
            ContainerFriendActions.style.left = `${pos.x + 15}px`;
            ContainerFriendActions.style.top = `${pos.y + 55}px`;
            ContainerFriendActions.style.transform = `translate(-110%, -50%)`;

            ContainerFriendActions.children[0].style.display = [FriendsContainers[iFContainer].children[1].classList.contains('offline') ? 'none': 'flex']

            friendActionTarget = FriendsContainers[iFContainer].children[0].textContent;
        };
    }
}

function loadPartyInvites() {
    let partyInvitesHTML = ''
    for (let iPartyInvite = 0; iPartyInvite < arrPartyInvites.length; iPartyInvite++) {    
        partyInvitesHTML = partyInvitesHTML.concat(`
            <div class="InviteItem">
                <p>${arrPartyInvites[iPartyInvite]}</p>
                <img id="${arrPartyInvites[iPartyInvite]}_0" class="partyInviteAction" src="images/reject.png">
                <img id="${arrPartyInvites[iPartyInvite]}_1" class="partyInviteAction" src="images/accpet.png">
            </div>    
        `)
    }
    
    ContainerPartyInvites_List.innerHTML = partyInvitesHTML;

    let partyInvites = document.getElementsByClassName('partyInviteAction');
    for(let iButton = 0; iButton < partyInvites.length; iButton++) {
        partyInvites[iButton].addEventListener('click', (element) => {
            let id = partyInvites[iButton].id.split('_');
            let index = arrPartyInvites.indexOf(id[0]);

            if(id[1] == '1') {
                socket.emit('joinParty', id[0]);
            }

            arrPartyInvites.splice(index, 1);
            loadPartyInvites();
        })
    }
}

function updateLobby() {
    if(arrPartyMembers.length == 0) { // party is empty
        arrPartyMembers.push(sessionStorage.username);
    }
    
    let isPartyAdmin = arrPartyMembers[0] == sessionStorage.username;
    let lobbyHTML = '', iMember = 0;
        
    for(; iMember < arrPartyMembers.length; iMember++) {
        lobbyHTML = lobbyHTML.concat(`
            <div class="ContainerLobbyPlayer takenSpot">
                <p class="LobbyPlayerName">${arrPartyMembers[iMember]}</p>
                ${isPartyAdmin && iMember != 0 ? `<img id="${arrPartyMembers[iMember]}" class='btnKickMember' src="images/kick_Icon.png" alt="kick_Icon">` : ""}
            </div>
        `)
    }

    for(;iMember < 4; iMember++) {
        lobbyHTML = lobbyHTML.concat(`
            <div class="ContainerLobbyPlayer emptySpot">
            </div>
        `)
    }

    ContainerLobbySpots.innerHTML = lobbyHTML;

    let kickButtons = document.getElementsByClassName('btnKickMember');
    for(let iButton = 0; iButton < kickButtons.length; iButton++) {
        kickButtons[iButton].addEventListener('click', (element) => {
            socket.emit('kickParty', element.target.id);
        })
    }
}

loadUserInterface();
function loadUserInterface() {
    ChangeMainPage("btnPlay");
    pPlayerName.textContent = sessionStorage.username;
    updateUserBalance();
    loadFriendsMenu();
    loadPartyInvites();
    updateLobby();
}

/* SOCKET */

socket.on("connect", () => {
    loadFriends();
    
    socket.emit('newConnection', sessionStorage.username);

    socket.on('newPartyInvite', (user) => {
        if(!arrPartyInvites.includes(user)) {
            arrPartyInvites.push(user)
            loadPartyInvites();
        }
    });

    socket.on('updateLobby', (members) => {
        arrPartyMembers = members;
        updateLobby();
    });

    socket.on('updateGamemode', (gamemode) => { 
        if(gamemode == 'casual') {
            ContainerMods[0].classList.add("selected");
            ContainerMods[1].classList.remove("selected");
        } else if(gamemode == 'ranked') {
            ContainerMods[0].classList.remove("selected");
            ContainerMods[1].classList.add("selected");
        } else {
            ContainerMods[0].classList.remove("selected");
            ContainerMods[1].classList.remove("selected");
        }
    });

    socket.on('getMemberBalance', () => {
        httpRequest.sendGetRequest(`api/get_balance?username=${sessionStorage.username}&password=${sessionStorage.password}`,
            (result) => {        
                socket.emit('sendMemberBalance', JSON.parse(result)[0].balance);
            }, (error) => {
                console.log(error)
            })
    });

    socket.on('startGame', () => {
        window.location.href = '/game.html';
    });

    socket.on('updateFriends', (connectPlayers) => {
        httpRequest.sendGetRequest(`api/friends?username=${sessionStorage.username}&password=${sessionStorage.password}`,
            (result) => {
                updateFriendsList(JSON.parse(result), connectPlayers);
            }, (error) => {
                console.log(error);
            }
        )
    });

    socket.on('UpdateFriendMenu', () => {
        loadFriendsMenu();
    });
})