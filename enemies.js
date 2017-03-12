const ENEMY_SHOOT_RANGE = 7;
const ENEMY_MELEE_RANGE = 1.3;

Declare_Any_Class( "Enemy", 
  { 
  	'construct': function( worldHandle, modelTransMat=mat4(), initHealth=3)
    {  
    	this.define_data_members(
    		{ world: worldHandle, model_transform: modelTransMat,position: mult_vec(modelTransMat,vec4(0,0,0,1)), 
			  velocity: vec4(0,0,0,0), heading:vec4(0,0,0,0), bool_reverseAnimate:false, limbAngle:0, moveSpeed: 1.5, 
			  alive: true, dying: false, health:initHealth, maxHealth: initHealth, autoAttackTimer:0.0, restTimer:0.0, 
			  lowHPThres: 0.35, midHPThres: 0.67, fallAngle: 0, fadeTimer: 1, fadeRate: 0, materials:{}, bfsTimer: 0.0
			});
    	// update speed for level 2
    	if(worldHandle.level == 2){
			// TODO: fit to accomodate multiple levels with formula
    		this.moveSpeed = 2.2;
    	}
    	else if (worldHandle.level == 3)
    		this.moveSpeed = 2.9;
    	else if (worldHandle.level >= 4)
    		this.moveSpeed = 3.6;

    	this.populate.apply( this, arguments );
    },
    'getVecToPlayer': function(){
	var discovered = []
	for(var i=this.world.xMin; i<=this.world.xMax;i++){
	    for(var j =this.world.yMin; j<this.world.yMax;j++){
		discovered.push(false);
	    }
	}


	var currentPos = {'position':vec4(this.position[0], this.position[1], 0, 1),'originVec':vec4(0,0,0,0)};
	if(this.world.checkPlayerCollision(currentPos.position,1.3)){
	    return vec4(0,0,0,0);
	}

	var queue = new Queue();
	var stepSize = 0.8;
	var immediateNeighbors = [{'position':vec4(currentPos.position[0],currentPos.position[1]+stepSize,0,1),'originVec':vec4(0,1,0,0)},
				  {'position':vec4(currentPos.position[0],currentPos.position[1]-stepSize,0,1),'originVec':vec4(0,-1,0,0)},
				  {'position':vec4(currentPos.position[0]-stepSize,currentPos.position[1],0,1),'originVec':vec4(-1,0,0,0)},
				  {'position':vec4(currentPos.position[0]+stepSize,currentPos.position[1],0,1),'originVec':vec4(1,0,0,0)}]/*,
				  {'position':vec4(currentPos.position[0]+stepSize,currentPos.position[1]+stepSize,0,1),'originVec':vec4(1,1,0,0)},
				  {'position':vec4(currentPos.position[0]+stepSize,currentPos.position[1]-stepSize,0,1),'originVec':vec4(1,-1,0,0)},
				  {'position':vec4(currentPos.position[0]-stepSize,currentPos.position[1]+stepSize,0,1),'originVec':vec4(-1,1,0,0)},
				  {'position':vec4(currentPos.position[0]-stepSize,currentPos.position[1]-stepSize,0,1),'originVec':vec4(-1,-1,0,0)}];*/
	for(var i=0;i<immediateNeighbors.length;i++){
	    if(this.world.checkBounds(immediateNeighbors[i].position) && !this.world.collidesWithWall(immediateNeighbors[i].position,1.2)){
		queue.enqueue(immediateNeighbors[i]);
	    }
	    discovered[immediateNeighbors[i].position[0]*(this.world.yMax-this.world.yMin)+immediateNeighbors[i].position[1]]=true;
	}
	while(!queue.isEmpty()){
	    var searchLeaf = queue.dequeue();
	    if(this.world.checkPlayerCollision(searchLeaf.position,1.5)){
		return searchLeaf.originVec;
	    }
	    var toDiscover = [{'position':vec4(searchLeaf.position[0],searchLeaf.position[1]+stepSize,0,1),'originVec':searchLeaf.originVec},
			      {'position':vec4(searchLeaf.position[0],searchLeaf.position[1]-stepSize,0,1),'originVec':searchLeaf.originVec},
			      {'position':vec4(searchLeaf.position[0]-stepSize,searchLeaf.position[1],0,1),'originVec':searchLeaf.originVec},
			      {'position':vec4(searchLeaf.position[0]+stepSize,searchLeaf.position[1],0,1),'originVec':searchLeaf.originVec}]/*,
			      {'position':vec4(searchLeaf.position[0]+stepSize,searchLeaf.position[1]+stepSize,0,1),'originVec':searchLeaf.originVec},
			      {'position':vec4(searchLeaf.position[0]+stepSize,searchLeaf.position[1]-stepSize,0,1),'originVec':searchLeaf.originVec},
			      {'position':vec4(searchLeaf.position[0]-stepSize,searchLeaf.position[1]+stepSize,0,1),'originVec':searchLeaf.originVec},
			      {'position':vec4(searchLeaf.position[0]-stepSize,searchLeaf.position[1]-stepSize,0,1),'originVec':searchLeaf.originVec}];*/
	    for(var i=0;i<toDiscover.length;i++){
		if(//!discovered[toDiscover[i].position[0]+','+toDiscover[i].position[1]] &&
		    !discovered[toDiscover[i].position[0]*(this.world.yMax-this.world.yMin)+toDiscover[i].position[1]] && 
		   this.world.checkBounds(toDiscover[i].position) && !this.world.collidesWithWall(toDiscover[i].position,1.2)){
		    queue.enqueue(toDiscover[i]);
		}
		//discovered[toDiscover[i].position[0]+','+toDiscover[i].position[1]]=true;
		discovered[toDiscover[i].position[0]*(this.world.yMax-this.world.yMin)+toDiscover[i].position[1]]=true; 
	    }
	}
	return vec4(0,0,0,0);
    },
    'update_strings': function( user_interface_string_manager )       // Strings that this displayable object (Animation) contributes to the UI:
      {
	  //TODO: may want to update UI with player info later on
        /*user_interface_string_manager.string_map["time"]    = "Animation Time: " + Math.round( this.shared_scratchpad.graphics_state.animation_time )/1000 + "s";
        user_interface_string_manager.string_map["animate"] = "Animation " + (this.shared_scratchpad.animate ? "on" : "off") ;*/
      },
    //begin navigation interface
    'moveForward': function(newState){
		this.velocity[1]=newState?this.moveSpeed:0;
    },
    'moveBackward': function(newState){
		this.velocity[1]=newState?-this.moveSpeed:0;
    },
    'moveLeft': function(newState){
		this.velocity[0]=newState?-this.moveSpeed:0;
    },
    'moveRight': function(newState){
		this.velocity[0]=newState?this.moveSpeed:0;
    },
    'recoil': function(newState){
	 	this.velocity=vec4(0,0,0,0);
  		this.restTimer = 0.3;                     // move backwards?!?!
  		//this.moveBackward(2);
    },
    //end navigation interface
    'changeHealth': function(deltaHealth){
	    this.health += deltaHealth;
	    if(this.health <= 0)
	    {
	    	this.dying = true;
	    	this.updateScore();
	    }
	       
    },
    'isDead': function(){
    	return this.dying;
    },
    'canAttack': function(delta_time) {
    	// This is empty as it will be overridden
    },
    'attack': function(delta_time) {
    	// This is empty as it will be overridden
    },
    'updateScore': function() {
		// This is empty as it will be overridden
    },
    'display': function(delta_time)
    {
		if(!this.alive) return;

		var graphics_state = this.world.shared_scratchpad.graphics_state;

		if(this.restTimer > 0) {
			this.restTimer -= delta_time/1000;
	  	}
    	else if (this.canAttack(delta_time))
    	{
	    	this.heading = normalize(subtract(this.world.player.position,this.position));
    		this.attack(delta_time);
	  	}
	  	else { //get vector to player
		    if(this.bfsTimer <= 0){
			var vec2Player = this.getVecToPlayer();
			this.bfsTimer = .5;
			if(length(vec2Player) != 0){
			    this.velocity = scale_vec(this.moveSpeed,normalize(vec2Player));
			}
			else{
			    this.velocity = vec4(-1,-1,0,0);
			}
		    }
		    else{
			this.bfsTimer -= delta_time/1000;
		    }
	    	//this.velocity = scale_vec(this.moveSpeed,normalize(subtract(this.world.player.position,this.position)));
	  	}

		var displacement = scale_vec(delta_time/1000, this.velocity);
		if(this.dying) {
			displacement[0]=0; displacement[1]=0;
		}

		//change heading of this enemy
		if(length(displacement) != 0) {
			this.heading = normalize(displacement.slice(0));
		}

		//calculate new position
		var newPosition = add(vec4(displacement[0],displacement[1],0,0),this.position);

		//make sure new position is valid; rest a few ticks if not, then try with a slightly different angle
		if(this.world.checkEnemyCollision(this,newPosition,1.2)!= -1)
		{
			restTimer = 0.5;
			displacement=vec4(0,0,0,0);
			//this.velocity=mult_vec(rotation(45,0,0,1), this.velocity);
			//displacement = scale_vec(delta_time/1000, this.velocity);
			//newPosition = add(vec4(displacement[0],displacement[1],0,0),this.position);
		}
   	        else if (this.world.collidesWithWall(newPosition,1.1) || !this.world.checkBounds(newPosition)) { 
	        }
		else {
			this.position=newPosition;
			this.model_transform = mult(translation(displacement[0],displacement[1],0),this.model_transform);
		}
	  
		//the member variable modelTransMat ONLY represents the (x,y) coordinates.
		//must still build compound shapes using it as a basis (i.e. from the ground up)
		var model_transform = this.model_transform; 

		var headingAngle = Math.acos(dot(this.heading,vec4(0,1,0,0))) * 180/Math.PI * (this.heading[0]>0?-1:1);

		if(this.dying) 
		{
			if(this.fallAngle < 90)
			this.fallAngle+=10;
			if (this.fallAngle == 90 && this.fadeTimer > 0) 
			{
				this.fadeRate += 0.01;
				model_transform = mult(model_transform, translation(0, 0, -this.fadeRate));  
				this.fadeTimer -= delta_time/1000 ;
			}
			else if(this.fadeTimer <= 0)
			{
				this.alive = false;
				return;
			}                         // -y, x gives us the axis where the enemy will fall in its normal's direction
				model_transform = mult(model_transform, rotation(-this.fallAngle, -this.heading[1], this.heading[0],0));   
		}

		//get body center and turn by heading angle
	  	var body_center = model_transform = mult(mult(model_transform, translation(0,0,1.5)),rotation(headingAngle,0,0,1));

		//body
		model_transform = mult(model_transform, scale(0.6, 0.55, 1));
		shapes_in_use.oriented_cube.draw(graphics_state, model_transform, this.materials.body);
	  
	  	model_transform = body_center;
	  
		//head
		model_transform = mult(model_transform, translation(0,0,0.8));
		model_transform = mult(model_transform, scale(0.35,0.35,0.35));    
		shapes_in_use.oriented_cube.draw(graphics_state, model_transform, this.materials.head);
	  
		//get angle offsets for leg animation
		var maxLimbAngle = 30;
		if (length(displacement) > 0) 
		{
			if (this.bool_reverseAnimate) 
			{
				//angle rate of change calculated based on movement speed
				this.limbAngle += this.moveSpeed/0.7*180/Math.PI*delta_time/1000
				if (this.limbAngle > maxLimbAngle)
				this.bool_reverseAnimate = !this.bool_reverseAnimate;
			}
			else 
			{
				this.limbAngle -= this.moveSpeed/0.7*180/Math.PI*delta_time/1000
				if(this.limbAngle < -maxLimbAngle) 
				{
					this.bool_reverseAnimate = !this.bool_reverseAnimate;
				}
			}
		}
		else
			this.limbAngle=0;

		// right leg	  
		model_transform = body_center;
		model_transform = mult(model_transform, translation(0.2,0,-0.7));               
		model_transform = mult(model_transform, rotation(-this.limbAngle, 1, 0, 0));
		model_transform = mult(model_transform, translation(0,0,-0.3));
		//always scale at end
		model_transform = mult(model_transform, scale(0.1,0.1,0.8));	  

		shapes_in_use.cube.draw(graphics_state, model_transform, this.materials.default);

		// left leg	  
		model_transform = body_center;
		model_transform = mult(model_transform, translation(-0.2,0,-0.7));               
		model_transform = mult(model_transform, rotation(this.limbAngle, 1, 0, 0));
		model_transform = mult(model_transform, translation(0,0,-0.3));
		//always scale at end
		model_transform = mult(model_transform, scale(0.1,0.1,0.8));	  

		shapes_in_use.cube.draw(graphics_state, model_transform, this.materials.default);

		// left arm
		model_transform = body_center;  
		model_transform = mult(model_transform, translation(-0.5,0,0.2));
		model_transform = mult(model_transform, rotation(-this.limbAngle, 1, 0, 0));
		model_transform = mult(model_transform, translation(0,0,-0.2));
		model_transform = mult(model_transform, rotation(20, 0, 1, 0));
		model_transform = mult(model_transform, scale(0.1,0.1,0.5));
		shapes_in_use.cube.draw(graphics_state, model_transform, this.materials.default);

		// right arm
		model_transform = body_center;
		model_transform = mult(model_transform, translation(0.5,0,0.2));
		model_transform = mult(model_transform, rotation(this.limbAngle, 1, 0, 0));
		model_transform = mult(model_transform, translation(0,0,-0.2));
		model_transform = mult(model_transform, rotation(-20, 0, 1, 0));
		model_transform = mult(model_transform, scale(0.1,0.1,0.5));
		shapes_in_use.cube.draw(graphics_state, model_transform, this.materials.default);

    	// health bar
    	var scaling_factor = 1 / this.maxHealth;
    	for(var i = 0; i < this.health; i++)
    	{
			model_transform = mult(this.model_transform, translation(-0.5+(scaling_factor/2), 0, 2.8));          // center the bar
			model_transform = mult(model_transform, translation(scaling_factor*i, 0, 0));               // translate each bar
			model_transform = mult(model_transform, scale(scaling_factor, 0.1, 0.1));                   // scale to proportion
			var hpPercent = this.health/this.maxHealth;
			if (hpPercent < this.lowHPThres)
				shapes_in_use.cube.draw(graphics_state, model_transform, this.materials.lowBar);
			else if (hpPercent < this.midHPThres)
				shapes_in_use.cube.draw(graphics_state, model_transform, this.materials.midBar);
			else
				shapes_in_use.cube.draw(graphics_state, model_transform, this.materials.fullBar);
    	}    
    }
});

Declare_Any_Class( "Normal_Enemy",
{
	'canAttack': function()
	{
		if (this.world.checkPlayerCollision(this.position, ENEMY_MELEE_RANGE)){
			return true;
		}
		return false;
	},
    'attack': function(delta_time) 
    {
		this.velocity = vec4(0,0,0,0);
		if (this.autoAttackTimer <= 0)
		{
	    	this.world.player.changeHealth(-1);
    		this.autoAttackTimer = 1/1.2; //attack speed for bots 
      	}
      	else {
	  		this.autoAttackTimer -= delta_time/1000;
      	}
    },
	'updateScore': function()
	{
		this.world.score += 1000;
	},
	'populate': function()
	{
	  	this.materials.head = new Material(Color(0,0,0,1),1,.4,0,10, "Visuals/enemy_head.jpg");
    	this.materials.body = new Material(Color(0,0,0,1),1,.4,0,10, "Visuals/enemy_body.jpg");
    	this.materials.fullBar = new Material(Color(0,0.7,0,1),1,0,0,10);
    	this.materials.midBar = new Material(Color(1,0.6,0,1),1,0,0,10);
    	this.materials.lowBar = new Material(Color(0.6,0,0,1),1,0,0,10);
    	this.materials.default = new Material(Color(0.1,0.1,0.1,1),0.1,0.6,0,20);		
	}
}, Enemy);

Declare_Any_Class( "Devil_Enemy", 
  { 
  	'canAttack': function() 
  	{
  		if (this.dying)
  			return false;

  		if (this.world.checkPlayerCollision(this.position, ENEMY_SHOOT_RANGE))
  			return true;
  		return false;
  	},
	'attack': function(delta_time) 
	{
		this.velocity = vec4(0,0,0,0);
		if (this.autoAttackTimer <= 0)
		{
			if (this.world.checkPlayerCollision(this.position, ENEMY_SHOOT_RANGE))
			{
				this.world.projectiles.push(new Enemy_Bullet(this.world, this.heading, translation(this.position[0],this.position[1],this.position[2]+1)));
			}
			else
			{
		    	this.world.player.changeHealth(-1);
			}
			this.autoAttackTimer = 1/1.2; //attack speed for bots 				
      	}
      	else {
	  		this.autoAttackTimer -= delta_time/1000;
      	}
    },
    'updateScore': function()
    {
    	this.world.score += 5000;
    },
	'populate': function()
	{
	  	this.materials.head = new Material(Color(0,0,0,1),1,.4,0,10, "Visuals/demon_head2.jpg");
    	this.materials.body = new Material(Color(0,0,0,1),1,.4,0,10, "Visuals/enemy_body.jpg");
    	this.materials.fullBar = new Material(Color(0,0.7,0,1),1,0,0,10);
    	this.materials.midBar = new Material(Color(1,0.6,0,1),1,0,0,10);
    	this.materials.lowBar = new Material(Color(0.6,0,0,1),1,0,0,10);
    	this.materials.default = new Material(Color(0.1,0.1,0.1,1),0.1,0.6,0,20);		
	}
  }, Enemy);

