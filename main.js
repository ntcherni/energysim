const e = require("express");

class Appliance {
	constructor( _type, _watts1, _watts2, _ontime) {
		this.type = _type;
		this.watts1 = _watts1;
		this.watts2 = _watts2;
		this.ontime = _ontime;
		this.last = 0;
		this.times = 0;
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
	}
}

let daily = { 
	'toaster' : 2,
}

function setProbByHour(appl, t) {
	if(t >= 6 && t <= 11) {		
		appl.setProb(probs[appl.type]['day']['morning']);
	}
	if(t >= 12 && t <= 18) {
		appl.setProb(probs[appl.type]['day']['afternoon']);	
	}		
	if(t >= 18 && t <= 23) {
		appl.setProb(probs[appl.type]['day']['evening']);	
	}  
	if(t >= 0 && t <= 6) {
		appl.setProb(probs[appl.type]['day']['night']);	
	}  	
}

function onTimeToSteps(ontime, step_duration) {
	if(ontime < step_duration) ontime = step_duration;
	return Math.ceil(ontime / step_duration); 
}

appl = new Appliance('toaster', 10, 5, 30);
agent = new Agent(5);

// each time step in minutes
step_duration = 15; 
steps_hr = 60 / step_duration;

appl.times = 2; 
times = 0; 

// One day in the life of a toaster
for(hr = 0; hr < 24; hr++) {
	setProbByHour(appl, hr);
	console.log("["+hr+"]", appl.prob);  
	on_steps = onTimeToSteps(appl.ontime, step_duration);
	for(i = hr * steps_hr; i < (steps_hr * hr) + steps_hr; i++) {
		random = Math.random().toFixed(2);
		if(times < appl.times) {
			if(random > (1.0 - appl.prob)) {
				appl.turnOn();
				times++;
				console.log(i, random, (1.0 - appl.prob).toFixed(2),  "turning on");
				last_on = i;
			} else { 
				console.log(i, random, (1.0 - appl.prob).toFixed(2));
			}
		} else {
			console.log(i, random, (1.0 - appl.prob).toFixed(2));
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
