"use strict";

const Fs = require("fs");
const Moment = require("moment");
 
const pickRule_re = /^(\d+)?(\D+)?:(\d+)?(\D+)?$/;
const pickDate_re = /^.*?(\d{4})(\d{2})(\d{2})/;

const now = (function() { // Immutable current moment.
    const t0 = Moment();
    return ()=>t0.clone();
})();

const periods = [...process.argv].slice(2)//{{{
    .map(function(arg) {
        try {
            var [
                period = 1,
                periodUnits = 'days',
                freq = 1,
                freqUnits = 'days',
            ] = arg.match(pickRule_re).slice(1);

            var retV = {
                label: arg,
                period: Moment.duration(Number(period), periodUnits).asMilliseconds(),
                freq: Moment.duration(Number(freq), freqUnits).asMilliseconds(),
            };


        } catch(err) {
            throw "Wrong argument format: " + arg;
        };

        if (retV.period <= 0) throw "Invalid period duration: " + period+periodUnits;
        if (retV.freq <= 0) throw "Invalid frequency duration: " + freq+freqUnits;

        return retV;
    })
    .sort((a, b)=>b.period-a.period)
;//}}}

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
            (periods[p] || {period: Infinity}).period
        )
    ) {
        // console.log ("------------------");
        // console.log(p, periods[p])
        // console.log ("------------------");
        // console.log("  ---> File:", files[f]);
        // console.log("  ---> Now:", now());
        // console.log("  ---> Period end:", now().subtract((periods[p] || {period: Infinity}).period));
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

    // console.log (Moment(files[f].date), now().subtract(periods[p].period));

};




files
    .filter(f=>!f.preserve)
    .map(f=>console.log(f.name))
;
