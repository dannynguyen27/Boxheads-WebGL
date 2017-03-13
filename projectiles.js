const PROJECTILE_HITBOX = 0.6;
const ENEMY_BULLET_DAMAGE = 2;

Declare_Any_Class( "Projectile", 
  { 'construct': function( worldHandle, shooterHeading, modelTransMat=mat4())
    {     
    	this.define_data_members(
    	{ 
			world: worldHandle, model_transform: modelTransMat,position: mult_vec(modelTransMat,vec4(0,0,0,1)), 
			moveSpeed: 10, velocity: scale_vec(15,shooterHeading), alive: true, headingAngle: 0, materials:{}
		});
    	this.headingAngle = Math.acos(dot(shooterHeading,vec4(0,1,0,0))) * 180/Math.PI * (shooterHeading[0]>0?-1:1);
		this.position[2]=0;
		this.populate.apply( this, arguments );
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
    'hasHitActor': function()
    {
    	// Leave this empty, as it will be determined by subclasses
    },
    'updateState': function(delta_time){
	var displacement = scale_vec(delta_time/1000, this.velocity);

	var newPosition = add(vec4(displacement[0],displacement[1],0,0),this.position);

	var hasBulletHit = this.hasHitActor();

		if (hasBulletHit) 
		{
			this.alive = false;
		}
		else if (this.world.collidesWithWall(newPosition, 0.5))
		{
			this.alive = false;
		}
		else if (this.world.checkBounds(newPosition))
		{
			this.position=newPosition;
			this.model_transform = mult(translation(displacement[0],displacement[1],0),this.model_transform);
		}
		else {
			this.alive=false;
		}
    },
    'display': function(delta_time)
	{
	    if(!this.alive) return;
	    //the member variable modelTransMat ONLY represents the (x,y) coordinates.
	    var graphics_state = this.world.shared_scratchpad.graphics_state;
	    var model_transform = this.model_transform; 
	    model_transform = mult(model_transform, translation(0,0,0.5));

	    model_transform = mult(model_transform, rotation(this.headingAngle,0,0,1));

	    model_transform = mult(model_transform, scale(0.05,0.15,0.1));

	    //model_transform = mult(mult(model_transform, translation(0,0,1.5)),rotation(headingAngle,0,0,1));

	    shapes_in_use.sphere.draw(graphics_state, model_transform, this.materials.body);
	}
});

Declare_Any_Class( "Bullet", 
{
	'hasHitActor': function()
	{
		var enemyID = this.world.checkEnemyCollision(this, this.position, PROJECTILE_HITBOX);

		if (enemyID != -1)
		{
			this.world.enemies[enemyID].changeHealth(-1);
			this.world.enemies[enemyID].recoil();
			if (!this.world.mute)
			{
				if(this.world.enemies[enemyID].isDevil && (this.world.enemies[enemyID].health+1) % 5 == 0) {
					var audio = new Audio('Audio/cat_hurt.mp3');
					audio.play();
				}
				else if(!this.world.enemies[enemyID].isDevil){
					var audio = new Audio('Audio/dog_hurt.mp3');
					audio.play();
				}
			}
			return true;
		}
		return false;
	},
	'display': function(delta_time)
	{
		if(!this.alive) return;
		var graphics_state = this.world.shared_scratchpad.graphics_state;
		var displacement = scale_vec(delta_time/1000, this.velocity);

		var newPosition = add(vec4(displacement[0],displacement[1],0,0),this.position);

		var hasBulletHit = this.hasHitActor();

		if (hasBulletHit) 
		{
			this.alive = false;
		}
		else if (this.world.collidesWithWall(newPosition, 0.5))
		{
			this.alive = false;
		}
		else if (this.world.checkBounds(newPosition))
		{
			this.position=newPosition;
			this.model_transform = mult(translation(displacement[0],displacement[1],0),this.model_transform);
		}
		else {
			this.alive=false;
		}
		//the member variable modelTransMat ONLY represents the (x,y) coordinates.
		
		var model_transform = this.model_transform; 
		model_transform = mult(model_transform, translation(0,0,0.5));
		model_transform = mult(model_transform, rotation(this.headingAngle,0,0,1));
		model_transform = mult(model_transform, scale(0.05,0.15,0.1));
		model_transform = mult(model_transform, scale(0.75,0.75,0.75));

		shapes_in_use.sphere.draw(graphics_state, model_transform, this.materials.body);
	},
	'populate': function()
	{
		this.materials.body = new Material(Color(0.78,0.53,0,1),0.7,1.0,0,10);
	}
}, Projectile);

Declare_Any_Class( "UZI_Bullet", 
{
	'hasHitActor': function()
	{
		var enemyID = this.world.checkEnemyCollision(this, this.position, PROJECTILE_HITBOX);

		if (enemyID != -1)
		{
			this.world.enemies[enemyID].changeHealth(-1);
			this.world.enemies[enemyID].recoil();
			if (!this.world.mute)
			{
				if(this.world.enemies[enemyID].isDevil && (this.world.enemies[enemyID].health+1) % 5 == 0) {
					var audio = new Audio('Audio/cat_hurt.mp3');
					audio.play();
				}
				else if(!this.world.enemies[enemyID].isDevil){
					var audio = new Audio('Audio/dog_hurt.mp3');
					audio.play();
				}
			}
			return true;
		}
		return false;
	},
	'display': function(delta_time)
	{
		if(!this.alive) return;
		var graphics_state = this.world.shared_scratchpad.graphics_state;
		var displacement = scale_vec(delta_time/1000, this.velocity);

		var newPosition = add(vec4(displacement[0],displacement[1],0,0),this.position);

		var hasBulletHit = this.hasHitActor();

		if (hasBulletHit) 
		{
			this.alive = false;
		}
		else if (this.world.collidesWithWall(newPosition, 0.5))
		{
			this.alive = false;
		}
		else if (this.world.checkBounds(newPosition))
		{
			this.position=newPosition;
			this.model_transform = mult(translation(displacement[0],displacement[1],0),this.model_transform);
		}
		else {
			this.alive=false;
		}
		//the member variable modelTransMat ONLY represents the (x,y) coordinates.
		
		var model_transform = this.model_transform; 
		model_transform = mult(model_transform, translation(0,0,0.5));
		model_transform = mult(model_transform, rotation(this.headingAngle,0,0,1));
		model_transform = mult(model_transform, scale(0.07,0.35,0.07));
		model_transform = mult(model_transform, scale(0.75,0.75,0.75));

		shapes_in_use.cube.draw(graphics_state, model_transform, this.materials.body);
	},
	'populate': function()
	{
		this.materials.body = new Material(Color(0.78,0.43,0,1),0.4,1.0,0,10);
	}
}, Projectile);

Declare_Any_Class( "Shotgun_Bullet", 
{
	'hasHitActor': function()
	{
		var enemyID = this.world.checkEnemyCollision(this, this.position, PROJECTILE_HITBOX);

		if (enemyID != -1)
		{
			this.world.enemies[enemyID].changeHealth(-1);
			this.world.enemies[enemyID].recoil();
			if (!this.world.mute)
			{
				if(this.world.enemies[enemyID].isDevil && (this.world.enemies[enemyID].health+1) % 5 == 0) {
					var audio = new Audio('Audio/cat_hurt.mp3');
					audio.play();
				}
				else if(!this.world.enemies[enemyID].isDevil){
					var audio = new Audio('Audio/dog_hurt.mp3');
					audio.play();
				}
			}
			return true;
		}
		return false;
	},
	'display': function(delta_time)
	{
		if(!this.alive) return;
		var graphics_state = this.world.shared_scratchpad.graphics_state;
		var displacement = scale_vec(delta_time/1000, this.velocity);

		var newPosition = add(vec4(displacement[0],displacement[1],0,0),this.position);

		var hasBulletHit = this.hasHitActor();

		if (hasBulletHit) 
		{
			this.alive = false;
		}
		else if (this.world.collidesWithWall(newPosition, 0.5))
		{
			this.alive = false;
		}
		else if (this.world.checkBounds(newPosition))
		{
			this.position=newPosition;
			this.model_transform = mult(translation(displacement[0],displacement[1],0),this.model_transform);
		}
		else {
			this.alive=false;
		}
		//the member variable modelTransMat ONLY represents the (x,y) coordinates.
		
		var model_transform = this.model_transform; 
		model_transform = mult(model_transform, translation(0,0,0.5));
		model_transform = mult(model_transform, rotation(this.headingAngle,0,0,1));
		model_transform = mult(model_transform, scale(0.05,0.15,0.1));
		model_transform = mult(model_transform, scale(1.25,1.25,1.25));

		shapes_in_use.sphere.draw(graphics_state, model_transform, this.materials.body);
	},
	'populate': function()
	{
		this.materials.body = new Material(Color(0.78,0.43,0,1),0.4,1.0,0,10);
	}
}, Projectile);

Declare_Any_Class( "Rocket", 
{
	'hasHitActor': function()
	{
		var enemyID = this.world.checkEnemyCollision(this, this.position, PROJECTILE_HITBOX);

		if (enemyID != -1)
		{
			this.world.enemies[enemyID].changeHealth(-10);
			this.world.enemies[enemyID].recoil();
			if (!this.world.mute)
			{
				if(this.world.enemies[enemyID].isDevil && (this.world.enemies[enemyID].health+1) % 5 == 0) {
					var audio = new Audio('Audio/cat_hurt.mp3');
					audio.play();
				}
				else if(!this.world.enemies[enemyID].isDevil){
					var audio = new Audio('Audio/dog_hurt.mp3');
					audio.play();
				}
			}
			return true;
		}
		return false;
	},
	'display': function(delta_time)
	{
		if(!this.alive) return;
		var graphics_state = this.world.shared_scratchpad.graphics_state;
		var displacement = scale_vec(delta_time/1000, this.velocity);

		var newPosition = add(vec4(displacement[0],displacement[1],0,0),this.position);

		var hasBulletHit = this.hasHitActor();

		if (hasBulletHit) 
		{
			this.alive = false;
		}
		else if (this.world.collidesWithWall(newPosition, 0.5))
		{
			this.alive = false;
		}
		else if (this.world.checkBounds(newPosition))
		{
			this.position=newPosition;
			this.model_transform = mult(translation(displacement[0],displacement[1],0),this.model_transform);
		}
		else {
			this.alive=false;
		}
		//the member variable modelTransMat ONLY represents the (x,y) coordinates.
		
		var model_transform = this.model_transform; 
		model_transform = mult(model_transform, translation(0,0,0.5));
		model_transform = mult(model_transform, rotation(this.headingAngle,0,0,1));
		model_transform = mult(model_transform, scale(0.07,0.35,0.07));
		model_transform = mult(model_transform, scale(2.75,2.75,2.75));

		shapes_in_use.sphere.draw(graphics_state, model_transform, this.materials.body);
	},
	'populate': function()
	{
		this.velocity = scale_vec(0.5, this.velocity);
		this.materials.body = new Material(Color(0.78,0.73,0.7,1),0.7,1.0,0,10);
	}
}, Projectile);

Declare_Any_Class( "Enemy_Bullet", 
{
	'hasHitActor': function()
	{
		if (this.world.checkPlayerCollision(this.position, PROJECTILE_HITBOX))
		{
			this.world.player.changeHealth(-ENEMY_BULLET_DAMAGE);
			return true;
		}
		return false;
	},	
	'populate': function()
	{
		this.materials.body = new Material(Color(1.0,0,0,1),1,.8,0,10);
	    this.velocity = scale_vec(0.5, this.velocity);
	}
}, Projectile);
