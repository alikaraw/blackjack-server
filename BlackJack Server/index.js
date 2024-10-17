let myServer = require('./my_server.js');
let myApi = require('./my_api.js');

let actions = {
    '/signup': myApi.signup,
    '/login': myApi.login,

    '/get_balance': myApi.getBalance,
    '/set_balance': myApi.setBalance, 
    
    '/daily_claim': myApi.dailyClaim,
    '/daily_time': myApi.dailyTime,
    
    '/weekly_claim': myApi.weeklyClaim,
    '/weekly_time': myApi.weeklyTime,
    '/weekly_check_streak': myApi.weeklyCheckStreak,
    
    '/friends' : myApi.friends,
    '/friend_add' : myApi.friendAdd,
    '/friend_requests' : myApi.friendRequests,
    '/friend_cancel' : myApi.friendCancel, 
    '/friend_action' : myApi.friendAction,
    '/friend_remove' : myApi.friendRemove,
};

myServer.createServer(actions, 8080, '.././BlackJack Client');