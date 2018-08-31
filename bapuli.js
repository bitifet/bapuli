"use strict";

const Fs = require("fs");
const Moment = require("moment");
 
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

const files = Fs.readFileSync(0)//{{{
    .toString()
    .trim()
    .split("\n")
    .map(function(name) {
        const date = new Date(
            name.match(pickDate_re)
                .slice(1, 4)
                .join("-")
        );

        return {
            name,
            date,
        };

    })
    .sort((a,b)=>a.date - b.date)
;//}}}

function preserve(file, why) {//{{{
    ///console.log ("PRESERVING:", file.name, "("+why+")");
    file.preserve = true;
    last = file.date;
    deadline = Moment(last).add((periods[p] || {freq: 0}).freq);
};//}}}



var last = null;
var deadline = null;

let p = 0;


for (let f = 0; f < files.length; f++) {

    let nf = f+1; // Next
    let periodRaised = false;

    // Raise period:
    while (
        Moment(files[f].date)
        > now().subtract(
            (periods[p] || {age: Infinity}).age
        )
    ) {
        // console.log ("------------------");
        // console.log(p, periods[p])
        // console.log ("------------------");
        // console.log("  ---> File:", files[f]);
        // console.log("  ---> Now:", now());
        // console.log("  ---> Period end:", now().subtract((periods[p] || {age: Infinity}).age));
        // console.log("  ---> Current:", Moment(files[f].date));
        // console.log ("------------------");

        p++;
        periodRaised = true;
    };

    let reason = false;
    if (
        // Always preserve oldest.
        last === null
    ) {
        reason = "The very first";
        periodRaised = true;
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

    if (periodRaised) {
        ///console.log("  * New Period:", p, periods[p]);
    };

    if (reason) preserve(files[f], reason);

    // console.log (Moment(files[f].date), now().subtract(periods[p].age));

};




files
    .filter(f=>!f.preserve)
    .map(f=>console.log(f.name))
;
