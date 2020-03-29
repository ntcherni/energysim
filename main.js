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

	arriveHome() {
		this.home = 1; 
	}

	leaveHome() {
		this.home = -1; 
	}
	
	goToSleep() {
		this.home = 0; 
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
			'evening' : 0.2,
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

function storeData(x_value, y_value) {
	data[0].x.push(x_value);
	data[0].y.push(y_value);
}

a = new Appliance('toaster', 10, 5, 5);
a = new Appliance('heater', 40, 10, 30);

agent = new Agent(5);

// --- setup for daily loop:

// empty data object array: 
const data = [
    {
        x: [], 
        y: [], 
		type: 'line'
	}
];


// initializing some variables: 
last_step_on = null;
times_turned_on = 0;
max_times_reached = false;

total_watts = 0;
average = 0;

// for step calculations: 
step_duration = 15; 
steps_per_hour = (60 / step_duration);

// set max times for the appliance for the day
a.max_times = 2; 
max_times_to_turn_on = 1 + Math.floor(Math.random() * Math.floor(a.max_times));
on_steps = onTimeToSteps(a.ontime, step_duration);

// remaking the above, seems messy
for(hour = 0; hour < 12; hour++) {

	setProbByHour(a, hour);

	console.log("[" + hour + "]", a.prob);

	start_step = hour * steps_per_hour + 1;
	
	for(step = start_step; step < (start_step + steps_per_hour); step++) {
		
		// go through each step in the hour

		if(a.state == -1 || a.state == 0) {
			// appliance is off or in standby

			if( !max_times_reached ) {
				random_chance = Math.random().toFixed(2);

				if( random_chance > (1.0 - a.prob) ) {
					// turn appliance on 
					a.turnOn();
					last_step_on = step;
					times_turned_on++; 
					if (times_turned_on >= max_times_to_turn_on ) max_times_reached = true;
				}
			}

		} else if (a.state == 1) {
			// appliance is on
			if(step - last_step_on >= on_steps) {
				// turn appliance off
				// decide whether to put into ON or STANDBY state
				// TODO: what is 'decide'?

				a.turnOff();
			} 
		}
		console.log(step, a.state);

		total_watts += a.watts;
		average = total_watts / step;
		storeData(step, average);
	}
}

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
	// * happens when chance is not sufficient to turn appliance on 

	// turn appliance OFF
	// * happens on the step when last step on subtracted from the step count 
	//

console.log(data);
	
plotlib.plot(data);

// TODO: create X and Y values for Plots 
// X values = Steps
// Y Values = Wattage (For now)
// Y values should be average wattage for the day
