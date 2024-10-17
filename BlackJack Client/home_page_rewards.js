import * as httpRequest from './http/http_client.js';
import { updateUserBalance } from './home_page.js'

let btnClaimDaily = document.getElementById("btnClaimDaily");
let spanNextDailyReward = document.getElementById("spanNextDailyReward");

let divWeekylyRewardItems = document.getElementsByClassName("WeeklyRewardItem");
let spanStreakDay = document.getElementById("spanStreakDay");
let spanWeeklyMultiplier = document.getElementById("spanWeeklyMultiplier");
let spanNextWeeklyReward = document.getElementById("spanNextWeeklyReward");

const WeeklyRewards = [
    250, // day 1
    500,
    750,
    1000,
    1250,
    1250,
    1500, // day 7
];

btnClaimDaily.onclick = () => {
    httpRequest.sendGetRequest(`api/daily_claim?username=${sessionStorage.username}&password=${sessionStorage.password}`, (e) => {
        btnClaimDaily.disabled = true;
        updateUserBalance();
        checkDailyReward();
    }, (error)=>{
        console.log(error);
    })
};

let checkDailyReward = () => {
    httpRequest.sendGetRequest(`api/daily_time?username=${sessionStorage.username}&password=${sessionStorage.password}`, (result) => {
        let lastDaily = Date.parse(JSON.parse(result).last_daily_reward);
        let lastDailyPlusDay = lastDaily + (1 * 24 * 60 * 60 * 1000);
        let currentTime = new Date().getTime();
        
        if(lastDailyPlusDay > currentTime) {
                btnClaimDaily.disabled = true;
                let timer = setInterval(() => {
                let distance = lastDailyPlusDay - new Date().getTime();

                let hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                let seconds = Math.floor((distance % (1000 * 60)) / 1000);

                spanNextDailyReward.textContent = `${hours} Hours, ${minutes} Minutes & ${seconds} seconds`;

                if(distance < 0) {
                    clearInterval(timer);
                    checkDailyReward();
                }
            },1000);
        } else {
            btnClaimDaily.disabled = false;
            spanNextDailyReward.textContent = 'Now';
        }
    }, (error)=>{
        console.log(error);
    })
}

let claimWeeklyReward = () => {
    httpRequest.sendGetRequest(`api/weekly_claim?username=${sessionStorage.username}&password=${sessionStorage.password}`, (e) => {
        updateUserBalance();
        updateWeeklyLayout();
    }, (error)=>{
        console.log(error);
    })
}

let updateWeeklyLayout = () => {
    httpRequest.sendGetRequest(`api/weekly_time?username=${sessionStorage.username}&password=${sessionStorage.password}`, (result) => {
        // set elements to correct phase
        let jsonResults = JSON.parse(result);
        let weekly_streak = (jsonResults.weekly_streak) == null ? '0' : jsonResults.weekly_streak;
        let weeklyMultiplier = Math.floor(weekly_streak/7) * 0.5;

        let lastWeekly = new Date(jsonResults.last_weekly_reward).getTime();
        let lastWeeklyPlusOneDay = lastWeekly + (1 * 24 * 60 * 60 * 1000);
        let currentTime = new Date().getTime();

        spanStreakDay.textContent = `${weekly_streak} Day${(weekly_streak == 1) ? '':'s'}`;
        spanWeeklyMultiplier.textContent = `${weeklyMultiplier}x`;
        
        for(let iItem = 0; iItem < divWeekylyRewardItems.length; iItem++) {            
            divWeekylyRewardItems[iItem].children[0].children[0].textContent = `Day ${weeklyMultiplier * 2 * 7 + iItem + 1}`//p days
            divWeekylyRewardItems[iItem].children[0].children[1].textContent = `(${(weeklyMultiplier + 1) * WeeklyRewards[iItem]}$)`//p reward

            if(iItem > weekly_streak % 7) { // still yet to claim reward
                divWeekylyRewardItems[iItem].children[2].style.display = 'block'; // blocked item container
            } else if(iItem < weekly_streak % 7) { // already claimed
                divWeekylyRewardItems[iItem].children[2].style.display = 'block'; // blocked item container 
                divWeekylyRewardItems[iItem].children[2].style.opacity = 0.75; // blocked item container
                divWeekylyRewardItems[iItem].children[2].children[0].style.display = 'none'; // image in blocked item container
            } else { // current reward to claim
                if (lastWeeklyPlusOneDay > currentTime) {
                    divWeekylyRewardItems[iItem].children[2].style.display = 'block'; // blocked item container
                } else {
                    divWeekylyRewardItems[iItem].classList.add('currentReward');
                    divWeekylyRewardItems[iItem].onclick = claimWeeklyReward;
                }
            }
        }
        
        if(lastWeeklyPlusOneDay > currentTime) {
                let timer = setInterval(() => {
                let distance = lastWeeklyPlusOneDay - new Date().getTime();

                let hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                let seconds = Math.floor((distance % (1000 * 60)) / 1000);

                spanNextWeeklyReward.textContent = `${hours} Hours, ${minutes} Minutes & ${seconds} seconds`;

                if(distance < 0) {
                    clearInterval(timer);
                    checkDailyReward();
                }
            },1000);
        } else {
            spanNextWeeklyReward.textContent = 'Now';
        }
    }, (error) => {
        console.log(error);
    });
}

let checkWeeklyReward = () => {
    httpRequest.sendGetRequest(`api/weekly_check_streak?username=${sessionStorage.username}&password=${sessionStorage.password}`, (result) => {
        updateWeeklyLayout();
    }, (error) => {
        console.log(error)
        updateWeeklyLayout();
    })
}

checkDailyReward();
checkWeeklyReward();