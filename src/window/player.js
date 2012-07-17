/**
 * Player: 0.3.4
 */
"use strict";

var timbre = require("../timbre");
var window = {};
// __BEGIN__

var WebKitPlayer = function(sys) {
    
    this.ctx = new webkitAudioContext();
    var samplerate = this.ctx.sampleRate;
    
    this.setup = function() {
        timbre.fn._setupTimbre(samplerate);
        this.streamsize = timbre.streamsize;
        
        if (timbre.samplerate === samplerate) {
            this.onaudioprocess = function(e) {
                var inL, inR, outL, outR, i;
                sys.process();
                
                inL  = sys.L;
                inR  = sys.R;
                outL = e.outputBuffer.getChannelData(0);
                outR = e.outputBuffer.getChannelData(1);
                for (i = outL.length; i--; ) {
                    outL[i] = inL[i];
                    outR[i] = inR[i];
                }
            };
        } else {
            var dx = timbre.samplerate / samplerate;
            this.onaudioprocess = function(e) {
                var inL, inR, outL, outR, outLen;
                var streamsize, x, prevL, prevR;
                var index, delta, x0, x1, xx;
                var i, imax;
                
                inL = sys.L;
                inR = sys.R;
                outL = e.outputBuffer.getChannelData(0);
                outR = e.outputBuffer.getChannelData(1);
                outLen = outL.length;
                
                streamsize = this.streamsize;
                x = this.x;
                prevL = this.prevL;
                prevR = this.prevR;
                for (i = 0, imax = outL.length; i < imax; ++i) {
                    if (x >= streamsize) {
                        sys.process();
                        x -= streamsize;
                    }
                    
                    index = x|0;
                    delta = 1- (x - index);
                    
                    x1 = inL[index];
                    xx = (1.0 - delta) * prevL + delta * x1;
                    prevL = x1;
                    outL[i] = xx;
                    
                    x1 = inR[index];
                    xx = (1.0 - delta) * prevR + delta * x1;
                    prevR = x1;
                    outR[i] = xx;
                    
                    x += dx;
                }
                this.x = x;
                this.prevL = prevL;
                this.prevR = prevR;
            }.bind(this);
        }
        
        return this;
    };
    
    this.on = function() {
        this.x = this.streamsize;
        this.prevL = this.prevR = 0;
        this.node = this.ctx.createJavaScriptNode(sys.streamsize, 1, sys.channels);
        this.node.onaudioprocess = this.onaudioprocess;
        this.node.connect(this.ctx.destination);
    };
    this.off = function() {
        this.node.disconnect();
        this.node = null;
    };
    
    return this;
};

var MozPlayer = function(sys) {
    this.timer = new MutekiTimer();
    
    this.setup = function() {
        timbre.fn._setupTimbre(44100);
        
        this.audio = new Audio();
        this.audio.mozSetup(timbre.channels, timbre.samplerate);
        timbre.samplerate = this.audio.mozSampleRate;
        timbre.channels   = this.audio.mozChannels;
        
        this.written  = 0;
        this.interleaved = new Float32Array(timbre.streamsize * timbre.channels);
        
        this.onaudioprocess = function() {
            
            if (this.written > this.audio.mozCurrentSampleOffset() + 16384) {
                return this;
            }
            
            var interleaved = this.interleaved;
            this.audio.mozWriteAudio(interleaved);
            sys.process();
            
            var inL = sys.L, inR = sys.R;
            var i = interleaved.length, j = inL.length;
            
            while (j--) {
                interleaved[--i] = inR[j];            
                interleaved[--i] = inL[j];
            }
            this.written += interleaved.length;
        }.bind(this);
        
        return this;
    };
    
    this.on = function() {
        this.written  = 0;
        this.timer.setInterval(this.onaudioprocess, 20);
    };
    
    this.off = function() {
        var interleaved = this.interleaved;
        for (var i = interleaved.length; i--; ) {
            interleaved[i] = 0.0;
        }
        this.timer.clearInterval();
    }
    
    return this;
};

if (typeof webkitAudioContext === "function") {
    // Chrome
    timbre.env = "webkit";
    timbre.sys.bind(WebKitPlayer);
} else if (typeof webkitAudioContext === "object") {
    // Safari
    timbre.env = "webkit";
    timbre.sys.bind(WebKitPlayer);
} else if (typeof Audio === "function" && typeof (new Audio).mozSetup === "function") {
    // Firefox
    timbre.env = "moz";
    timbre.sys.bind(MozPlayer);
}

// __END__
