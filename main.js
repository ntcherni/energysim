const e = require("express");
const plotlib = require('nodeplotlib');

class Appliance {
	constructor( _type, _watts1, _watts2, _ontime) {
		this.type = _type;
		this.watts1 = _watts1;
		this.watts2 = _watts2;
		this.ontime = _ontime;
		this.last = 0;
		this.max_times = 0;
		this.state = -1;
		this.watts = 0;
		this.prob = 0;
	}
	
	turnOn() {
		this.state = 1;
		this.watts = this.watts1;
	}
	turnOff() {
		this.state = -1;
		this.watts = 0;
	}
	turnStandby() {
		this.state = 0;
		this.watts = this.watts2;
	}
	setProb(prob) {
		this.prob = prob;
	}
}

class Agent {
	constructor(_watch) {
		this.watch = _watch;
		this.home = 1; 
	}
}

let probs = {
	'toaster' :  {
		'day' : {
			'morning' : 0.2,
			'afternoon' : 0.05,
			'evening' : 0.025,
			'night' : 0.01
		}
	},

	'heater' :  {
		'day' : {
			'morning' : 0.2,
			'afternoon' : 0.,
			'evening' : 0.025,
			'night' : 0.01
		}
	}

}

let daily = { 
	'toaster' : 2,
}

function setProbByHour(appl, t) {
	if(t >= 6 && t <= 11) appl.setProb(probs[appl.type]['day']['morning']);
	if(t >= 12 && t <= 18) appl.setProb(probs[appl.type]['day']['afternoon']);	
	if(t >= 18 && t <= 23) appl.setProb(probs[appl.type]['day']['evening']);	
	if(t >= 0 && t <= 6) appl.setProb(probs[appl.type]['day']['night']);	
}

function onTimeToSteps(ontime, step_duration) {
	if(ontime < step_duration) ontime = step_duration;
	return Math.ceil(ontime / step_duration); 
}

a = new Appliance('toaster', 10, 5, 5);
a = new Appliance('heater', 40, 10, 30);

agent = new Agent(5);

// each time step in minutes
step_duration = 5; 
steps_per_hour = 60 / step_duration;

a.max_times = 2; 

max_times = 1 + Math.floor(Math.random() * Math.floor(a.max_times));
on_steps = onTimeToSteps(a.ontime, step_duration);


console.log("on steps:", on_steps);

last_step_on = null;

//appl_max_times = 1;
console.log("max times:", max_times);

times_turned_on = 0;

// const plotData = 
// { 
// 	x: [], 
// 	y: [],
// 	type: 'line'
// }

const plotData = [
    {
        x: [], 
        y: [], 
		type: 'line'
	}
    ];


	max_times = 2;

total_watts = 0;
// One day in the life of a toaster
for(h = 0; h < 12; h++) {

	setProbByHour(a, h);

	console.log("[" + h + "]", a.prob);

	for(step = (h * steps_per_hour); step < ((steps_per_hour * h) + steps_per_hour); step++) 
	{

			if((step - last_step_on >= on_steps) || last_step_on == null) 
			{
				random_chance = Math.random().toFixed(2);
				if(times_turned_on < max_times) 
				{
					if(random_chance > (1.0 - a.prob)) 
					{
						/// ON
						a.turnOn();

						// add data to plot data
						plotData[0].x.push(step);
						plotData[0].y.push(a.watts1);

						// control for how many times appliance is turned on
						times_turned_on++;
						last_step_on = step;

						// debug
						console.log(step, random_chance, (1.0 - a.prob).toFixed(2),  "turning on");
						plotData[0].x.push(step);
						plotData[0].y.push(a.watts1);

					} 
					else 
					{ 
						// OFF
						console.log(step, random_chance, (1.0 - a.prob).toFixed(2), "off - keeping off");
						plotData[0].x.push(step);
						plotData[0].y.push(0);
					}
				} 
				else 
				{
					// OFF
					console.log(step, random_chance, (1.0 - a.prob).toFixed(2), "off - max times reached");
					plotData[0].x.push(step);
					plotData[0].y.push(0);
				}
			} else {
				console.log(step, random_chance, (1.0 - a.prob).toFixed(2), "keeping on");
			}

	}
	console.log("\n");
	// TODO: 
		// When appliance turned on, it stays turned on for on_steps
		// When the appliance reaches its on_steps after being turned
		// on, it is then decided whether to put it into standby
		// or off state by virtue of the Agent's 'watch' rating

		// ('watch') is a measure of how conscientous the Agent is 
		// about having good energy saving practices
}


for(i = 0; i < 12; i++) {


	setProbByHour(a, i);
	// turn appliance ON
	// * happens when chance is sufficient
	//

	// keep appliance ON 
	// * happens when last step on subtracted from current step count is not over on steps of appliance
	//

	// keep appliance OFF
	// * happens every step when max times per day is reached
	// ** chance does not need to be calculated here at all, simply keep off
	// 	  after last time appliance was on is over 
	// * happens when chance is not sufficient

	// turn appliance OFF
	// *happens when
	//
}

console.log(plotData);

	
plotlib.plot(plotData);
// TODO: create X and Y values for Plots 
// X values = Steps
// Y Values = Wattage (For now)
// Y values should be average wattage for the day
