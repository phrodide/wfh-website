var bootstrap = require('bootstrap');

const intervalId = setInterval(() => {
    var gameTime = "";
    const enterDateTime = new Date(2024, 9, 12, 18, 0, 0, 0);
    const Today = new Date();
    // tslint:disable-next-line:max-line-length
    const Todays_Date = (new Date(Today.getFullYear(), Today.getMonth(), Today.getDate(), Today.getHours(), Today.getMinutes(), Today.getSeconds())).getTime();
    const Target_Date = (enterDateTime).getTime();
    let Time_Left = Math.round((Target_Date - Todays_Date) / 1000);
    if (Time_Left < 0) {
      Time_Left = 0;
    }
    const days = Math.floor(Time_Left / (60 * 60 * 24));
    Time_Left %= (60 * 60 * 24);
    const hours = Math.floor(Time_Left / (60 * 60));
    Time_Left %= (60 * 60);
    const minutes = Math.floor(Time_Left / 60);
    Time_Left %= 60;
    const seconds = Time_Left;
    let dPs = 's';
    let hPs = 's';
    let mPs = 's';
    let sPs = 's';
    if (days === 1) {
      dPs = '';
    }
    if (hours === 1) {
      hPs = '';
    }
    if (minutes === 1) {
      mPs = '';
    }
    if (seconds === 1) {
      sPs = '';
    }

    gameTime = (days + ' day' + dPs + ' ');
    gameTime += (hours + ' hour' + hPs + ' ');
    gameTime += (minutes + ' minute' + mPs + ' and ');
    gameTime += (seconds + ' second' + sPs);

    try {
        document.getElementById("countdown_timer").innerText = gameTime;
    } catch (e)
    {
        //silently fail.
    }
  }, 1000);
