
/**
 * Created by tfitz237 on 12/13/2016.
 */
let music = {
    0:  document.createElement('audio'),
    1:  document.createElement('audio'),
    currentChannel: 0,
    currentSong: 0
};
let fire = firebase.initializeApp({
    apiKey: "AIzaSyBp1nsJyEp7W2y6n0eU5MVuuUaca-1sPXg",
    authDomain: "museic-9e936.firebaseapp.com",
    databaseURL: "https://museic-9e936.firebaseio.com",
    storageBucket: "museic-9e936.appspot.com",
    messagingSenderId: "113173276377"
});
fire.db = fire.database();
fire.store = fire.storage();
fire.files = fire.store.ref();
'use strict';
Vue.component('music-box', {
    template: `
 <div class="box">

 <ul class="playlist" v-show="showPlaylist" >
      Playlist:
      <transition-group name="fade" tag="li">
      <li v-for="(link, index) in links" v-bind:key="link">
        <a href="#" v-on:click="changeSong(index)">{{link.name}}</a>
    </li>
    </transition-group>
</ul>

 <div class="info">{{info}}</div>
 <div class="controls">
    <i class="material-icons" v-on:click="previous">fast_rewind</i>
    <i class="material-icons" v-on:click="playPause">{{playStatusIcon}}</i>
    <i class="material-icons" v-on:click="next">fast_forward</i>
    <i class="material-icons" v-on:click="showPlaylist = !showPlaylist">queue_music</i>
 </div>
 <input type="file" @change="fileChange" class="fileUpload" id="fileUploadInput"/>
 <button v-on:click="upload" class="uploadButton" v-show="!currentlyUploading">
     <i class="material-icons">file_upload</i>
     <i class="material-icons">play_arrow</i>
 </button>
 <span class="uploadButton moveUp" v-show="currentlyUploading">
    uploading...
</span>

 </div>
`,
    data: () => ({
        playStatusIcon: "play_circle_outline",
        info: "Song Artist - Song Title",
        currentSong: -1,
        playStatus: false,
        showPlaylist: false,
        currentlyUploading: false,
        uploadFile: "",
        links: []
    }),
    mounted: function() {
        fire.db.ref('music-metadata').on('child_added', (data) => {

            this.links.push(data.val());
            if(this.currentSong == -1) {
                this.currentSong = 0;
            }
        });
    },
    watch: {
        playStatus: function(val) {
            if (val) {
               music[music["currentChannel"]].play();
               this.playStatusIcon = "pause_circle_outline";
            } else {
               music[music["currentChannel"]].pause();
               this.playStatusIcon = "play_circle_outline";
            }
        },
        currentSong: function(val) {
            this.changeSong(val);
        }
    },
    methods: {
        playPause: function() {
            this.playStatus = !this.playStatus;
        },
        next: function() {
            this.currentSong = (this.currentSong < this.links.length - 1) ? this.currentSong + 1 : this.currentSong

        },
        previous: function() {
            this.currentSong = (this.currentSong > 0) ? this.currentSong - 1 : this.currentSong
        },
        changeSong: function(i) {
            let channel = (music["currentChannel"] == 0) ? 1 : 0;
            music[channel].src = this.links[i].downloadURLs[0];
            crossfade(music[0], music[1]).then(() => {
                music["currentChannel"] = channel;
                this.playStatusIcon = "pause_circle_outline";
                this.info = this.links[i].name;
            });
        },
        fileChange: function(e) {
            this.uploadFile = e.target.files[0] || e.dataTransfer.files[0];
            var ref = fire.files.child('mp3/'+this.uploadFile.name);
            this.currentlyUploading = true;
            ref.put(this.uploadFile).then((snapshot) => {
                this.currentlyUploading = false;
                clean(snapshot.metadata);
                let channel = (music["currentChannel"] == 0) ? 1 : 0;
                music[channel].src = snapshot.downloadURL;
                music["currentChannel"] = channel;
                this.info = this.uploadFile.name;
                this.playStatusIcon = "pause_circle_outline";
                fire.db.ref('music-metadata').push(snapshot.metadata);
                crossfade(music[0], music[1]);
            });
        },
        upload: function() {
            document.getElementById("fileUploadInput").click();
        }

    }


});
let app = new Vue({el: "#app"});
function clean(obj) {
    for (var propName in obj) {
        if (obj[propName] === null || obj[propName] === undefined) {
            delete obj[propName];
        }
    }
}

function fadeIn(audio) {
    audio.volume = 0;
    audio.play();
    let fadeInAudio = setInterval(function () {
        if (audio.volume  < 1.0) {
            audio.volume += 0.1;
        }
        if (audio.volume > 0.99) {
            clearInterval(fadeInAudio);

        }
    }, 200);
}
function fadeOut(audio) {
    return new Promise((resolve, reject) => {
        audio.volume = 0.99;
        let fadeOutAudio = setInterval(function () {
            if (audio.volume != 0.0 || audio.volume < 1.0) {
                audio.volume -= 0.1;
            }
            if (audio.volume < 0.1) {
                audio.volume = 0;
                clearInterval(fadeOutAudio);
                resolve();
            }
        }, 200);
    });

}

function crossfade(channel1, channel2) {
    return new Promise((resolve, reject) => {
        if (channel1.volume === 0.0) {
            fadeIn(channel1);
            fadeOut(channel2).then(() => resolve());
        } else {
            fadeOut(channel1).then(() => resolve());
            fadeIn(channel2);
        }
    });
}