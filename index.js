"use strict";

var argv = require('minimist')(process.argv.slice(2));
var scan_freq = argv["f"]
var gain = argv["g"]
var command=`rtl_power -f ${scan_freq} -g ${gain} -i 0.2 -1` // TODO make this take in command line args



const { exec } = require('child_process');
var updater;
var blessed = require('blessed')
, contrib = require('blessed-contrib')
, screen = blessed.screen()
, line = contrib.line(
    { style:
      { line: "yellow"
      , text: "green"
      , baseline: "black"
      , wholeNumbersOnly: false
    }
    , minY: 0
    , maxY: 0 
    , xLabelPadding: 6
    , xPadding: 5
    , label: command})
screen.append(line) //must append before setting data

var cleanExit = function() {  
    clearInterval(updater)
    console.log("Killing rtl_power")
    power_child.kill();
    power_child.kill('SIGKILL');
    setTimeout(function()
    {
        console.log("Tried to kill rtl_power")
        process.exit() 
    },1000)
    
};
process.on('SIGINT', cleanExit); // catch ctrl-c
process.on('SIGTERM', cleanExit); // catch kill



var power_child;

function updateGraph(){
    power_child = exec(command, (error, stdout, stderr) => {
        // if (error) {
        //     console.error(`exec error: ${error}`);
        //     console.error(stderr);
        //     return;
        // }
        var lines = stdout.split("\n")
        
        for (var index in lines){
            var stdoutline = lines[index];
            var x = []
            var y = []
        
            var data = stdoutline.trim().split(",");
            if (data.length > 4){
                var date = data.shift().trim();
                var time = data.shift().trim();
                var start_freq = parseInt(data.shift().trim());
                var stop_freq = parseInt(data.shift().trim());
                var step_freq = parseInt(data.shift().trim());
                var samples = parseInt(data.shift().trim());
                var current_freq = start_freq;
                for(var index in data){
                    // results[current_freq] = parseInt(data[index].trim());
                    x.push((current_freq/1000/1000).toFixed(3) + "M"); // should work out a better way
                    y.push(parseInt(data[index].trim()));
                    current_freq += step_freq;
                }

                
                var tempdBmArray = y // used to calculate graph bounds
                tempdBmArray.push(line.options.maxY )
                tempdBmArray.push(line.options.minY )
                //console.log(tempdBmArray)
                line.options.minY = Math.min.apply(null,tempdBmArray)
                line.options.maxY = Math.max.apply(null, tempdBmArray)
                var graphData = {x: x, y: y, title:"dBm"}
                line.setData([graphData])
                screen.render()
                break;
            }
        }
        
    });

}
updater = setInterval(updateGraph, 100);


screen.key(['escape', 'q', 'C-c'], function(ch, key) {
    cleanExit();
});


screen.render();