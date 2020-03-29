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

	changeHabits(new_watch) {
		this.watch = new_watch;
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

let probabilities = {
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

function setProbByHour(appl, t) {
	if(t >= 6 && t <= 11) appl.setProb(probabilities[appl.type]['day']['morning']);
	if(t >= 12 && t <= 18) appl.setProb(probabilities[appl.type]['day']['afternoon']);	
	if(t >= 18 && t <= 23) appl.setProb(probabilities[appl.type]['day']['evening']);	
	if(t >= 0 && t <= 6) appl.setProb(probabilities[appl.type]['day']['night']);	
}

function onTimeToSteps(ontime, step_duration) {
	if(ontime < step_duration) ontime = step_duration;
	return Math.ceil(ontime / step_duration); 
}

function storeData(x_value, y_value) {
	data[0].x.push(x_value);
	data[0].y.push(y_value);
}

a = new Appliance('heater', 100, 10, 30);

agent = new Agent(0.5);
agent.changeHabits(0.5);

// ---- setup for daily loop:

// -- variables for all days:

// empty data object array: 
const data = [
    {
        x: [], 
        y: [], 
		type: 'line'
	}
];

// appliance daily constants: 
a.max_times = 4; 

// for step calculations: 
step_duration = 5; 
steps_per_hour = (60 / step_duration);
steps_per_day = 24 * steps_per_hour;

// for average calculation: 
total_watts = 0;
average = 0;

// -- initializing some variables for 1 day: 
last_step_on = null;
times_turned_on_day = 0;
max_times_reached_day = false;

// set max times for the appliance for the day
max_times_to_turn_on = 1 + Math.floor(Math.random() * Math.floor(a.max_times));

on_steps = onTimeToSteps(a.ontime, step_duration);
start_step = 0;

total_hours = 0; 

days = 200;

// TODO: 
// * Decide on final data model for JSON output
// ** Current data format is total watt usage per day
// * Store array of appliances in rooms 
// * Be able to display: 
// ** Combined data for all appliances/rooms
// ** Specific room data
// ** Specific appliances data
// Later...
// * Web interface for creating a set of initial condtions
// * Real-time simulation of 1 time step per second
// * Add multipliers for various other factors: 
// ** Month
// ** Day of the week
// ** Type of agent
// *** I.e. Student, Employed person, Unemployed, etc... 
// ** Outside temperature

// go through as many days as needed 
for (day = 0; day < days; day++) { 

	// Agent undergoes a change in habits halfway through
	// the higher the value input into changeHabits function,
	// the higher the likelihood that the agent will turn off the appliance
	// instead of simply putting it into standby mode 
	if(day == 0 ) { agent.changeHabits(0.1); }
	if(day == 150) { agent.changeHabits(0.9); }

	// simulating a "vacation"
	if(day == 100) { agent.leaveHome(); }
	if(day == 150) { agent.arriveHome(); }
	
	console.log("day [" + day+ "]");

	// go through one day 
	for(hour = 0; hour < 24; hour++) {

		// weight the on states by what hour it is 
		// *this only matters if zooming in to the day
		setProbByHour(a, hour);

		//console.log("hour [" + hour + "]");

		start_step += steps_per_hour;

		//console.log("start step", start_step)
		
		for(step = start_step; step < (start_step + steps_per_hour); step++) {
			// go through each step in the hour

			if(a.state == -1 || a.state == 0) {
				// appliance is off or in standby

				if( agent.home == 1 && !max_times_reached_day ) {
					random_chance = Math.random().toFixed(2);

					if( random_chance > (1.0 - a.prob) ) {
						// turn appliance on 
						a.turnOn();
						last_step_on = step;
						times_turned_on_day++; 
						if (times_turned_on_day >= max_times_to_turn_on ) max_times_reached_day = true;
					}
				}

			} else if (a.state == 1) {
				// appliance is on
				if(step - last_step_on >= on_steps) {
					// turn appliance off or into standby

					if( Math.random() > (1.0 - agent.watch) ) {
						console.log("turning off");
						a.turnOff();
					} else {
						console.log("turning standby");
						a.turnStandby();
					}

				} 
			}
			//	console.log(step, a.state);

			// reached end of hour
			total_watts += a.watts;
			total_hours++; 
		}
	}

	// reached end of day

	console.log("day", day, "this day's total watts: ", total_watts);
	console.log("total steps:", steps_per_day);	
	console.log("\n");

	average = total_watts / steps_per_day;

	storeData(day, total_watts);

	// re-initializing some variables for 1 day: 
	last_step_on = null;
	times_turned_on_day = 0;
	max_times_reached_day = false;

	total_watts = 0;

	// set max times for the appliance for the day
	max_times_to_turn_on = 1 + Math.floor(Math.random() * Math.floor(a.max_times));
}

// finish up, display plot
// console.log(data);

var layout = {
	title: 'Simulation of Appliance Energy Usage for "' + a.type + '"',
	xaxis: {
	  title: 'Day',
	},
	yaxis: {
	  title: 'Watts Used Per Day',
	}
  };

plotlib.plot(data, layout);