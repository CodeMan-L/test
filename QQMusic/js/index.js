/* 解决click的300ms延迟问题 */
FastClick.attach(document.body);

const musicbtn = document.querySelector('.music_btn');
const wrapper = document.querySelector('.wrapper');
const progress = document.querySelector('.progress');
const curTime = progress.querySelector('.cur_time');
const totalTime = progress.querySelector('.total_time');
const progCur = progress.querySelector('.prog_cur');
const myAudio = document.querySelector('.myAudio');
let lyricList = [],
    prevLyric = null,
    num = 0,
    PH=0;
let autoTimer = null;

// 获取数据
const queryData = function queryData() {
    return new Promise(resolve => {
        let xhr = new XMLHttpRequest;
        xhr.open('get', 'json/newMusic.json');
        xhr.onreadystatechange = function () {
            let { readyState, status, responseText } = xhr;
            if (xhr.readyState === 4 && xhr.status === 200) {
                let data = JSON.parse(responseText);
                //请求成功:让实例状态为成功，值是获取的歌词（字符串）
                resolve(data.lyric);
            }
        }
        xhr.send();
    })
}


const binding = function binding(lyric) {
    // 歌词解析
    let data = [];
    lyric.replace(/\[(\d+):(\d+).(?:\d+)\]([^\n]+)(?:\n)?/g, (_,minutes, seconds, text) => {
        data.push({ minutes, seconds, text });
    });
    // 歌词绑定
    let str = '';
    data.forEach(item => {
        let { minutes, seconds, text } = item;
        str += `<p minutes="${minutes}"seconds="${seconds}"> ${text}`;
    });
    wrapper.innerHTML = str;
    lyricList = Array.from(wrapper.querySelectorAll('p'));
    PH= lyricList[0].offsetHeight;

}

// 暂停的方法
const autoPause = function autoPause() {
    myAudio.pause();
    musicbtn.classList.remove('move');
    clearInterval(autoTimer);
    autoTimer = null;
}

const format = function format(time) {
    time = +time;
    let obj = {
        minutes: '00',
        seconds: '00'
    };
    if (time) {
        let m = Math.floor(time / 60);
        s = Math.round(time - m * 60);
        obj.minutes = m < 10 ? '0' + m :""+m;
        obj.seconds = s < 10 ? '0' + s :""+s;
    }
    return obj;
}

/*歌词滚动&进度条处理  */
const handleLyric = function handleLyric() {
    let { duration, currentTime } = myAudio,
    a = format(currentTime);
    for (let i = 0; i < lyricList.length; i++) {
        const item = lyricList[i];
        let minutes = item.getAttribute('minutes');
        let seconds = item.getAttribute('seconds');
        if (minutes==a.minutes&&seconds== a.seconds) {
            if (prevLyric) prevLyric.className = ''
            item.className = 'active';
            num=i;
            prevLyric = item;
            break;
        }
    }
    //歌词移动
    if (num>3) {
        wrapper.style.top = `${-(num-4)*PH}px`;
    }
    //音乐播放结束
    if (currentTime>=duration) {
        wrapper.style.top = '0px';
        if (prevLyric) prevLyric.className = '';
        prevLyric=null;
        num=0;
        autoPause();
    }
}
const handleProgress = function handleProgress() {
    let { duration, currentTime } = myAudio,
        a = format(duration),
        b = format(currentTime);
    if (currentTime >= duration) {
        //播放结束
        curTime.innerHTML = `00:00`;
        progCur.style.width = `0%`;
        autoPause();
        return;
    }
    curTime.innerHTML = `${b.minutes}:${b.seconds}`;
    totalTime.innerHTML = `${a.minutes}:${a.seconds}`;
    progCur.style.width = `${currentTime / duration * 100}%`;

}
$sub.on('playing', handleLyric);
$sub.on('playing', handleProgress);

// 控制播放和暂停的
const handle = function handle() {
    musicbtn.style.opacity = 1;
    musicbtn.addEventListener('click', function () {
        if (myAudio.paused) {
            //当前是暂停的，我们让其播放
            myAudio.play();
            musicbtn.classList.add('move');
            if (autoTimer === null) {
                autoTimer = setInterval(() => {
                    $sub.emit('playing');
                }, 1000)
            }
            return;
        }
        //当前是播放的，我们让其暂停
        autoPause();
    });
};

//切换页卡
document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
        clearInterval(autoTimer);
        autoTimer = null;
    };
    if (autoTimer === null) {
        autoTimer = setInterval(() => {
            $sub.emit('playing');
        }, 1000)
    };
});

queryData().then(value => {
    binding(value);
    handle();
});
