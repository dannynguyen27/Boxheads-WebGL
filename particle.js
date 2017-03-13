Declare_Any_Class( "Particle", 
  { 'construct': function( enemyId, timer, theta, height, size, modelTransMat=mat4() )
    {     
    	this.define_data_members(
    	{ 
			owner: enemyId, model_transform: modelTransMat, moveSpeed: 0.005, position: mult_vec(modelTransMat,vec4(0,0,0,1)),
			alive: true, materials:{},
		});

		this.timer = timer;
		this.theta = theta;
		this.height = height;
		this.size = size;
		
		var orientation = Math.acos(dot(this.owner.heading,vec4(0,1,0,0))) * 180/Math.PI * (this.owner.heading[0]>0?-1:1);

		var thetaInRadians = (theta+orientation) * Math.PI / 180;
		this.velocity_x = this.moveSpeed * Math.cos(thetaInRadians);
		this.velocity_y = -this.moveSpeed * Math.sin(thetaInRadians);
		this.velocity_z = this.moveSpeed * height;

		this.materials.body = new Material(Color(0.8,0,0,1.0),1.0,1,0, 10);

    },
    'update': function(delta_time)
    {
    	this.timer -= delta_time/1000;
    	if(this.timer > 0) {
    		this.position[0] += this.velocity_x * delta_time;
    		this.position[1] += this.velocity_y * delta_time;
    		this.position[2] += this.velocity_z * delta_time;
    	}
    	else{
    		this.alive = false;
    	}
    },
    //end navigation interface
    'display': function(delta_time)
	{
		if(!this.alive) return;
		var graphics_state = this.owner.world.shared_scratchpad.graphics_state;
		model_transform = translation(this.position[0], this.position[1], this.position[2]);
		model_transform = mult(model_transform, translation(this.owner.position[0], this.owner.position[1], 1));
		model_transform = mult(model_transform, scale(this.size, this.size, this.size));
		shapes_in_use.sphere.draw(graphics_state, model_transform, this.materials.body);
	}
});