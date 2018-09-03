"use strict";

const Fs = require("fs");
const Moment = require("moment");
 
const splitPath_re = /^(.*\/)?(.*)$/;
const pickRule_re = /^(\d+)?(\D+)?:(\d+)?(\D+)?$/;
const pickDate_re = /^.*?(\d{4})(\d{2})(\d{2})/;

const now = (function() { // Immutable current moment.
    const t0 = Moment();
    return ()=>t0.clone();
})();


const periods = (function(pSpec){//{{{
    let lastPeriod = 0;
    let lastFreq = 0;
    return pSpec
        .map(function(arg) {
            try {
                var [
                    age = 1,
                    periodUnits = 'days',
                    freq = 1,
                    freqUnits = 'days',
                ] = arg.match(pickRule_re).slice(1);

                var retV = {
                    label: arg,
                    age: Moment.duration(Number(age), periodUnits).asMilliseconds(),
                    freq: Moment.duration(Number(freq), freqUnits).asMilliseconds(),
                };


            } catch(err) {
                throw "Wrong argument format: " + arg;
            };

            if (retV.age <= 0) throw "Invalid period age: " + arg;
            if (retV.age <= lastPeriod) throw "Period age should be greater than previous one: " + arg;
            if (retV.freq <= 0) throw "Invalid period frequency: " + arg;
            if (retV.freq <= lastFreq) throw "Period frequency should be greater than previous one: " + arg;

            lastPeriod = retV.age;
            lastFreq = retV.freq;

            return retV;
        })
        .sort((a, b)=>b.age-a.age) // Reverse (think backward, but do process forwards)
    ;
})([...process.argv].slice(2));//}}}

const files = (function(stdin) {//{{{
    const files = {};

    Fs.readFileSync(stdin)
        .toString()
        .trim()
        .split("\n")
        .map(function(fullPath) {

            try {
                const [path = "", name] = fullPath.match(splitPath_re).slice(1);

                if (files[path] === undefined) files[path] = [];

                const date = new Date(
                    name.match(pickDate_re)
                        .slice(1, 4)
                        .join("-")
                );

                files[path].push({
                    name,
                    date,
                });
            } catch (err) {
                console.error("Wrongly formatted file name: " + fullPath);
            };

        })
    ;

    for (let f in files) files[f]=files[f].sort((a,b)=>a.date - b.date);

    return files;

})(0);//}}}

function bapuli (files, path) {//{{{
    var last = null;
    var deadline = null;
    let p = 0;

    function preserve(file, why) {//{{{
        ///console.log ("PRESERVING:", file.name, "("+why+")");
        if (file.name.match(/.*?DemoFile_19760318_bkp.tar.gz/)) {
            console.log ("PRESERVING:", file.name, "("+why+")");
            console.log ("last:", last);
            console.log ("deadline:", deadline);
        };
        file.preserve = true;
        last = file.date;
        deadline = Moment(last).add((periods[p] || {freq: 0}).freq);
    };//}}}

    for (let f = 0; f < files.length; f++) {

        let nf = f+1; // Next

        // Raise period:
        while (
            Moment(files[f].date)
            > now().subtract(
                (periods[p] || {age: Infinity}).age
            )
        ) p++;

        let reason = false;
        if (
            // Always preserve oldest.
            last === null
        ) {
            reason = "The very first";
        } else if (
            // Preserve all earlier from first period.
            p >= periods.length
        ) {
            reason = "Earlier from first period";
        } else if (
            // Deadline.
            nf >= files.length // Last file
            || Moment(files[nf].date) > deadline // Last in term
        ) {
            reason = "Deadline";
        };

        if (reason) preserve(files[f], reason);

    };


    files
        .filter(f=>!f.preserve)
        .map(f=>console.log(path+f.name))
    ;

};//}}}


// Main:
for (let path in files) {
    bapuli (files[path], path);
};

